import { createFileRoute } from '@tanstack/react-router'
import { ConvexHttpClient } from 'convex/browser'
import type { FunctionReference } from 'convex/server'

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
        const result = await client.mutation(
          'mcp:rotateStorageKeys' as unknown as FunctionReference<
            'mutation'
          >,
          {
            serviceId: payload.serviceId,
            reason: payload.reason,
          },
        )
        if ('error' in result) {
          return Response.json(
            {
              error: result.error,
            },
            { status: 404 },
          )
        }

        const service = await client.query(
          'mcp:getStorageService' as unknown as FunctionReference<
            'query'
          >,
          {
            serviceId: payload.serviceId,
          },
        )

        return Response.json({
          serviceId: payload.serviceId,
          status: 'rotated',
          accessKeyId: service?.accessKeyId ?? '',
          secretAccessKey: service?.secretAccessKey ?? '',
          rotatedAt: result.updatedAt,
          reason: result.reason,
        })
      },
    },
  },
})
