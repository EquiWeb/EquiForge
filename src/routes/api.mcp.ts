import { createFileRoute } from '@tanstack/react-router'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js'
import { z } from 'zod'
import { requireApiKey, type ApiKeyAuth } from '#/lib/apiAuth'
import { getAdminConvexClient, internal } from '#/lib/convex'
import type { Id } from '../../convex/_generated/dataModel'
import type { FunctionReference } from 'convex/server'

// Helper: cast internal function refs to satisfy ConvexHttpClient's public-only types.
// The admin client can call internal functions at runtime.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function asPublic<T extends FunctionReference<any, any>>(ref: T) {
  return ref as unknown as FunctionReference<T['_type'], 'public'>
}

// Helper: wrap a tool handler to catch Convex/runtime errors and return MCP error responses.
function safeTool<Args extends Record<string, unknown>>(
  handler: (args: Args) => Promise<{ content: { type: 'text'; text: string }[]; isError?: boolean }>,
) {
  return async (args: Args) => {
    try {
      return await handler(args)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      return {
        content: [{ type: 'text' as const, text: JSON.stringify({ error: message }) }],
        isError: true,
      }
    }
  }
}

// ---------------------------------------------------------------------------
// MCP Server factory — creates a fresh McpServer with all tools registered.
// Each request gets its own server+transport (stateless mode).
// ---------------------------------------------------------------------------

