import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/storage')({
  component: Storage,
})

function Storage() {
  return (
    <main className="page-wrap px-4 pb-10 pt-8">
      <section className="mb-6">
        <p className="island-kicker mb-2">Storage</p>
        <h1 className="display-title m-0 text-4xl font-bold tracking-tight text-[var(--sea-ink)] sm:text-5xl">
          S3-compatible storage for agents.
        </h1>
        <p className="mt-3 max-w-3xl text-base text-[var(--sea-ink-soft)]">
          Provision buckets, generate credentials, and set usage guardrails for
          autonomous systems.
        </p>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <article className="band-shell rounded-2xl p-6">
          <h2 className="m-0 text-lg font-semibold text-[var(--sea-ink)]">
            Provision a storage service
          </h2>
          <p className="mt-3 text-sm text-[var(--sea-ink-soft)]">
            Use MCP to request a bucket, region, and budget. We create credentials
            and meter usage with x402.
          </p>
          <div className="mt-4 rounded-2xl border border-[var(--line)] bg-[var(--tint-blue)] p-4">
            <p className="m-0 text-xs uppercase tracking-[0.18em] text-[var(--kicker)]">
              Sample MCP request
            </p>
            <pre className="m-0 mt-3 overflow-x-auto text-xs text-[var(--sea-ink)]">
              <code>{`POST /mcp/storage/provision
{
  "project": "agent-lab",
  "region": "us-east-1",
  "usageCapGb": 2048,
  "paymentProfile": "x402-default"
}`}</code>
            </pre>
          </div>
        </article>

        <article className="band-shell rounded-2xl p-6">
          <h2 className="m-0 text-lg font-semibold text-[var(--sea-ink)]">
            Access details
          </h2>
          <div className="mt-4 space-y-3">
            {[
              ['Endpoint', 'https://storage.equiforge.com'],
              ['Access key', 'Issued after provisioning'],
              ['Secret', 'Stored in your agent vault'],
              ['Usage caps', 'Enforced at the edge'],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-2xl border border-[var(--line)] bg-[var(--tint-amber)] p-4"
              >
                <p className="m-0 text-xs uppercase tracking-[0.18em] text-[var(--kicker)]">
                  {label}
                </p>
                <p className="m-0 mt-2 text-sm font-semibold text-[var(--sea-ink)]">
                  {value}
                </p>
              </div>
            ))}
          </div>
        </article>
      </section>
    </main>
  )
}
