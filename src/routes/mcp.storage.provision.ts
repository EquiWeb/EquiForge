import { createFileRoute } from '@tanstack/react-router'

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

        return Response.json({
          serviceId: `storage_${crypto.randomUUID()}`,
          status: 'provisioning',
          region: payload.region,
          project: payload.project,
          usageCapGb: payload.usageCapGb ?? null,
          paymentProfile: payload.paymentProfile,
        })
      },
    },
  },
})
