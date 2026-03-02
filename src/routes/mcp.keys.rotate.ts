import { createFileRoute } from '@tanstack/react-router'
import { rotateStorageKeys } from '#/lib/mcpStore'

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

        const result = rotateStorageKeys(payload.serviceId, payload.reason)
        if (!result) {
          return Response.json(
            {
              error: 'Service not found',
            },
            { status: 404 },
          )
        }

        return Response.json({
          serviceId: result.service.id,
          status: 'rotated',
          accessKeyId: result.service.accessKeyId,
          secretAccessKey: result.service.secretAccessKey,
          rotatedAt: result.service.updatedAt,
          reason: result.reason,
        })
      },
    },
  },
})
