import { createFileRoute } from '@tanstack/react-router'
import { createAccount } from '#/lib/mcpStore'

type CreateAccountRequest = {
  orgName: string
  contact: string
}

export const Route = createFileRoute('/mcp/account/create')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const payload = (await request.json()) as Partial<CreateAccountRequest>
        if (!payload.orgName || !payload.contact) {
          return Response.json(
            {
              error: 'Missing orgName or contact',
            },
            { status: 400 },
          )
        }

        const account = createAccount({
          orgName: payload.orgName,
          contact: payload.contact,
        })

        return Response.json({
          accountId: account.id,
          status: 'created',
          orgName: account.orgName,
          contact: account.contact,
          createdAt: account.createdAt,
        })
      },
    },
  },
})
