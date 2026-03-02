import { createFileRoute } from '@tanstack/react-router'
import { ConvexHttpClient } from 'convex/browser'
import type { FunctionReference } from 'convex/server'

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
        const accountId = await client.mutation(
          'mcp:createAccount' as unknown as FunctionReference<
            'mutation'
          >,
          {
            orgName: payload.orgName,
            contact: payload.contact,
          },
        )

        return Response.json({
          accountId,
          status: 'created',
          orgName: payload.orgName,
          contact: payload.contact,
        })
      },
    },
  },
})
