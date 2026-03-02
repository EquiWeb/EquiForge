import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'

type ApiResponse = Record<string, unknown> | null

export const Route = createFileRoute('/demo')({
  component: DemoConsole,
})

function DemoConsole() {
  const [accountId, setAccountId] = useState('')
  const [serviceId, setServiceId] = useState('')
  const [output, setOutput] = useState<ApiResponse>(null)
  const [busy, setBusy] = useState(false)

  async function callEndpoint(path: string, body?: Record<string, unknown>) {
    setBusy(true)
    try {
      const response = await fetch(path, {
        method: body ? 'POST' : 'GET',
        headers: body ? { 'Content-Type': 'application/json' } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      })
      const data = await response.json()
      setOutput(data)
      return data
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="page-wrap px-4 pb-10 pt-8">
      <section className="mb-6">
        <p className="island-kicker mb-2">Demo Console</p>
        <h1 className="display-title m-0 text-4xl font-bold tracking-tight text-[var(--sea-ink)] sm:text-5xl">
          Live MCP provisioning flow.
        </h1>
        <p className="mt-3 max-w-3xl text-base text-[var(--sea-ink-soft)]">
          Use this panel to create accounts, attach payments, provision storage,
          and rotate keys against your Convex-backed MCP endpoints.
        </p>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <article className="band-shell rounded-2xl p-6">
          <h2 className="m-0 text-lg font-semibold text-[var(--sea-ink)]">
            Actions
          </h2>

          <div className="mt-4 grid gap-3">
            <button
              type="button"
              disabled={busy}
              onClick={async () => {
                const data = (await callEndpoint('/mcp/account/create', {
                  orgName: 'Forge Labs',
                  contact: 'ops@forgelabs.ai',
                })) as { accountId?: string }
                if (data?.accountId) setAccountId(data.accountId)
              }}
              className="rounded-2xl border border-[var(--line)] bg-[var(--tint-blue)] px-4 py-3 text-left text-sm font-semibold text-[var(--sea-ink)]"
            >
              Create account
            </button>

            <button
              type="button"
              disabled={busy || !accountId}
              onClick={() =>
                callEndpoint('/mcp/payment/attach', {
                  accountId,
                  profile: 'x402-default',
                  wallet: 'x402://wallet/demo',
                })
              }
              className="rounded-2xl border border-[var(--line)] bg-[var(--tint-amber)] px-4 py-3 text-left text-sm font-semibold text-[var(--sea-ink)]"
            >
              Attach payment profile
            </button>

            <button
              type="button"
              disabled={busy || !accountId}
              onClick={async () => {
                const data = (await callEndpoint('/mcp/storage/provision', {
                  accountId,
                  project: 'agent-lab',
                  region: 'us-east-1',
                  usageCapGb: 2048,
                  paymentProfile: 'x402-default',
                })) as { serviceId?: string }
                if (data?.serviceId) setServiceId(data.serviceId)
              }}
              className="rounded-2xl border border-[var(--line)] bg-[var(--tint-blue)] px-4 py-3 text-left text-sm font-semibold text-[var(--sea-ink)]"
            >
              Provision storage
            </button>

            <button
              type="button"
              disabled={busy || !serviceId}
              onClick={() =>
                callEndpoint(`/mcp/service/status?serviceId=${serviceId}`)
              }
              className="rounded-2xl border border-[var(--line)] bg-[var(--tint-amber)] px-4 py-3 text-left text-sm font-semibold text-[var(--sea-ink)]"
            >
              Check service status
            </button>

            <button
              type="button"
              disabled={busy || !serviceId}
              onClick={() =>
                callEndpoint('/mcp/keys/rotate', {
                  serviceId,
                  reason: 'demo rotation',
                })
              }
              className="rounded-2xl border border-[var(--line)] bg-[var(--tint-blue)] px-4 py-3 text-left text-sm font-semibold text-[var(--sea-ink)]"
            >
              Rotate keys
            </button>
          </div>
        </article>

        <article className="band-shell rounded-2xl p-6">
          <h2 className="m-0 text-lg font-semibold text-[var(--sea-ink)]">
            Live output
          </h2>
          <div className="mt-4 rounded-2xl border border-[var(--line)] bg-[var(--surface-strong)] p-4">
            <pre className="m-0 text-xs text-[var(--sea-ink)]">
              {output ? JSON.stringify(output, null, 2) : 'No output yet.'}
            </pre>
          </div>
          <div className="mt-4 text-xs text-[var(--sea-ink-soft)]">
            Account ID: {accountId || '—'}
            <br />
            Service ID: {serviceId || '—'}
          </div>
        </article>
      </section>
    </main>
  )
}
