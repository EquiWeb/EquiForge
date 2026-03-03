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

  // Editable default values
  const [orgName, setOrgName] = useState('Forge Labs')
  const [contact, setContact] = useState('ops@forgelabs.ai')
  const [paymentProfile, setPaymentProfile] = useState('x402-default')
  const [wallet, setWallet] = useState('x402://wallet/demo')
  const [project, setProject] = useState('agent-lab')
  const [region, setRegion] = useState('us-east-1')
  const [newBucketName, setNewBucketName] = useState('')
  const [objectKey, setObjectKey] = useState('hello.txt')
  const [objectContent, setObjectContent] = useState('Hello from EquiForge!')
  const [objectContentType, setObjectContentType] = useState('text/plain')

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
            Accept: 'application/json, text/event-stream',
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

  // S3 endpoint helper for direct HTTP operations
  const callS3 = useCallback(
    async (method: string, path: string, body?: string, contentType?: string) => {
      if (!apiKey) return null
      setBusy(true)

      const tool = `S3 ${method} ${path}`

      setLog((prev) => [
        {
          id: logIdRef.current++,
          direction: 'request',
          tool,
          payload: { method, path, body: body ? `${body.slice(0, 100)}${body.length > 100 ? '...' : ''}` : null },
          timestamp: Date.now(),
        },
        ...prev,
      ])

      try {
        const headers: Record<string, string> = {
          Authorization: `Bearer ${apiKey}`,
        }
        if (contentType) headers['Content-Type'] = contentType

        const res = await fetch(`/s3/${path}`, {
          method,
          headers,
          body: body ?? undefined,
        })

        const resContentType = res.headers.get('Content-Type') ?? ''
        let payload: unknown
        if (resContentType.includes('xml')) {
          payload = { status: res.status, body: await res.text() }
        } else if (resContentType.includes('json')) {
          payload = { status: res.status, body: await res.json() }
        } else if (res.status === 302) {
          payload = { status: res.status, location: res.headers.get('Location') }
        } else {
          const text = await res.text()
          payload = { status: res.status, body: text || '(empty)', etag: res.headers.get('ETag'), contentType: res.headers.get('Content-Type'), contentLength: res.headers.get('Content-Length') }
        }

        setLog((prev) => [
          {
            id: logIdRef.current++,
            direction: 'response',
            tool,
            payload,
            timestamp: Date.now(),
          },
          ...prev,
        ])

        return payload
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
        <p className="island-kicker mb-2">Playground</p>
        <h1 className="display-title m-0 text-4xl font-bold tracking-tight text-[var(--sea-ink)] sm:text-5xl">
          Live MCP provisioning flow.
        </h1>
        <p className="mt-3 max-w-3xl text-base text-[var(--sea-ink-soft)]">
          Use this panel to exercise the MCP JSON-RPC 2.0 endpoint at{' '}
          <code className="rounded bg-[var(--surface-strong)] px-1.5 py-0.5 text-sm">
            POST /api/mcp
          </code>{' '}
          and the S3-compatible endpoints at{' '}
          <code className="rounded bg-[var(--surface-strong)] px-1.5 py-0.5 text-sm">
            /s3/...
          </code>
          . Every button sends a request with your API key. Create a key in the{' '}
          <a href="/dashboard" className="underline">
            Dashboard
          </a>{' '}
          first. See the{' '}
          <a href="/mcp" className="underline">
            API docs
          </a>{' '}
          for details.
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
            Paste an API key to enable actions.
          </p>
        )}
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        {/* Actions panel */}
        <article className="min-w-0 band-shell rounded-2xl p-6">
          <h2 className="m-0 text-lg font-semibold text-[var(--sea-ink)]">
            Actions
          </h2>

          {/* --- Account --- */}
          <p className="mb-2 mt-4 text-xs font-semibold uppercase tracking-wider text-[var(--sea-ink-soft)]">
            Account
          </p>
          <div className="mb-3 grid grid-cols-2 gap-2">
            <EditableField label="Org name" value={orgName} onChange={setOrgName} />
            <EditableField label="Contact" value={contact} onChange={setContact} />
          </div>
          <div className="grid gap-3">
            <ToolButton
              disabled={disabled}
              color="blue"
              name="create_account"
              detail={`orgName="${orgName}"`}
              onClick={async () => {
                const data = await callTool('create_account', { orgName, contact })
                if (data?.accountId) setAccountId(data.accountId)
              }}
            />
            <ToolButton
              disabled={disabled}
              color="amber"
              name="check_status"
              onClick={() => callTool('check_status', {})}
            />
          </div>

          {/* --- Payment --- */}
          <p className="mb-2 mt-5 text-xs font-semibold uppercase tracking-wider text-[var(--sea-ink-soft)]">
            Payment
          </p>
          <div className="mb-3 grid grid-cols-2 gap-2">
            <EditableField label="Profile" value={paymentProfile} onChange={setPaymentProfile} />
            <EditableField label="Wallet" value={wallet} onChange={setWallet} />
          </div>
          <div className="grid gap-3">
            <ToolButton
              disabled={disabled || !accountId}
              color="amber"
              name="attach_payment"
              detail={`profile="${paymentProfile}"`}
              onClick={() =>
                callTool('attach_payment', { accountId, profile: paymentProfile, wallet })
              }
            />
          </div>

          {/* --- Storage --- */}
          <p className="mb-2 mt-5 text-xs font-semibold uppercase tracking-wider text-[var(--sea-ink-soft)]">
            Storage
          </p>
          <div className="mb-3 grid grid-cols-2 gap-2">
            <EditableField label="Project" value={project} onChange={setProject} />
            <EditableField label="Region" value={region} onChange={setRegion} />
          </div>
          <div className="grid gap-3">
            <ToolButton
              disabled={disabled || !accountId}
              color="blue"
              name="provision_storage"
              detail={`project="${project}"`}
              onClick={async () => {
                const data = await callTool('provision_storage', {
                  accountId,
                  project,
                  region,
                  usageCapGb: 2048,
                  paymentProfile,
                })
                if (data?.serviceId) setServiceId(data.serviceId)
              }}
            />
            <ToolButton
              disabled={disabled || !serviceId}
              color="amber"
              name="rotate_keys"
              detail="reason='demo rotation'"
              onClick={() => callTool('rotate_keys', { serviceId, reason: 'demo rotation' })}
            />
          </div>

          {/* --- Buckets --- */}
          <p className="mb-2 mt-5 text-xs font-semibold uppercase tracking-wider text-[var(--sea-ink-soft)]">
            Buckets
          </p>
          <div className="mb-3 grid grid-cols-1 gap-2">
            <EditableField
              label="Bucket name"
              value={newBucketName}
              onChange={setNewBucketName}
              placeholder={`demo-${Date.now().toString(36).slice(0, 6)}`}
            />
          </div>
          <div className="grid gap-3">
            <ToolButton
              disabled={disabled || !accountId}
              color="blue"
              name="create_bucket"
              detail={`name="${newBucketName || 'auto'}"`}
              onClick={async () => {
                const name = newBucketName || `demo-${Date.now().toString(36)}`
                const data = await callTool('create_bucket', { accountId, name, region })
                if (data?.name) setBucketName(data.name)
              }}
            />
            <ToolButton
              disabled={disabled || !accountId}
              color="amber"
              name="list_buckets"
              onClick={() => callTool('list_buckets', { accountId })}
            />
            <ToolButton
              disabled={disabled || !bucketName}
              color="amber"
              name="list_objects"
              detail={`bucket="${bucketName || '...'}"`}
              onClick={() => callTool('list_objects', { bucketName, prefix: '' })}
            />
          </div>

          {/* --- Objects (S3 API) --- */}
          <p className="mb-2 mt-5 text-xs font-semibold uppercase tracking-wider text-[var(--sea-ink-soft)]">
            Objects (via S3 API)
          </p>
          <div className="mb-3 grid gap-2">
            <div className="grid grid-cols-2 gap-2">
              <EditableField label="Object key" value={objectKey} onChange={setObjectKey} />
              <EditableField label="Content-Type" value={objectContentType} onChange={setObjectContentType} />
            </div>
            <EditableField label="Content body" value={objectContent} onChange={setObjectContent} />
          </div>
          <div className="grid gap-3">
            <ToolButton
              disabled={disabled || !bucketName || !objectKey}
              color="blue"
              name="PUT object"
              detail={`${bucketName}/${objectKey}`}
              onClick={() =>
                callS3('PUT', `${bucketName}/${objectKey}`, objectContent, objectContentType)
              }
            />
            <ToolButton
              disabled={disabled || !bucketName || !objectKey}
              color="amber"
              name="GET object"
              detail={`${bucketName}/${objectKey}`}
              onClick={() => callS3('GET', `${bucketName}/${objectKey}`)}
            />
            <ToolButton
              disabled={disabled || !bucketName || !objectKey}
              color="amber"
              name="HEAD object"
              detail={`${bucketName}/${objectKey}`}
              onClick={() => callS3('HEAD', `${bucketName}/${objectKey}`)}
            />
            <ToolButton
              disabled={disabled || !bucketName || !objectKey}
              color="red"
              name="DELETE object"
              detail={`${bucketName}/${objectKey}`}
              onClick={() => callS3('DELETE', `${bucketName}/${objectKey}`)}
            />
            <ToolButton
              disabled={disabled || !bucketName}
              color="amber"
              name="LIST bucket"
              detail={`/s3/${bucketName}`}
              onClick={() => callS3('GET', bucketName)}
            />
          </div>
        </article>

        {/* Log panel */}
        <article className="min-w-0 band-shell rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <h2 className="m-0 text-lg font-semibold text-[var(--sea-ink)]">
              Request Log
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

          <div className="mt-4 flex max-h-[600px] flex-col gap-3 overflow-y-auto min-w-0">
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
                <pre className="m-0 max-h-48 overflow-auto whitespace-pre-wrap break-words text-[11px] leading-relaxed text-[var(--sea-ink)]">
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

// --- Shared UI components ---

function EditableField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  return (
    <div>
      <label className="mb-0.5 block text-[10px] uppercase tracking-wider text-[var(--sea-ink-soft)]">
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-[var(--line)] bg-[var(--surface-strong)] px-2.5 py-1.5 text-xs text-[var(--sea-ink)] outline-none focus:border-[var(--lagoon)]"
      />
    </div>
  )
}

function ToolButton({
  disabled,
  color,
  name,
  detail,
  onClick,
}: {
  disabled: boolean
  color: 'blue' | 'amber' | 'red'
  name: string
  detail?: string
  onClick: () => void
}) {
  const colorClass =
    color === 'red'
      ? 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800'
      : color === 'blue'
        ? 'bg-[var(--tint-blue)] border-[var(--line)]'
        : 'bg-[var(--tint-amber)] border-[var(--line)]'

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`rounded-2xl border px-4 py-3 text-left text-sm font-semibold text-[var(--sea-ink)] disabled:opacity-40 ${colorClass}`}
    >
      {name}
      {detail && (
        <span className="ml-2 text-xs font-normal text-[var(--sea-ink-soft)]">
          {detail}
        </span>
      )}
    </button>
  )
}
