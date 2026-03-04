import { createFileRoute } from '@tanstack/react-router'
import { requireApiKey } from '#/lib/apiAuth'
import { getAdminConvexClient, internal } from '#/lib/convex'
import {
  computePrice,
  isPriceError,
  type S3Operation,
  type ServiceStatus,
  type PriceResult,
} from '#/lib/pricing'
import {
  getPaymentHeader,
  processPayment,
  createPaymentRequiredResponse,
  getWalletAddress,
  getNetworkName,
} from '#/lib/x402'
import type { Id } from '../../convex/_generated/dataModel'
import type { FunctionReference } from 'convex/server'

// ---------------------------------------------------------------------------
// S3-compatible HTTP endpoints with x402 payment gating
// Routes: /s3/{bucket} and /s3/{bucket}/{key...}
//
// Authenticated via API key (Authorization: Bearer eqf_...)
// Uses admin Convex client to call internal functions.
//
// Payment flow:
// 1. Authenticate → look up account → find storage service → check status
// 2. Compute price server-side based on operation + size + status
// 3. If no PAYMENT-SIGNATURE header → return 402 with requirements
// 4. If header present → verify → settle → execute → record billing event
// 5. DELETE is always free (no payment required)
// ---------------------------------------------------------------------------

// Helper: cast internal function refs to satisfy ConvexHttpClient's public-only types.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function asPublic<T extends FunctionReference<any, any>>(ref: T) {
  return ref as unknown as FunctionReference<T['_type'], 'public'>
}

function parsePath(splatPath: string): { bucket: string; key: string | null } {
  const parts = splatPath.replace(/^\/+/, '').split('/')
  const bucket = decodeURIComponent(parts[0] ?? '')
  const key = parts.length > 1 ? parts.slice(1).map(decodeURIComponent).join('/') : null
  return { bucket, key }
}

