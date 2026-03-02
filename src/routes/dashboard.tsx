import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard')({
  component: Dashboard,
})

function Dashboard() {
  return (
    <main className="page-wrap px-4 pb-10 pt-8">
      <section className="mb-6">
        <p className="island-kicker mb-2">Dashboard</p>
        <h1 className="display-title m-0 text-4xl font-bold tracking-tight text-[var(--sea-ink)] sm:text-5xl">
          Control plane for agent infrastructure.
        </h1>
        <p className="mt-3 max-w-3xl text-base text-[var(--sea-ink-soft)]">
          Track services, usage, and billing across storage and compute as you
          bring agents online.
        </p>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <article className="band-shell rounded-2xl p-6">
          <h2 className="m-0 text-lg font-semibold text-[var(--sea-ink)]">
            Active services
          </h2>
          <div className="mt-4 grid gap-3">
            {[
              {
                name: 'S3-Compatible Storage',
                status: 'Awaiting provisioning',
                meta: 'Region: us-east-1 • Usage cap: 2 TB',
              },
              {
                name: 'Compute (CPU)',
                status: 'Planned',
                meta: 'Queued for beta enrollment',
              },
              {
                name: 'Compute (GPU)',
                status: 'Planned',
                meta: 'Provider selection in progress',
              },
            ].map((service) => (
              <div
                key={service.name}
                className="rounded-2xl border border-[var(--line)] bg-[var(--tint-blue)] p-4"
              >
                <p className="m-0 text-sm font-semibold text-[var(--sea-ink)]">
                  {service.name}
                </p>
                <p className="m-0 text-xs uppercase tracking-[0.18em] text-[var(--kicker)]">
                  {service.status}
                </p>
                <p className="m-0 mt-2 text-sm text-[var(--sea-ink-soft)]">
                  {service.meta}
                </p>
              </div>
            ))}
          </div>
        </article>

        <article className="band-shell rounded-2xl p-6">
          <h2 className="m-0 text-lg font-semibold text-[var(--sea-ink)]">
            Usage snapshot
          </h2>
          <div className="mt-4 grid gap-4">
            {[
              ['Storage', '0 GB used • 0 requests'],
              ['Spend', '$0.00 this month'],
              ['Active agents', '0 connected'],
            ].map(([title, value]) => (
              <div
                key={title}
                className="rounded-2xl border border-[var(--line)] bg-[var(--tint-amber)] p-4"
              >
                <p className="m-0 text-xs uppercase tracking-[0.18em] text-[var(--kicker)]">
                  {title}
                </p>
                <p className="m-0 mt-2 text-lg font-semibold text-[var(--sea-ink)]">
                  {value}
                </p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm text-[var(--sea-ink-soft)]">
            Connect x402 payments to unlock live metering and automated
            settlements.
          </p>
        </article>
      </section>
    </main>
  )
}
