import { createFileRoute } from '@tanstack/react-router'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js'
import { z } from 'zod'
import { requireApiKey, type ApiKeyAuth } from '#/lib/apiAuth'
import { getConvexClient, api } from '#/lib/convex'
import type { Id } from '../../convex/_generated/dataModel'

// ---------------------------------------------------------------------------
// MCP Server factory — creates a fresh McpServer with all tools registered.
// Each request gets its own server+transport (stateless mode).
// ---------------------------------------------------------------------------

function createMcpServerForUser(auth: ApiKeyAuth) {
  const server = new McpServer({
    name: 'equiforge',
    version: '1.0.0',
  })

  const client = getConvexClient()
  const userId = auth.userId as Id<'users'>

  // ----- Account tools -----

  server.tool(
    'create_account',
    'Create a new EquiForge account for an agent org',
    {
      orgName: z.string().describe('Organization name'),
      contact: z.string().describe('Contact email'),
    },
    async ({ orgName, contact }) => {
      const accountId = await client.mutation(api.mcp.apiCreateAccount as any, {
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
    },
  )

  server.tool(
    'check_status',
    'Check account and service status for the authenticated user',
    {},
    async () => {
      const account = await client.query(api.mcp.apiGetAccountForUser as any, {
        userId,
      })
      if (!account) {
        return {
          content: [{ type: 'text' as const, text: JSON.stringify({ error: 'No account found' }) }],
          isError: true,
        }
      }

      const services = await client.query(api.mcp.apiListStorageServices as any, {
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
              services: services.map((s: any) => ({
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
    },
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
    async ({ accountId, profile, wallet }) => {
      const result = await client.mutation(api.mcp.apiAttachPaymentProfile as any, {
        userId,
        accountId,
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
    },
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
    async ({ accountId, project, region, usageCapGb, paymentProfile }) => {
      const result = await client.mutation(api.mcp.apiCreateStorageService as any, {
        userId,
        accountId,
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
      const service = await client.query(api.mcp.apiGetStorageService as any, {
        serviceId: result,
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
    },
  )

  server.tool(
    'rotate_keys',
    'Rotate access keys for a storage service',
    {
      serviceId: z.string().describe('Storage service ID'),
      reason: z.string().optional().describe('Reason for rotation'),
    },
    async ({ serviceId, reason }) => {
      const result = await client.mutation(api.mcp.apiRotateStorageKeys as any, {
        userId,
        serviceId,
        reason,
      })

      if (typeof result === 'object' && result !== null && 'error' in result) {
        return {
          content: [{ type: 'text' as const, text: JSON.stringify({ error: result.error }) }],
          isError: true,
        }
      }

      const service = await client.query(api.mcp.apiGetStorageService as any, {
        serviceId,
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
    },
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
    async ({ accountId, name, region, isPublic }) => {
      try {
        const bucketId = await client.mutation(api.storage.apiCreateBucket as any, {
          userId,
          accountId,
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
      } catch (err: any) {
        return {
          content: [{ type: 'text' as const, text: JSON.stringify({ error: err.message }) }],
          isError: true,
        }
      }
    },
  )

  server.tool(
    'list_buckets',
    'List storage buckets for an account',
    {
      accountId: z.string().describe('Account ID'),
    },
    async ({ accountId }) => {
      const buckets = await client.query(api.storage.apiListBuckets as any, {
        userId,
        accountId,
      })
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify({
              buckets: buckets.map((b: any) => ({
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
    },
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
    async ({ bucketName, key, contentType, size }) => {
      const bucket = await client.query(api.storage.getBucketByName as any, { name: bucketName })
      if (!bucket) {
        return {
          content: [{ type: 'text' as const, text: JSON.stringify({ error: 'Bucket not found' }) }],
          isError: true,
        }
      }

      // Generate an upload URL from Convex
      const uploadUrl = await client.mutation(api.storage.generateUploadUrl as any, {})

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
    },
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
    async ({ bucketId, key, storageId, size, contentType, etag }) => {
      try {
        const objectId = await client.mutation(api.storage.apiPutObject as any, {
          userId,
          bucketId,
          key,
          storageId,
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
      } catch (err: any) {
        return {
          content: [{ type: 'text' as const, text: JSON.stringify({ error: err.message }) }],
          isError: true,
        }
      }
    },
  )

  server.tool(
    'get_object',
    'Get an object and its download URL from a bucket',
    {
      bucketName: z.string().describe('Bucket name'),
      key: z.string().describe('Object key'),
    },
    async ({ bucketName, key }) => {
      const bucket = await client.query(api.storage.getBucketByName as any, { name: bucketName })
      if (!bucket) {
        return {
          content: [{ type: 'text' as const, text: JSON.stringify({ error: 'Bucket not found' }) }],
          isError: true,
        }
      }

      const obj = await client.query(api.storage.getObject as any, {
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
    },
  )

  server.tool(
    'delete_object',
    'Delete an object from a bucket',
    {
      bucketName: z.string().describe('Bucket name'),
      key: z.string().describe('Object key'),
    },
    async ({ bucketName, key }) => {
      const bucket = await client.query(api.storage.getBucketByName as any, { name: bucketName })
      if (!bucket) {
        return {
          content: [{ type: 'text' as const, text: JSON.stringify({ error: 'Bucket not found' }) }],
          isError: true,
        }
      }

      try {
        await client.mutation(api.storage.apiDeleteObject as any, {
          userId,
          bucketId: bucket._id,
          key,
        })
        return {
          content: [
            { type: 'text' as const, text: JSON.stringify({ key, status: 'deleted' }) },
          ],
        }
      } catch (err: any) {
        return {
          content: [{ type: 'text' as const, text: JSON.stringify({ error: err.message }) }],
          isError: true,
        }
      }
    },
  )

  server.tool(
    'list_objects',
    'List objects in a bucket with optional prefix filter',
    {
      bucketName: z.string().describe('Bucket name'),
      prefix: z.string().optional().describe('Key prefix to filter by'),
      maxKeys: z.number().optional().describe('Max results (default 1000)'),
    },
    async ({ bucketName, prefix, maxKeys }) => {
      const bucket = await client.query(api.storage.getBucketByName as any, { name: bucketName })
      if (!bucket) {
        return {
          content: [{ type: 'text' as const, text: JSON.stringify({ error: 'Bucket not found' }) }],
          isError: true,
        }
      }

      const result = await client.query(api.storage.listObjects as any, {
        bucketId: bucket._id,
        prefix,
        maxKeys,
      })

      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result) }],
      }
    },
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
    return authResult
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