function createMcpServerForUser(auth: ApiKeyAuth) {
  const server = new McpServer({
    name: 'equiforge',
    version: '1.0.0',
  })

  const client = getAdminConvexClient()
  const userId = auth.userId as Id<'users'>

  // ----- Account tools -----

  server.tool(
    'create_account',
    'Create a new EquiForge account for an agent org',
    {
      orgName: z.string().describe('Organization name'),
      contact: z.string().describe('Contact email'),
    },
    safeTool(async ({ orgName, contact }) => {
      const accountId = await client.mutation(asPublic(internal.mcp.apiCreateAccount), {
        userId,
        orgName,
        contact,
      })
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify({ accountId, status: 'created', orgName, contact }),
          },
        ],
      }
    }),
  )

  server.tool(
    'check_status',
    'Check account and service status for the authenticated user',
    {},
    safeTool(async () => {
      const account = await client.query(asPublic(internal.mcp.apiGetAccountForUser), {
        userId,
      })
      if (!account) {
        return {
          content: [{ type: 'text' as const, text: JSON.stringify({ error: 'No account found' }) }],
          isError: true,
        }
      }

      const services = await client.query(asPublic(internal.mcp.apiListStorageServices), {
        userId,
      })

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify({
              account: {
                id: account._id,
                orgName: account.orgName,
                contact: account.contact,
                paymentProfiles: account.paymentProfiles,
                createdAt: account.createdAt,
              },
              services: services.map((s: { _id: string; project: string; region: string; status: string; endpoint: string; createdAt: string }) => ({
                id: s._id,
                project: s.project,
                region: s.region,
                status: s.status,
                endpoint: s.endpoint,
                createdAt: s.createdAt,
              })),
            }),
          },
        ],
      }
    }),
  )

  // ----- Payment tools -----

  server.tool(
    'attach_payment',
    'Bind x402 payment credentials to an account',
    {
      accountId: z.string().describe('Account ID'),
      profile: z.string().describe('Payment profile identifier'),
      wallet: z.string().describe('Wallet address (e.g. x402://wallet/0x...)'),
    },
    safeTool(async ({ accountId, profile, wallet }) => {
      const result = await client.mutation(asPublic(internal.mcp.apiAttachPaymentProfile), {
        userId,
        accountId: accountId as Id<'accounts'>,
        profile,
        wallet,
      })
      if (result && 'error' in result) {
        return {
          content: [{ type: 'text' as const, text: JSON.stringify({ error: result.error }) }],
          isError: true,
        }
      }
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify({ status: 'attached', accountId, profile, wallet }),
          },
        ],
      }
    }),
  )

  // ----- Storage provisioning tools -----

  server.tool(
    'provision_storage',
    'Provision S3-compatible storage with quotas',
    {
      accountId: z.string().describe('Account ID'),
      project: z.string().describe('Project name'),
      region: z.string().describe('Storage region (e.g. us-east-1)'),
      usageCapGb: z.number().optional().describe('Usage cap in GB'),
      paymentProfile: z.string().describe('Payment profile to use'),
    },
    safeTool(async ({ accountId, project, region, usageCapGb, paymentProfile }) => {
      const result = await client.mutation(asPublic(internal.mcp.apiCreateStorageService), {
        userId,
        accountId: accountId as Id<'accounts'>,
        project,
        region,
        usageCapGb,
        paymentProfile,
      })

      if (typeof result === 'object' && result !== null && 'error' in result) {
        return {
          content: [{ type: 'text' as const, text: JSON.stringify({ error: result.error }) }],
          isError: true,
        }
      }

      // Fetch the created service to return full details
      const service = await client.query(asPublic(internal.mcp.apiGetStorageService), {
        serviceId: result as Id<'storageServices'>,
      })

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify({
              serviceId: result,
              status: 'provisioned',
              project,
              region,
              endpoint: service?.endpoint,
              accessKeyId: service?.accessKeyId,
              secretAccessKey: service?.secretAccessKey,
            }),
          },
        ],
      }
    }),
  )

  server.tool(
    'rotate_keys',
    'Rotate access keys for a storage service',
    {
      serviceId: z.string().describe('Storage service ID'),
      reason: z.string().optional().describe('Reason for rotation'),
    },
    safeTool(async ({ serviceId, reason }) => {
      const result = await client.mutation(asPublic(internal.mcp.apiRotateStorageKeys), {
        userId,
        serviceId: serviceId as Id<'storageServices'>,
        reason,
      })

      if (typeof result === 'object' && result !== null && 'error' in result) {
        return {
          content: [{ type: 'text' as const, text: JSON.stringify({ error: result.error }) }],
          isError: true,
        }
      }

      const service = await client.query(asPublic(internal.mcp.apiGetStorageService), {
        serviceId: serviceId as Id<'storageServices'>,
      })

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify({
              serviceId,
              status: 'rotated',
              accessKeyId: service?.accessKeyId,
              secretAccessKey: service?.secretAccessKey,
              rotatedAt: result.updatedAt,
              reason: result.reason,
            }),
          },
        ],
      }
    }),
  )

  // ----- S3 Bucket tools -----

  server.tool(
    'create_bucket',
    'Create an S3-compatible storage bucket',
    {
      accountId: z.string().describe('Account ID'),
      name: z.string().describe('Bucket name (globally unique)'),
      region: z.string().describe('Bucket region'),
      isPublic: z.boolean().optional().describe('Whether bucket is publicly readable'),
    },
    safeTool(async ({ accountId, name, region, isPublic }) => {
      const bucketId = await client.mutation(asPublic(internal.storage.apiCreateBucket), {
        userId,
        accountId: accountId as Id<'accounts'>,
        name,
        region,
        isPublic,
      })
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify({ bucketId, name, region, status: 'created' }),
          },
        ],
      }
    }),
  )

  server.tool(
    'list_buckets',
    'List storage buckets for an account',
    {
      accountId: z.string().describe('Account ID'),
    },
    safeTool(async ({ accountId }) => {
      const buckets = await client.query(asPublic(internal.storage.apiListBuckets), {
        userId,
        accountId: accountId as Id<'accounts'>,
      })
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify({
              buckets: buckets.map((b: { _id: string; name: string; region: string; isPublic: boolean; createdAt: string }) => ({
                id: b._id,
                name: b.name,
                region: b.region,
                isPublic: b.isPublic,
                createdAt: b.createdAt,
              })),
            }),
          },
        ],
      }
    }),
  )

  // ----- S3 Object tools -----

  server.tool(
    'put_object',
    'Upload an object to a bucket (returns an upload URL for the body)',
    {
      bucketName: z.string().describe('Bucket name'),
      key: z.string().describe('Object key (path)'),
      contentType: z.string().optional().describe('MIME type'),
      size: z.number().describe('Object size in bytes'),
    },
    safeTool(async ({ bucketName, key, contentType, size }) => {
      const bucket = await client.query(asPublic(internal.storage.getBucketByName), { name: bucketName })
      if (!bucket) {
        return {
          content: [{ type: 'text' as const, text: JSON.stringify({ error: 'Bucket not found' }) }],
          isError: true,
        }
      }

      // Generate an upload URL from Convex
      const uploadUrl = await client.mutation(asPublic(internal.storage.generateUploadUrl), {})

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify({
              uploadUrl,
              bucketId: bucket._id,
              key,
              contentType: contentType ?? 'application/octet-stream',
              size,
              instructions:
                'POST the file body to uploadUrl with Content-Type header. ' +
                'The response contains a storageId. Then call put_object_complete ' +
                'with the storageId to finalize the object record.',
            }),
          },
        ],
      }
    }),
  )

  server.tool(
    'put_object_complete',
    'Finalize an object upload after uploading to the Convex storage URL',
    {
      bucketId: z.string().describe('Bucket ID'),
      key: z.string().describe('Object key'),
      storageId: z.string().describe('Storage ID from upload response'),
      size: z.number().describe('Object size in bytes'),
      contentType: z.string().describe('MIME type'),
      etag: z.string().describe('ETag/hash of the content'),
    },
    safeTool(async ({ bucketId, key, storageId, size, contentType, etag }) => {
      const objectId = await client.mutation(asPublic(internal.storage.apiPutObject), {
        userId,
        bucketId: bucketId as Id<'storageBuckets'>,
        key,
        storageId: storageId as Id<'_storage'>,
        size,
        contentType,
        etag,
      })
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify({ objectId, key, status: 'stored' }),
          },
        ],
      }
    }),
  )

  server.tool(
    'get_object',
    'Get an object and its download URL from a bucket',
    {
      bucketName: z.string().describe('Bucket name'),
      key: z.string().describe('Object key'),
    },
    safeTool(async ({ bucketName, key }) => {
      const bucket = await client.query(asPublic(internal.storage.getBucketByName), { name: bucketName })
      if (!bucket) {
        return {
          content: [{ type: 'text' as const, text: JSON.stringify({ error: 'Bucket not found' }) }],
          isError: true,
        }
      }

      const obj = await client.query(asPublic(internal.storage.getObject), {
        bucketId: bucket._id,
        key,
      })

      if (!obj) {
        return {
          content: [{ type: 'text' as const, text: JSON.stringify({ error: 'Object not found' }) }],
          isError: true,
        }
      }

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify({
              key: obj.key,
              size: obj.size,
              contentType: obj.contentType,
              etag: obj.etag,
              downloadUrl: obj.url,
              lastModified: obj.updatedAt,
            }),
          },
        ],
      }
    }),
  )

  server.tool(
    'delete_object',
    'Delete an object from a bucket',
    {
      bucketName: z.string().describe('Bucket name'),
      key: z.string().describe('Object key'),
    },
    safeTool(async ({ bucketName, key }) => {
      const bucket = await client.query(asPublic(internal.storage.getBucketByName), { name: bucketName })
      if (!bucket) {
        return {
          content: [{ type: 'text' as const, text: JSON.stringify({ error: 'Bucket not found' }) }],
          isError: true,
        }
      }

      await client.mutation(asPublic(internal.storage.apiDeleteObject), {
        userId,
        bucketId: bucket._id,
        key,
      })
      return {
        content: [
          { type: 'text' as const, text: JSON.stringify({ key, status: 'deleted' }) },
        ],
      }
    }),
  )

  server.tool(
    'list_objects',
    'List objects in a bucket with optional prefix filter',
    {
      bucketName: z.string().describe('Bucket name'),
      prefix: z.string().optional().describe('Key prefix to filter by'),
      maxKeys: z.number().optional().describe('Max results (default 1000)'),
    },
    safeTool(async ({ bucketName, prefix, maxKeys }) => {
      const bucket = await client.query(asPublic(internal.storage.getBucketByName), { name: bucketName })
      if (!bucket) {
        return {
          content: [{ type: 'text' as const, text: JSON.stringify({ error: 'Bucket not found' }) }],
          isError: true,
        }
      }

      const result = await client.query(asPublic(internal.storage.listObjects), {
        bucketId: bucket._id,
        prefix,
        maxKeys,
      })

      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result) }],
      }
    }),
  )

  return server
}

