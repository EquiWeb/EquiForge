import { createFileRoute } from '@tanstack/react-router'
import { requireApiKey } from '#/lib/apiAuth'
import { getConvexClient, api } from '#/lib/convex'
import type { Id } from '../../convex/_generated/dataModel'

// ---------------------------------------------------------------------------
// S3-compatible HTTP endpoints
// Routes: /s3/{bucket} and /s3/{bucket}/{key...}
//
// Authenticated via API key (Authorization: Bearer eqf_...)
// ---------------------------------------------------------------------------

function parsePath(splatPath: string): { bucket: string; key: string | null } {
  const parts = splatPath.replace(/^\/+/, '').split('/')
  const bucket = parts[0] ?? ''
  const key = parts.length > 1 ? parts.slice(1).join('/') : null
  return { bucket, key }
}

function xmlError(code: string, message: string, status: number): Response {
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n<Error><Code>${code}</Code><Message>${message}</Message></Error>`,
    {
      status,
      headers: { 'Content-Type': 'application/xml' },
    },
  )
}

// ---- PUT: Create bucket or upload object ----

async function handlePut(request: Request, splatPath: string): Promise<Response> {
  const authResult = await requireApiKey(request, 'storage')
  if (authResult instanceof Response) return authResult

  const client = getConvexClient()
  const userId = authResult.userId as Id<'users'>
  const { bucket, key } = parsePath(splatPath)

  if (!bucket) {
    return xmlError('InvalidBucketName', 'Bucket name is required', 400)
  }

  // PUT /s3/{bucket} — create bucket
  if (!key) {
    const account = await client.query(api.mcp.apiGetAccountForUser as any, { userId })
    if (!account) {
      return xmlError('NoSuchAccount', 'No account found for this user', 404)
    }

    try {
      const bucketId = await client.mutation(api.storage.apiCreateBucket as any, {
        userId,
        accountId: account._id,
        name: bucket,
        region: request.headers.get('x-amz-bucket-region') ?? 'us-east-1',
      })
      return new Response(null, {
        status: 200,
        headers: { Location: `/${bucket}`, 'x-amz-bucket-id': bucketId },
      })
    } catch (err: any) {
      if (err.message?.includes('already exists')) {
        return xmlError('BucketAlreadyExists', 'Bucket name already exists', 409)
      }
      return xmlError('InternalError', err.message, 500)
    }
  }

  // PUT /s3/{bucket}/{key} — upload object
  const bucketDoc = await client.query(api.storage.getBucketByName as any, { name: bucket })
  if (!bucketDoc) {
    return xmlError('NoSuchBucket', `Bucket '${bucket}' not found`, 404)
  }

  // Step 1: Get upload URL from Convex
  const uploadUrl = await client.mutation(api.storage.generateUploadUrl as any, {})

  // Step 2: Stream the request body to Convex storage
  const contentType = request.headers.get('Content-Type') ?? 'application/octet-stream'
  const body = await request.arrayBuffer()
  const size = body.byteLength

  const uploadResponse = await fetch(uploadUrl, {
    method: 'POST',
    headers: { 'Content-Type': contentType },
    body,
  })

  if (!uploadResponse.ok) {
    return xmlError('InternalError', 'Failed to upload to storage backend', 500)
  }

  const { storageId } = (await uploadResponse.json()) as { storageId: string }

  // Step 3: Compute ETag (MD5 of content)
  const hashBuffer = await crypto.subtle.digest('MD5', body).catch(() => {
    // MD5 not available in all runtimes, fall back to SHA-256
    return crypto.subtle.digest('SHA-256', body)
  })
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const etag = `"${hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')}"`

  // Step 4: Record the object in Convex
  await client.mutation(api.storage.apiPutObject as any, {
    userId,
    bucketId: bucketDoc._id,
    key,
    storageId,
    size,
    contentType,
    etag,
  })

  return new Response(null, {
    status: 200,
    headers: { ETag: etag },
  })
}

// ---- GET: Download object or list objects ----

async function handleGet(request: Request, splatPath: string): Promise<Response> {
  const authResult = await requireApiKey(request, 'storage')
  if (authResult instanceof Response) return authResult

  const client = getConvexClient()
  const { bucket, key } = parsePath(splatPath)

  if (!bucket) {
    return xmlError('InvalidBucketName', 'Bucket name is required', 400)
  }

  const bucketDoc = await client.query(api.storage.getBucketByName as any, { name: bucket })
  if (!bucketDoc) {
    return xmlError('NoSuchBucket', `Bucket '${bucket}' not found`, 404)
  }

  // GET /s3/{bucket}?list-type=2 — list objects (S3 ListObjectsV2)
  if (!key) {
    const url = new URL(request.url)
    const prefix = url.searchParams.get('prefix') ?? undefined
    const maxKeys = url.searchParams.get('max-keys')
      ? parseInt(url.searchParams.get('max-keys')!, 10)
      : undefined

    const result = await client.query(api.storage.listObjects as any, {
      bucketId: bucketDoc._id,
      prefix,
      maxKeys,
    })

    const contentsXml = result.objects
      .map(
        (obj: any) =>
          `<Contents>` +
          `<Key>${escapeXml(obj.key)}</Key>` +
          `<LastModified>${obj.lastModified}</LastModified>` +
          `<ETag>${escapeXml(obj.etag)}</ETag>` +
          `<Size>${obj.size}</Size>` +
          `<StorageClass>STANDARD</StorageClass>` +
          `</Contents>`,
      )
      .join('\n')

    const xml =
      `<?xml version="1.0" encoding="UTF-8"?>\n` +
      `<ListBucketResult xmlns="http://s3.amazonaws.com/doc/2006-03-01/">` +
      `<Name>${escapeXml(bucket)}</Name>` +
      `<Prefix>${escapeXml(prefix ?? '')}</Prefix>` +
      `<KeyCount>${result.keyCount}</KeyCount>` +
      `<MaxKeys>${maxKeys ?? 1000}</MaxKeys>` +
      `<IsTruncated>${result.isTruncated}</IsTruncated>` +
      contentsXml +
      `</ListBucketResult>`

    return new Response(xml, {
      status: 200,
      headers: { 'Content-Type': 'application/xml' },
    })
  }

  // GET /s3/{bucket}/{key} — download object
  const obj = await client.query(api.storage.getObject as any, {
    bucketId: bucketDoc._id,
    key,
  })

  if (!obj) {
    return xmlError('NoSuchKey', `Object '${key}' not found`, 404)
  }

  // Redirect to the Convex storage download URL
  return Response.redirect(obj.url, 302)
}

// ---- DELETE: Delete bucket or object ----

async function handleDelete(request: Request, splatPath: string): Promise<Response> {
  const authResult = await requireApiKey(request, 'storage')
  if (authResult instanceof Response) return authResult

  const client = getConvexClient()
  const userId = authResult.userId as Id<'users'>
  const { bucket, key } = parsePath(splatPath)

  if (!bucket) {
    return xmlError('InvalidBucketName', 'Bucket name is required', 400)
  }

  const bucketDoc = await client.query(api.storage.getBucketByName as any, { name: bucket })
  if (!bucketDoc) {
    return xmlError('NoSuchBucket', `Bucket '${bucket}' not found`, 404)
  }

  // DELETE /s3/{bucket} — delete bucket
  if (!key) {
    try {
      await client.mutation(api.storage.apiDeleteBucket as any, {
        userId,
        bucketId: bucketDoc._id,
      })
      return new Response(null, { status: 204 })
    } catch (err: any) {
      if (err.message?.includes('not empty')) {
        return xmlError('BucketNotEmpty', 'Bucket is not empty', 409)
      }
      return xmlError('InternalError', err.message, 500)
    }
  }

  // DELETE /s3/{bucket}/{key} — delete object
  try {
    await client.mutation(api.storage.apiDeleteObject as any, {
      userId,
      bucketId: bucketDoc._id,
      key,
    })
    return new Response(null, { status: 204 })
  } catch (err: any) {
    if (err.message?.includes('not found')) {
      return xmlError('NoSuchKey', `Object '${key}' not found`, 404)
    }
    return xmlError('InternalError', err.message, 500)
  }
}

// ---- HEAD: Object metadata ----

async function handleHead(request: Request, splatPath: string): Promise<Response> {
  const authResult = await requireApiKey(request, 'storage')
  if (authResult instanceof Response) return authResult

  const client = getConvexClient()
  const { bucket, key } = parsePath(splatPath)

  if (!bucket || !key) {
    return new Response(null, { status: 400 })
  }

  const bucketDoc = await client.query(api.storage.getBucketByName as any, { name: bucket })
  if (!bucketDoc) {
    return new Response(null, { status: 404 })
  }

  const obj = await client.query(api.storage.getObject as any, {
    bucketId: bucketDoc._id,
    key,
  })

  if (!obj) {
    return new Response(null, { status: 404 })
  }

  return new Response(null, {
    status: 200,
    headers: {
      'Content-Type': obj.contentType,
      'Content-Length': String(obj.size),
      ETag: obj.etag,
      'Last-Modified': obj.updatedAt,
    },
  })
}

// ---- Helpers ----

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

// ---- Route definition ----

export const Route = createFileRoute('/s3/$')({
  server: {
    handlers: {
      PUT: async ({ request, params }) => {
        return handlePut(request, (params as any)._ ?? '')
      },
      GET: async ({ request, params }) => {
        return handleGet(request, (params as any)._ ?? '')
      },
      DELETE: async ({ request, params }) => {
        return handleDelete(request, (params as any)._ ?? '')
      },
      HEAD: async ({ request, params }) => {
        return handleHead(request, (params as any)._ ?? '')
      },
    },
  },
})
