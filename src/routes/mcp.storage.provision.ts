import { createFileRoute } from '@tanstack/react-router'
import { ConvexHttpClient } from 'convex/browser'
import type { FunctionReference } from 'convex/server'

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
          'mcp:createStorageService' as unknown as FunctionReference<
            'mutation'
          >,
          {
            accountId: payload.accountId,
            project: payload.project,
            region: payload.region,
            usageCapGb: payload.usageCapGb,
            paymentProfile: payload.paymentProfile,
          },
        )

        if ('error' in result) {
          return Response.json(
            {
              error: result.error,
            },
            { status: 400 },
          )
        }

        const service = await client.query(
          'mcp:getStorageService' as unknown as FunctionReference<'query'>,
          {
            serviceId: result,
          },
        )

        return Response.json({
          serviceId: result,
          status: service?.status ?? 'provisioning',
          region: service?.region ?? payload.region,
          project: service?.project ?? payload.project,
          usageCapGb: service?.usageCapGb ?? payload.usageCapGb ?? null,
          paymentProfile: service?.paymentProfile ?? payload.paymentProfile,
          endpoint: service?.endpoint ?? 'https://storage.equiforge.com',
          accessKeyId: service?.accessKeyId ?? '',
          secretAccessKey: service?.secretAccessKey ?? '',
          createdAt: service?.createdAt ?? null,
        })
      },
    },
  },
})
