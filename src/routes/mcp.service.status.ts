import { createFileRoute } from '@tanstack/react-router'
import { ConvexHttpClient } from 'convex/browser'
import type { FunctionReference } from 'convex/server'

export const Route = createFileRoute('/mcp/service/status')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url)
        const serviceId = url.searchParams.get('serviceId')
        if (!serviceId) {
          return Response.json(
            {
              error: 'Missing serviceId',
            },
            { status: 400 },
          )
        }

        const convexUrl = process.env.VITE_CONVEX_URL
        if (!convexUrl) {
          return Response.json(
            {
              error: 'Missing VITE_CONVEX_URL',
            },
            { status: 500 },
          )
        }
        const client = new ConvexHttpClient(convexUrl)
        const service = await client.query(
          'mcp:getStorageService' as unknown as FunctionReference<'query'>,
          {
            serviceId,
          },
        )
        if (!service) {
          return Response.json(
            {
              error: 'Service not found',
            },
            { status: 404 },
          )
        }

        return Response.json({
          serviceId: service.id,
          status: service.status,
          region: service.region,
          project: service.project,
          usageCapGb: service.usageCapGb,
          endpoint: service.endpoint,
          accessKeyId: service.accessKeyId,
          updatedAt: service.updatedAt,
        })
      },
    },
  },
})
