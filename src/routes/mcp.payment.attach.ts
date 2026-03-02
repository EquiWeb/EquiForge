import { createFileRoute } from '@tanstack/react-router'
import { attachPaymentProfile } from '#/lib/mcpStore'

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

        const attached = attachPaymentProfile({
          accountId: payload.accountId,
          profile: payload.profile,
          wallet: payload.wallet,
        })

        if (!attached) {
          return Response.json(
            {
              error: 'Account not found',
            },
            { status: 404 },
          )
        }

        return Response.json({
          status: 'attached',
          accountId: attached.accountId,
          profile: attached.profile,
          wallet: attached.wallet,
        })
      },
    },
  },
})
