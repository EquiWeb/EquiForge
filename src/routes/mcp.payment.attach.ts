import { createFileRoute } from '@tanstack/react-router'

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

        return Response.json({
          status: 'attached',
          accountId: payload.accountId,
          profile: payload.profile,
        })
      },
    },
  },
})
