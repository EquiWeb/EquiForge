import { createFileRoute } from '@tanstack/react-router'
import { createStorageService } from '#/lib/mcpStore'

type StorageProvisionRequest = {
  accountId: string
  project: string
  region: string
  usageCapGb?: number
  paymentProfile: string
}

export const Route = createFileRoute('/mcp/storage/provision')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const payload = (await request.json()) as Partial<StorageProvisionRequest>
        if (
          !payload.accountId ||
          !payload.project ||
          !payload.region ||
          !payload.paymentProfile
        ) {
          return Response.json(
            {
              error: 'Missing accountId, project, region, or paymentProfile',
            },
            { status: 400 },
          )
        }

        const result = createStorageService({
          accountId: payload.accountId,
          project: payload.project,
          region: payload.region,
          usageCapGb: payload.usageCapGb,
          paymentProfile: payload.paymentProfile,
        })

        if ('error' in result) {
          return Response.json(
            {
              error: result.error,
            },
            { status: 400 },
          )
        }

        return Response.json({
          serviceId: result.service.id,
          status: result.service.status,
          region: result.service.region,
          project: result.service.project,
          usageCapGb: result.service.usageCapGb,
          paymentProfile: result.service.paymentProfile,
          endpoint: result.service.endpoint,
          accessKeyId: result.service.accessKeyId,
          secretAccessKey: result.service.secretAccessKey,
          createdAt: result.service.createdAt,
        })
      },
    },
  },
})
