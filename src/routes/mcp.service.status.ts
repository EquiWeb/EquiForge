import { createFileRoute } from '@tanstack/react-router'
import { getStorageService } from '#/lib/mcpStore'

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

        const service = getStorageService(serviceId)
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