function xmlError(code: string, message: string, status: number): Response {
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n<Error><Code>${escapeXml(code)}</Code><Message>${escapeXml(message)}</Message></Error>`,
    {
      status,
      headers: { 'Content-Type': 'application/xml' },
    },
  )
}

async function computeETag(data: ArrayBuffer): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return `"${hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')}"`
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

// ---------------------------------------------------------------------------
// Auth + service lookup helper
// ---------------------------------------------------------------------------

interface AuthContext {
  userId: Id<'users'>
  accountId: Id<'accounts'>
  serviceId: Id<'storageServices'>
  serviceStatus: ServiceStatus
}

/**
 * Authenticate the request and look up the storage service.
 * Returns an AuthContext or an error Response.
 */
async function authenticateAndGetService(
  request: Request,
): Promise<AuthContext | Response> {
  const authResult = await requireApiKey(request, 'storage')
  if (authResult instanceof Response) {
    const body = (await authResult.json()) as { error: string }
    return xmlError('AccessDenied', body.error ?? 'Access denied', authResult.status)
  }

  const client = getAdminConvexClient()
  const userId = authResult.userId as Id<'users'>

  // Look up account
  const account = await client.query(
    asPublic(internal.mcp.apiGetAccountForUser),
    { userId },
  )
  if (!account) {
    return xmlError('NoSuchAccount', 'No account found for this user', 404)
  }

  // Look up storage service
  const service = await client.query(
    asPublic(internal.billing.getServiceForAccount),
    { accountId: account._id },
  )
  if (!service) {
    return xmlError(
      'NoSuchService',
      'No storage service found. Provision one first via the MCP API.',
      404,
    )
  }

  return {
    userId,
    accountId: account._id,
    serviceId: service._id,
    serviceStatus: service.status as ServiceStatus,
  }
}

// ---------------------------------------------------------------------------
// Payment enforcement helper
// ---------------------------------------------------------------------------

/**
 * Enforce x402 payment for an S3 operation.
 *
 * If the operation is free (DELETE) or $0, returns null (proceed).
 * If no payment header, returns a 402 Response.
 * If payment is present, verifies + settles and records the billing event.
 * Returns null on success (proceed with operation), or a Response on error.
 */
async function enforcePayment(
  request: Request,
  operation: S3Operation,
  auth: AuthContext,
  opts: {
    sizeBytes?: number
    bucketId?: Id<'storageBuckets'>
    objectKey?: string
  } = {},
): Promise<{ response: Response } | { priceResult: PriceResult; paymentHeaders: Record<string, string> }> {
  // Compute price server-side
  const priceOutcome = computePrice({
    operation,
    status: auth.serviceStatus,
    sizeBytes: opts.sizeBytes,
  })

  // Check if operation is blocked
  if (isPriceError(priceOutcome)) {
    if (priceOutcome.code === 'BLOCKED_GRACE') {
      return { response: xmlError('ServiceInGrace', priceOutcome.message, 403) }
    }
    return { response: xmlError('ServiceUnavailable', priceOutcome.message, 403) }
  }

  const priceResult = priceOutcome

  // Free operations (DELETE, $0 charges) — skip payment
  if (priceResult.amountUsd === 0) {
    return { priceResult, paymentHeaders: {} }
  }

  // Check for payment header
  const paymentHeader = getPaymentHeader(request)

  if (!paymentHeader) {
    // No payment — return 402
    const url = new URL(request.url)
    const paymentResponse = await createPaymentRequiredResponse(priceResult, {
      url: url.pathname,
      description: `S3 ${operation} operation`,
      mimeType: operation === 'GET' ? 'application/octet-stream' : 'application/xml',
    })
    return { response: paymentResponse }
  }

  // Payment present — verify and settle
  const paymentResult = await processPayment(paymentHeader, priceResult.amountUsd)

  if (!paymentResult.success) {
    return {
      response: new Response(
        JSON.stringify({
          error: paymentResult.message,
          reason: paymentResult.reason,
        }),
        {
          status: paymentResult.statusCode,
          headers: { 'Content-Type': 'application/json' },
        },
      ),
    }
  }

  // Check for duplicate tx hash (replay protection)
  const client = getAdminConvexClient()
  const isDuplicate = await client.query(
    asPublic(internal.billing.checkTxHashExists),
    { txHash: paymentResult.txHash },
  )
  if (isDuplicate) {
    return {
      response: new Response(
        JSON.stringify({
          error: 'Duplicate payment — this transaction has already been used',
          txHash: paymentResult.txHash,
        }),
        { status: 409, headers: { 'Content-Type': 'application/json' } },
      ),
    }
  }

  // Record billing event
  await client.mutation(asPublic(internal.billing.recordBillingEvent), {
    accountId: auth.accountId,
    serviceId: auth.serviceId,
    bucketId: opts.bucketId,
    objectKey: opts.objectKey,
    operation,
    amountUsd: priceResult.amountUsd,
    sizeBytes: opts.sizeBytes,
    wasGracePeriod: priceResult.wasGracePeriod,
    txHash: paymentResult.txHash,
    facilitatorResponse: JSON.stringify(paymentResult.settleResponse),
    network: getNetworkName(),
    payerAddress: paymentResult.payerAddress,
    receiverAddress: getWalletAddress(),
    settledAt: new Date().toISOString(),
  })

  return { priceResult, paymentHeaders: paymentResult.responseHeaders }
}

// ---- PUT: Create bucket or upload object ----

async function handlePut(request: Request, splatPath: string): Promise<Response> {
  const authOrError = await authenticateAndGetService(request)
  if (authOrError instanceof Response) return authOrError
  const auth = authOrError

  const client = getAdminConvexClient()
  const { bucket, key } = parsePath(splatPath)

  if (!bucket) {
    return xmlError('InvalidBucketName', 'Bucket name is required', 400)
  }

  // PUT /s3/{bucket} — create bucket
  if (!key) {
    // Price: CREATE_BUCKET operation
    const priceOutcome = computePrice({
      operation: 'CREATE_BUCKET',
      status: auth.serviceStatus,
    })

    if (isPriceError(priceOutcome)) {
      return xmlError('ServiceUnavailable', priceOutcome.message, 403)
    }

    const paymentHeader = getPaymentHeader(request)
    if (!paymentHeader) {
      const url = new URL(request.url)
      return await createPaymentRequiredResponse(priceOutcome, {
        url: url.pathname,
        description: `Create bucket "${bucket}"`,
        mimeType: 'application/xml',
      })
    }

    const paymentResult = await processPayment(paymentHeader, priceOutcome.amountUsd)
    if (!paymentResult.success) {
      return new Response(
        JSON.stringify({ error: paymentResult.message, reason: paymentResult.reason }),
        { status: paymentResult.statusCode, headers: { 'Content-Type': 'application/json' } },
      )
    }

    // Check duplicate
    const isDup = await client.query(
      asPublic(internal.billing.checkTxHashExists),
      { txHash: paymentResult.txHash },
    )
    if (isDup) {
      return new Response(
        JSON.stringify({ error: 'Duplicate payment', txHash: paymentResult.txHash }),
        { status: 409, headers: { 'Content-Type': 'application/json' } },
      )
    }

    // Execute the bucket creation
    try {
      const bucketId = await client.mutation(asPublic(internal.storage.apiCreateBucket), {
        userId: auth.userId,
        accountId: auth.accountId,
        name: bucket,
        region: request.headers.get('x-amz-bucket-region') ?? 'us-east-1',
      })

      // Record billing event
      await client.mutation(asPublic(internal.billing.recordBillingEvent), {
        accountId: auth.accountId,
        serviceId: auth.serviceId,
        bucketId: bucketId as Id<'storageBuckets'>,
        operation: 'CREATE_BUCKET',
        amountUsd: priceOutcome.amountUsd,
        wasGracePeriod: false,
        txHash: paymentResult.txHash,
        facilitatorResponse: JSON.stringify(paymentResult.settleResponse),
        network: getNetworkName(),
        payerAddress: paymentResult.payerAddress,
        receiverAddress: getWalletAddress(),
        settledAt: new Date().toISOString(),
      })

      return new Response(null, {
        status: 200,
        headers: {
          Location: `/${bucket}`,
          'x-amz-bucket-id': bucketId,
          ...paymentResult.responseHeaders,
        },
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      if (message.includes('already exists')) {
        return xmlError('BucketAlreadyExists', 'Bucket name already exists', 409)
      }
      return xmlError('InternalError', message, 500)
    }
  }

  // PUT /s3/{bucket}/{key} — upload object
  const bucketDoc = await client.query(asPublic(internal.storage.getBucketByName), { name: bucket })
  if (!bucketDoc) {
    return xmlError('NoSuchBucket', `Bucket '${bucket}' not found`, 404)
  }

  // Read body to compute size for pricing
  const body = await request.arrayBuffer()
  const size = body.byteLength

  // Enforce payment for PUT (price based on size)
  const paymentEnforcement = await enforcePayment(request, 'PUT', auth, {
    sizeBytes: size,
    bucketId: bucketDoc._id,
    objectKey: key,
  })
  if ('response' in paymentEnforcement) return paymentEnforcement.response

  // Payment confirmed — proceed with upload
  const contentType = request.headers.get('Content-Type') ?? 'application/octet-stream'
  const uploadUrl = await client.mutation(asPublic(internal.storage.generateUploadUrl), {})

  const uploadResponse = await fetch(uploadUrl, {
    method: 'POST',
    headers: { 'Content-Type': contentType },
    body,
  })

  if (!uploadResponse.ok) {
    return xmlError('InternalError', 'Failed to upload to storage backend', 500)
  }

  const { storageId } = (await uploadResponse.json()) as { storageId: string }
  const etag = await computeETag(body)

  await client.mutation(asPublic(internal.storage.apiPutObject), {
    userId: auth.userId,
    bucketId: bucketDoc._id,
    key,
    storageId: storageId as Id<'_storage'>,
    size,
    contentType,
    etag,
  })

  return new Response(null, {
    status: 200,
    headers: {
      ETag: etag,
      ...paymentEnforcement.paymentHeaders,
    },
  })
}

// ---- GET: Download object or list objects ----

async function handleGet(request: Request, splatPath: string): Promise<Response> {
  const authOrError = await authenticateAndGetService(request)
  if (authOrError instanceof Response) return authOrError
  const auth = authOrError

  const client = getAdminConvexClient()
  const { bucket, key } = parsePath(splatPath)

  if (!bucket) {
    return xmlError('InvalidBucketName', 'Bucket name is required', 400)
  }

  const bucketDoc = await client.query(asPublic(internal.storage.getBucketByName), { name: bucket })
  if (!bucketDoc) {
    return xmlError('NoSuchBucket', `Bucket '${bucket}' not found`, 404)
  }

  // GET /s3/{bucket}?list-type=2 — list objects (S3 ListObjectsV2)
  if (!key) {
    // Enforce payment for LIST
    const paymentEnforcement = await enforcePayment(request, 'LIST', auth, {
      bucketId: bucketDoc._id,
    })
    if ('response' in paymentEnforcement) return paymentEnforcement.response

    const url = new URL(request.url)
    const prefix = url.searchParams.get('prefix') ?? undefined
    const maxKeys = url.searchParams.get('max-keys')
      ? parseInt(url.searchParams.get('max-keys')!, 10)
      : undefined

    const result = await client.query(asPublic(internal.storage.listObjects), {
      bucketId: bucketDoc._id,
      prefix,
      maxKeys,
    })

    const contentsXml = result.objects
      .map(
        (obj: { key: string; lastModified: string; etag: string; size: number }) =>
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
      headers: {
        'Content-Type': 'application/xml',
        ...paymentEnforcement.paymentHeaders,
      },
    })
  }

  // GET /s3/{bucket}/{key} — download object
  // First look up the object to get its size for pricing
  const obj = await client.query(asPublic(internal.storage.getObject), {
    bucketId: bucketDoc._id,
    key,
  })

  if (!obj) {
    return xmlError('NoSuchKey', `Object '${key}' not found`, 404)
  }

  if (!obj.url) {
    return xmlError('InternalError', 'Object storage URL is unavailable', 500)
  }

  // Enforce payment for GET (price based on stored object size)
  const paymentEnforcement = await enforcePayment(request, 'GET', auth, {
    sizeBytes: obj.size,
    bucketId: bucketDoc._id,
    objectKey: key,
  })
  if ('response' in paymentEnforcement) return paymentEnforcement.response

  // Redirect to the Convex storage download URL
  // Note: We can't add custom headers to a redirect, but the payment response
  // header was already validated. The client gets the settlement receipt
  // from the response.
  return Response.redirect(obj.url, 302)
}

// ---- DELETE: Delete bucket or object (always FREE) ----

async function handleDelete(request: Request, splatPath: string): Promise<Response> {
  const authOrError = await authenticateAndGetService(request)
  if (authOrError instanceof Response) return authOrError
  const auth = authOrError

  const client = getAdminConvexClient()
  const { bucket, key } = parsePath(splatPath)

  if (!bucket) {
    return xmlError('InvalidBucketName', 'Bucket name is required', 400)
  }

  const bucketDoc = await client.query(asPublic(internal.storage.getBucketByName), { name: bucket })
  if (!bucketDoc) {
    return xmlError('NoSuchBucket', `Bucket '${bucket}' not found`, 404)
  }

  // DELETE /s3/{bucket} — delete bucket
  if (!key) {
    try {
      await client.mutation(asPublic(internal.storage.apiDeleteBucket), {
        userId: auth.userId,
        bucketId: bucketDoc._id,
      })
      return new Response(null, { status: 204 })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      if (message.includes('not empty')) {
        return xmlError('BucketNotEmpty', 'Bucket is not empty', 409)
      }
      return xmlError('InternalError', message, 500)
    }
  }

  // DELETE /s3/{bucket}/{key} — delete object
  try {
    await client.mutation(asPublic(internal.storage.apiDeleteObject), {
      userId: auth.userId,
      bucketId: bucketDoc._id,
      key,
    })
    return new Response(null, { status: 204 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    if (message.includes('not found')) {
      return xmlError('NoSuchKey', `Object '${key}' not found`, 404)
    }
    return xmlError('InternalError', message, 500)
  }
}

// ---- HEAD: Object metadata ----

async function handleHead(request: Request, splatPath: string): Promise<Response> {
  const authOrError = await authenticateAndGetService(request)
  if (authOrError instanceof Response) return authOrError
  const auth = authOrError

  const client = getAdminConvexClient()
  const { bucket, key } = parsePath(splatPath)

  if (!bucket || !key) {
    return new Response(null, { status: 400 })
  }

  const bucketDoc = await client.query(asPublic(internal.storage.getBucketByName), { name: bucket })
  if (!bucketDoc) {
    return new Response(null, { status: 404 })
  }

  const obj = await client.query(asPublic(internal.storage.getObject), {
    bucketId: bucketDoc._id,
    key,
  })

  if (!obj) {
    return new Response(null, { status: 404 })
  }

  // Enforce payment for HEAD
  const paymentEnforcement = await enforcePayment(request, 'HEAD', auth, {
    bucketId: bucketDoc._id,
    objectKey: key,
  })
  if ('response' in paymentEnforcement) return paymentEnforcement.response

  return new Response(null, {
    status: 200,
    headers: {
      'Content-Type': obj.contentType,
      'Content-Length': String(obj.size),
      ETag: obj.etag,
      'Last-Modified': new Date(obj.updatedAt).toUTCString(),
      ...paymentEnforcement.paymentHeaders,
    },
  })
}

// ---- Route definition ----

export const Route = createFileRoute('/s3/$')({
  server: {
    handlers: {
      PUT: async ({ request, params }) => {
        return handlePut(request, (params as Record<string, string>)._splat ?? '')
      },
      GET: async ({ request, params }) => {
        return handleGet(request, (params as Record<string, string>)._splat ?? '')
      },
      DELETE: async ({ request, params }) => {
        return handleDelete(request, (params as Record<string, string>)._splat ?? '')
      },
      HEAD: async ({ request, params }) => {
        return handleHead(request, (params as Record<string, string>)._splat ?? '')
      },
    },
  },
})
