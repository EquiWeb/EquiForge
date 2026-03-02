import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/payments')({
  component: Payments,
})

function Payments() {
  return (
    <main className="page-wrap px-4 pb-10 pt-8">
      <section className="mb-6">
        <p className="island-kicker mb-2">Payments</p>
        <h1 className="display-title m-0 text-4xl font-bold tracking-tight text-[var(--sea-ink)] sm:text-5xl">
          x402-native billing and settlement.
        </h1>
        <p className="mt-3 max-w-3xl text-base text-[var(--sea-ink-soft)]">
          Keep payment flows embedded in service calls. Configure billing profiles
          once, and let agents pay as they provision resources.
        </p>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <article className="band-shell rounded-2xl p-6">
          <h2 className="m-0 text-lg font-semibold text-[var(--sea-ink)]">
            Payment profiles
          </h2>
          <p className="mt-3 text-sm text-[var(--sea-ink-soft)]">
            Link x402 credentials to control spending limits and routing rules.
          </p>
          <div className="mt-4 grid gap-3">
            {[
              {
                name: 'x402-default',
                status: 'Not connected',
                detail: 'Attach a wallet to enable usage-based billing.',
              },
              {
                name: 'training-budget',
                status: 'Optional',
                detail: 'Create a capped profile for experimentation.',
              },
            ].map((profile) => (
              <div
                key={profile.name}
                className="rounded-2xl border border-[var(--line)] bg-[var(--tint-blue)] p-4"
              >
                <p className="m-0 text-sm font-semibold text-[var(--sea-ink)]">
                  {profile.name}
                </p>
                <p className="m-0 text-xs uppercase tracking-[0.18em] text-[var(--kicker)]">
                  {profile.status}
                </p>
                <p className="m-0 mt-2 text-sm text-[var(--sea-ink-soft)]">
                  {profile.detail}
                </p>
              </div>
            ))}
          </div>
        </article>

        <article className="band-shell rounded-2xl p-6">
          <h2 className="m-0 text-lg font-semibold text-[var(--sea-ink)]">
            Settlement flow
          </h2>
          <ol className="m-0 mt-4 list-decimal space-y-3 pl-5 text-sm text-[var(--sea-ink-soft)]">
            <li>Agent requests a service over MCP.</li>
            <li>EquiForge meters usage in real time.</li>
            <li>x402 settles payments based on consumption.</li>
            <li>Invoices and logs sync back to your dashboard.</li>
          </ol>
          <div className="mt-5 rounded-2xl border border-[var(--line)] bg-[var(--surface-strong)] p-4 text-sm text-[var(--sea-ink-soft)]">
            Payment endpoints are available via MCP once your account is created.
          </div>
        </article>
      </section>
    </main>
  )
}
