import { createFileRoute } from '@tanstack/react-router'
import { useState, useCallback, useRef } from 'react'

type JsonRpcResponse = {
  jsonrpc: '2.0'
  id: number
  result?: unknown
  error?: { code: number; message: string; data?: unknown }
}

type LogEntry = {
  id: number
  direction: 'request' | 'response'
  tool: string
  payload: unknown
  timestamp: number
}

export const Route = createFileRoute('/demo')({
  component: DemoConsole,
})

function DemoConsole() {
  const [apiKey, setApiKey] = useState('')
  const [accountId, setAccountId] = useState('')
  const [serviceId, setServiceId] = useState('')
  const [bucketName, setBucketName] = useState('')
  const [log, setLog] = useState<LogEntry[]>([])
  const [busy, setBusy] = useState(false)
  const reqIdRef = useRef(1)
  const logIdRef = useRef(1)

  const callTool = useCallback(
    async (tool: string, args: Record<string, unknown> = {}) => {
      if (!apiKey) return null
      setBusy(true)

      const id = reqIdRef.current++
      const body = {
        jsonrpc: '2.0',
        id,
        method: 'tools/call',
        params: { name: tool, arguments: args },
      }

      setLog((prev) => [
        {
          id: logIdRef.current++,
          direction: 'request',
          tool,
          payload: body,
          timestamp: Date.now(),
        },
        ...prev,
      ])

      try {
        const res = await fetch('/api/mcp', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify(body),
        })

        const data: JsonRpcResponse = await res.json()

        setLog((prev) => [
          {
            id: logIdRef.current++,
            direction: 'response',
            tool,
            payload: data,
            timestamp: Date.now(),
          },
          ...prev,
        ])

        // Extract the text content from MCP tool result
        if (data.result) {
          const result = data.result as { content?: Array<{ type: string; text: string }> }
          if (result.content?.[0]?.text) {
            try {
              return JSON.parse(result.content[0].text)
            } catch {
              return result.content[0].text
            }
          }
          return result
        }
        return null
      } catch (err) {
        setLog((prev) => [
          {
            id: logIdRef.current++,
            direction: 'response',
            tool,
            payload: {
              error: err instanceof Error ? err.message : 'Network error',
            },
            timestamp: Date.now(),
          },
          ...prev,
        ])
        return null
      } finally {
        setBusy(false)
      }
    },
    [apiKey],
  )

  const disabled = busy || !apiKey

  return (
    <main className="page-wrap px-4 pb-10 pt-8">
      <section className="mb-6">
        <p className="island-kicker mb-2">Demo Console</p>
        <h1 className="display-title m-0 text-4xl font-bold tracking-tight text-[var(--sea-ink)] sm:text-5xl">
          Live MCP provisioning flow.
        </h1>
        <p className="mt-3 max-w-3xl text-base text-[var(--sea-ink-soft)]">
          Use this panel to exercise the MCP JSON-RPC 2.0 endpoint at{' '}
          <code className="rounded bg-[var(--surface-strong)] px-1.5 py-0.5 text-sm">
            POST /api/mcp
          </code>
          . Every button sends a <code>tools/call</code> request with your API
          key. Create a key in the{' '}
          <a href="/dashboard" className="underline">
            Dashboard
          </a>{' '}
          first.
        </p>
      </section>

      {/* API key input */}
      <section className="mb-6">
        <label
          htmlFor="api-key"
          className="mb-1 block text-sm font-medium text-[var(--sea-ink)]"
        >
          API Key
        </label>
        <input
          id="api-key"
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="eqf_..."
          className="w-full max-w-md rounded-xl border border-[var(--line)] bg-[var(--surface)] px-4 py-2.5 text-sm text-[var(--sea-ink)] placeholder:text-[var(--sea-ink-soft)] focus:border-[var(--accent)] focus:outline-none"
        />
        {!apiKey && (
          <p className="mt-1 text-xs text-[var(--sea-ink-soft)]">
            Paste an API key with <strong>mcp</strong> scope to enable actions.
          </p>
        )}
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        {/* Actions panel */}
        <article className="band-shell rounded-2xl p-6">
          <h2 className="m-0 text-lg font-semibold text-[var(--sea-ink)]">
            Actions
          </h2>

          {/* --- Account --- */}
          <p className="mb-2 mt-4 text-xs font-semibold uppercase tracking-wider text-[var(--sea-ink-soft)]">
            Account
          </p>
          <div className="grid gap-3">
            <button
              type="button"
              disabled={disabled}
              onClick={async () => {
                const data = await callTool('create_account', {
                  orgName: 'Forge Labs',
                  contact: 'ops@forgelabs.ai',
                })
                if (data?.accountId) setAccountId(data.accountId)
              }}
              className="rounded-2xl border border-[var(--line)] bg-[var(--tint-blue)] px-4 py-3 text-left text-sm font-semibold text-[var(--sea-ink)] disabled:opacity-40"
            >
              create_account
              <span className="ml-2 text-xs font-normal text-[var(--sea-ink-soft)]">
                orgName=&quot;Forge Labs&quot;
              </span>
            </button>

            <button
              type="button"
              disabled={disabled}
              onClick={async () => {
                await callTool('check_status', {})
              }}
              className="rounded-2xl border border-[var(--line)] bg-[var(--tint-amber)] px-4 py-3 text-left text-sm font-semibold text-[var(--sea-ink)] disabled:opacity-40"
            >
              check_status
            </button>
          </div>

          {/* --- Payment --- */}
          <p className="mb-2 mt-5 text-xs font-semibold uppercase tracking-wider text-[var(--sea-ink-soft)]">
            Payment
          </p>
          <div className="grid gap-3">
            <button
              type="button"
              disabled={disabled || !accountId}
              onClick={() =>
                callTool('attach_payment', {
                  accountId,
                  profile: 'x402-default',
                  wallet: 'x402://wallet/demo',
                })
              }
              className="rounded-2xl border border-[var(--line)] bg-[var(--tint-amber)] px-4 py-3 text-left text-sm font-semibold text-[var(--sea-ink)] disabled:opacity-40"
            >
              attach_payment
              <span className="ml-2 text-xs font-normal text-[var(--sea-ink-soft)]">
                profile=&quot;x402-default&quot;
              </span>
            </button>
          </div>

          {/* --- Storage --- */}
          <p className="mb-2 mt-5 text-xs font-semibold uppercase tracking-wider text-[var(--sea-ink-soft)]">
            Storage
          </p>
          <div className="grid gap-3">
            <button
              type="button"
              disabled={disabled || !accountId}
              onClick={async () => {
                const data = await callTool('provision_storage', {
                  accountId,
                  project: 'agent-lab',
                  region: 'us-east-1',
                  usageCapGb: 2048,
                  paymentProfile: 'x402-default',
                })
                if (data?.serviceId) setServiceId(data.serviceId)
              }}
              className="rounded-2xl border border-[var(--line)] bg-[var(--tint-blue)] px-4 py-3 text-left text-sm font-semibold text-[var(--sea-ink)] disabled:opacity-40"
            >
              provision_storage
              <span className="ml-2 text-xs font-normal text-[var(--sea-ink-soft)]">
                region=&quot;us-east-1&quot;
              </span>
            </button>

            <button
              type="button"
              disabled={disabled || !serviceId}
              onClick={() =>
                callTool('rotate_keys', {
                  serviceId,
                  reason: 'demo rotation',
                })
              }
              className="rounded-2xl border border-[var(--line)] bg-[var(--tint-amber)] px-4 py-3 text-left text-sm font-semibold text-[var(--sea-ink)] disabled:opacity-40"
            >
              rotate_keys
              <span className="ml-2 text-xs font-normal text-[var(--sea-ink-soft)]">
                reason=&quot;demo rotation&quot;
              </span>
            </button>
          </div>

          {/* --- Buckets --- */}
          <p className="mb-2 mt-5 text-xs font-semibold uppercase tracking-wider text-[var(--sea-ink-soft)]">
            Buckets
          </p>
          <div className="grid gap-3">
            <button
              type="button"
              disabled={disabled || !accountId}
              onClick={async () => {
                const name = `demo-${Date.now().toString(36)}`
                const data = await callTool('create_bucket', {
                  accountId,
                  name,
                  region: 'us-east-1',
                })
                if (data?.name) setBucketName(data.name)
              }}
              className="rounded-2xl border border-[var(--line)] bg-[var(--tint-blue)] px-4 py-3 text-left text-sm font-semibold text-[var(--sea-ink)] disabled:opacity-40"
            >
              create_bucket
              <span className="ml-2 text-xs font-normal text-[var(--sea-ink-soft)]">
                auto-named
              </span>
            </button>

            <button
              type="button"
              disabled={disabled || !accountId}
              onClick={() => callTool('list_buckets', { accountId })}
              className="rounded-2xl border border-[var(--line)] bg-[var(--tint-amber)] px-4 py-3 text-left text-sm font-semibold text-[var(--sea-ink)] disabled:opacity-40"
            >
              list_buckets
            </button>

            <button
              type="button"
              disabled={disabled || !bucketName}
              onClick={() =>
                callTool('list_objects', { bucketName, prefix: '' })
              }
              className="rounded-2xl border border-[var(--line)] bg-[var(--tint-amber)] px-4 py-3 text-left text-sm font-semibold text-[var(--sea-ink)] disabled:opacity-40"
            >
              list_objects
              <span className="ml-2 text-xs font-normal text-[var(--sea-ink-soft)]">
                bucket=&quot;{bucketName || '...'}&quot;
              </span>
            </button>
          </div>
        </article>

        {/* Log panel */}
        <article className="band-shell rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <h2 className="m-0 text-lg font-semibold text-[var(--sea-ink)]">
              JSON-RPC Log
            </h2>
            {log.length > 0 && (
              <button
                type="button"
                onClick={() => setLog([])}
                className="text-xs text-[var(--sea-ink-soft)] hover:text-[var(--sea-ink)]"
              >
                Clear
              </button>
            )}
          </div>

          <div className="mt-4 flex max-h-[600px] flex-col gap-3 overflow-y-auto">
            {log.length === 0 && (
              <p className="text-sm text-[var(--sea-ink-soft)]">
                No requests yet. Paste your API key and click an action.
              </p>
            )}
            {log.map((entry) => (
              <div
                key={entry.id}
                className="rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] p-3"
              >
                <div className="mb-1 flex items-center gap-2 text-xs">
                  <span
                    className={`rounded px-1.5 py-0.5 font-mono font-semibold ${
                      entry.direction === 'request'
                        ? 'bg-[var(--tint-blue)] text-[var(--sea-ink)]'
                        : 'bg-[var(--tint-amber)] text-[var(--sea-ink)]'
                    }`}
                  >
                    {entry.direction === 'request' ? 'REQ' : 'RES'}
                  </span>
                  <span className="font-semibold text-[var(--sea-ink)]">
                    {entry.tool}
                  </span>
                  <span className="ml-auto text-[var(--sea-ink-soft)]">
                    {new Date(entry.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <pre className="m-0 max-h-48 overflow-auto text-[11px] leading-relaxed text-[var(--sea-ink)]">
                  {JSON.stringify(entry.payload, null, 2)}
                </pre>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-xl border border-[var(--line)] bg-[var(--surface)] p-3 text-xs text-[var(--sea-ink-soft)]">
            <p className="m-0 font-semibold text-[var(--sea-ink)]">
              Captured IDs
            </p>
            <p className="m-0 mt-1">Account: {accountId || '\u2014'}</p>
            <p className="m-0">Service: {serviceId || '\u2014'}</p>
            <p className="m-0">Bucket: {bucketName || '\u2014'}</p>
          </div>
        </article>
      </section>
    </main>
  )
}
