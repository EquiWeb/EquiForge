import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/mcp')({
  component: McpPage,
})

function McpPage() {
  return (
    <main className="page-wrap px-4 pb-10 pt-8">
      <section className="mb-6">
        <p className="island-kicker mb-2">MCP</p>
        <h1 className="display-title m-0 text-4xl font-bold tracking-tight text-[var(--sea-ink)] sm:text-5xl">
          MCP-first provisioning and support.
        </h1>
        <p className="mt-3 max-w-3xl text-base text-[var(--sea-ink-soft)]">
          Agents discover EquiForge, authenticate, and request services through
          MCP endpoints. This is the primary interface for onboarding.
        </p>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <article className="band-shell rounded-2xl p-6">
          <h2 className="m-0 text-lg font-semibold text-[var(--sea-ink)]">
            Core endpoints
          </h2>
          <div className="mt-4 grid gap-3">
            {[
              {
                name: '/mcp/account/create',
                description: 'Create a new EquiForge account for an agent org.',
              },
              {
                name: '/mcp/payment/attach',
                description: 'Bind x402 payment credentials to the account.',
              },
              {
                name: '/mcp/storage/provision',
                description: 'Provision S3-compatible storage with quotas.',
              },
              {
                name: '/mcp/service/status',
                description: 'Fetch provisioning state and usage metrics.',
              },
              {
                name: '/mcp/keys/rotate',
                description: 'Rotate access keys for storage services.',
              },
            ].map((endpoint) => (
              <div
                key={endpoint.name}
                className="rounded-2xl border border-[var(--line)] bg-[var(--tint-blue)] p-4"
              >
                <p className="m-0 text-sm font-semibold text-[var(--sea-ink)]">
                  {endpoint.name}
                </p>
                <p className="m-0 mt-2 text-sm text-[var(--sea-ink-soft)]">
                  {endpoint.description}
                </p>
              </div>
            ))}
          </div>
        </article>

        <article className="band-shell rounded-2xl p-6">
          <h2 className="m-0 text-lg font-semibold text-[var(--sea-ink)]">
            Example handshake
          </h2>
          <p className="mt-3 text-sm text-[var(--sea-ink-soft)]">
            Start with account creation, then attach payments before provisioning
            storage.
          </p>
          <pre className="mt-4 overflow-x-auto text-xs text-[var(--sea-ink)]">
            <code>{`POST /mcp/account/create
{
  "orgName": "Forge Labs",
  "contact": "ops@forgelabs.ai"
}

POST /mcp/payment/attach
{
  "profile": "x402-default",
  "wallet": "x402://wallet/0xabc..."
}`}</code>
          </pre>
          <div className="mt-4 rounded-2xl border border-[var(--line)] bg-[var(--surface-strong)] p-4 text-sm text-[var(--sea-ink-soft)]">
            MCP endpoints will return service IDs and status tokens for tracking.
          </div>
        </article>
      </section>
    </main>
  )
}