// ---------------------------------------------------------------------------
// Route handler — single /api/mcp endpoint for JSON-RPC 2.0
// ---------------------------------------------------------------------------

async function handleMcpRequest(request: Request): Promise<Response> {
  // Authenticate via API key
  const authResult = await requireApiKey(request, 'mcp')
  if (authResult instanceof Response) {
    // Return auth errors in JSON-RPC 2.0 format
    const body = await authResult.json() as { error: string }
    return Response.json(
      {
        jsonrpc: '2.0',
        error: { code: -32001, message: body.error ?? 'Authentication failed' },
        id: null,
      },
      { status: authResult.status },
    )
  }

  // Create a stateless transport (no session tracking needed)
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  })

  // Create a server for this request with the authenticated user's context
  const server = createMcpServerForUser(authResult)
  await server.connect(transport)

  // Parse the body and hand off to the transport
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json(
      { jsonrpc: '2.0', error: { code: -32700, message: 'Parse error' }, id: null },
      { status: 400 },
    )
  }

  // handleRequest returns a web standard Response
  const response = await transport.handleRequest(request, { parsedBody: body })

  // Clean up
  await server.close()

  return response ?? Response.json(
    { jsonrpc: '2.0', error: { code: -32603, message: 'Internal error' }, id: null },
    { status: 500 },
  )
}

export const Route = createFileRoute('/api/mcp')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        return handleMcpRequest(request)
      },
      GET: async () => {
        // Return server info for discovery
        return Response.json({
          name: 'equiforge',
          version: '1.0.0',
          protocol: 'mcp',
          transport: 'streamable-http',
          endpoint: '/api/mcp',
          auth: 'Bearer API key (Authorization: Bearer eqf_...)',
          tools: [
            'create_account',
            'check_status',
            'attach_payment',
            'provision_storage',
            'rotate_keys',
            'create_bucket',
            'list_buckets',
            'put_object',
            'put_object_complete',
            'get_object',
            'delete_object',
            'list_objects',
          ],
        })
      },
    },
  },
})
