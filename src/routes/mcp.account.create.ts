import { createFileRoute } from '@tanstack/react-router'

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

        return Response.json({
          accountId: `acct_${crypto.randomUUID()}`,
          status: 'created',
          orgName: payload.orgName,
          contact: payload.contact,
        })
      },
    },
  },
})
