import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/auth')({
  component: Auth,
})

function Auth() {
  return (
    <main className="page-wrap px-4 pb-10 pt-8">
      <section className="mb-6">
        <p className="island-kicker mb-2">Auth</p>
        <h1 className="display-title m-0 text-4xl font-bold tracking-tight text-[var(--sea-ink)] sm:text-5xl">
          Secure access for teams and agents.
        </h1>
        <p className="mt-3 max-w-3xl text-base text-[var(--sea-ink-soft)]">
          Choose an authentication provider and define how agents authenticate
          against EquiForge services.
        </p>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <article className="band-shell rounded-2xl p-6">
          <h2 className="m-0 text-lg font-semibold text-[var(--sea-ink)]">
            Supported flows
          </h2>
          <div className="mt-4 grid gap-3">
            {[
              {
                name: 'Agent API keys',
                detail: 'Scoped keys for MCP and service access.',
              },
              {
                name: 'Team SSO',
                detail: 'Admin console access for operators.',
              },
              {
                name: 'Service tokens',
                detail: 'Short-lived tokens for provisioning calls.',
              },
            ].map((flow) => (
              <div
                key={flow.name}
                className="rounded-2xl border border-[var(--line)] bg-[var(--tint-amber)] p-4"
              >
                <p className="m-0 text-sm font-semibold text-[var(--sea-ink)]">
                  {flow.name}
                </p>
                <p className="m-0 mt-2 text-sm text-[var(--sea-ink-soft)]">
                  {flow.detail}
                </p>
              </div>
            ))}
          </div>
        </article>

        <article className="band-shell rounded-2xl p-6">
          <h2 className="m-0 text-lg font-semibold text-[var(--sea-ink)]">
            Next steps
          </h2>
          <ol className="m-0 mt-4 list-decimal space-y-3 pl-5 text-sm text-[var(--sea-ink-soft)]">
            <li>Pick your identity provider or request a managed setup.</li>
            <li>Define agent roles and allowed services.</li>
            <li>Issue keys and start provisioning via MCP.</li>
          </ol>
        </article>
      </section>
    </main>
  )
}
