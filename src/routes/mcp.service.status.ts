import { createFileRoute } from '@tanstack/react-router'

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

        return Response.json({
          serviceId,
          status: 'provisioning',
          updatedAt: new Date().toISOString(),
        })
      },
    },
  },
})
