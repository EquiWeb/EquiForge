import { createFileRoute } from '@tanstack/react-router'
import { ConvexHttpClient } from 'convex/browser'
import type { FunctionReference } from 'convex/server'

type AttachPaymentRequest = {
  accountId: string
  profile: string
  wallet: string
}

export const Route = createFileRoute('/mcp/payment/attach')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const payload = (await request.json()) as Partial<AttachPaymentRequest>
        if (!payload.accountId || !payload.profile || !payload.wallet) {
          return Response.json(
            {
              error: 'Missing accountId, profile, or wallet',
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
          'mcp:attachPaymentProfile' as unknown as FunctionReference<
            'mutation'
          >,
          {
            accountId: payload.accountId,
            profile: payload.profile,
            wallet: payload.wallet,
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

        return Response.json({
          status: 'attached',
          accountId: payload.accountId,
          profile: result.profile,
          wallet: result.wallet,
        })
      },
    },
  },
})
