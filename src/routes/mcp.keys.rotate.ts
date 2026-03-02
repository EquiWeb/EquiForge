import { createFileRoute } from '@tanstack/react-router'

type RotateKeysRequest = {
  serviceId: string
  reason?: string
}

export const Route = createFileRoute('/mcp/keys/rotate')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const payload = (await request.json()) as Partial<RotateKeysRequest>
        if (!payload.serviceId) {
          return Response.json(
            {
              error: 'Missing serviceId',
            },
            { status: 400 },
          )
        }

        return Response.json({
          serviceId: payload.serviceId,
          status: 'rotation_queued',
          rotatedAt: new Date().toISOString(),
        })
      },
    },
  },
})
