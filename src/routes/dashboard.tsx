import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useAuthActions } from '@convex-dev/auth/react'
import { useConvexAuth, useQuery, useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { useState, useEffect } from 'react'

export const Route = createFileRoute('/dashboard')({
  component: Dashboard,
})

function Dashboard() {
  const { isAuthenticated, isLoading } = useConvexAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate({ to: '/auth' })
    }
  }, [isAuthenticated, isLoading, navigate])

  if (isLoading || !isAuthenticated) {
    return (
      <main className="page-wrap px-4 pb-10 pt-8">
        <p className="text-sm text-[var(--sea-ink-soft)]">Loading...</p>
      </main>
    )
  }

  return (
    <main className="page-wrap px-4 pb-10 pt-8">
      <section className="mb-6 flex items-start justify-between">
        <div>
          <p className="island-kicker mb-2">Dashboard</p>
          <h1 className="display-title m-0 text-4xl font-bold tracking-tight text-[var(--sea-ink)] sm:text-5xl">
            Control plane.
          </h1>
          <p className="mt-3 max-w-3xl text-base text-[var(--sea-ink-soft)]">
            Manage your account, API keys, and storage services.
          </p>
        </div>
        <SignOutButton />
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <AccountSection />
        <ApiKeysSection />
        <StorageServicesSection />
      </div>
    </main>
  )
}

function SignOutButton() {
  const { signOut } = useAuthActions()

  return (
    <button
      type="button"
      onClick={() => void signOut()}
      className="rounded-2xl border border-[var(--line)] bg-[var(--surface-strong)] px-4 py-2 text-sm font-semibold text-[var(--sea-ink)] transition hover:bg-[var(--link-bg-hover)]"
    >
      Sign out
    </button>
  )
}

function AccountSection() {
  const account = useQuery(api.mcp.getAccountForUser)
  const createAccount = useMutation(api.mcp.createAccount)
  const [creating, setCreating] = useState(false)

  if (account === undefined) {
    return <SectionShell title="Account" loading />
  }

  if (!account) {
    return (
      <SectionShell title="Account">
        <p className="text-sm text-[var(--sea-ink-soft)]">
          No account yet. Create one to start using EquiForge services.
        </p>
        <form
          onSubmit={async (e) => {
            e.preventDefault()
            setCreating(true)
            const fd = new FormData(e.currentTarget)
            try {
              await createAccount({
                orgName: fd.get('orgName') as string,
                contact: fd.get('contact') as string,
              })
            } finally {
              setCreating(false)
            }
          }}
          className="mt-3 space-y-2"
        >
          <input
            name="orgName"
            required
            placeholder="Organization name"
            className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] px-3 py-2 text-sm text-[var(--sea-ink)] outline-none focus:border-[var(--lagoon)]"
          />
          <input
            name="contact"
            type="email"
            required
            placeholder="Contact email"
            className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] px-3 py-2 text-sm text-[var(--sea-ink)] outline-none focus:border-[var(--lagoon)]"
          />
          <button
            type="submit"
            disabled={creating}
            className="rounded-2xl bg-[var(--lagoon)] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
          >
            {creating ? 'Creating...' : 'Create account'}
          </button>
        </form>
      </SectionShell>
    )
  }

  return (
    <SectionShell title="Account">
      <div className="space-y-2">
        <InfoRow label="Organization" value={account.orgName} />
        <InfoRow label="Contact" value={account.contact} />
        <InfoRow label="Created" value={new Date(account.createdAt).toLocaleDateString()} />
        <InfoRow
          label="Payment profiles"
          value={account.paymentProfiles.length > 0 ? account.paymentProfiles.join(', ') : 'None'}
        />
      </div>
    </SectionShell>
  )
}

function ApiKeysSection() {
  const keys = useQuery(api.apiKeys.listApiKeys)
  const createKey = useMutation(api.apiKeys.createApiKey)
  const revokeKey = useMutation(api.apiKeys.revokeApiKey)
  const [newKey, setNewKey] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)

  if (keys === undefined) {
    return <SectionShell title="API Keys" loading />
  }

  return (
    <SectionShell title="API Keys">
      <p className="mb-3 text-sm text-[var(--sea-ink-soft)]">
        API keys authenticate agents and MCP clients. Keys are shown only once on
        creation.
      </p>

      {newKey && (
        <div className="mb-3 rounded-xl border border-green-300 bg-green-50 p-3 dark:border-green-700 dark:bg-green-950">
          <p className="text-xs font-semibold text-green-800 dark:text-green-300">
            New key created — copy it now, it won't be shown again:
          </p>
          <code className="mt-1 block break-all text-sm text-green-900 dark:text-green-200">
            {newKey}
          </code>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(newKey)
            }}
            className="mt-2 rounded-lg bg-green-200 px-3 py-1 text-xs font-semibold text-green-800 dark:bg-green-800 dark:text-green-200"
          >
            Copy to clipboard
          </button>
        </div>
      )}

      {/* Existing keys */}
      <div className="space-y-2">
        {keys.length === 0 && (
          <p className="text-sm text-[var(--sea-ink-soft)]">No API keys yet.</p>
        )}
        {keys.map((k) => (
          <div
            key={k._id}
            className="flex items-center justify-between rounded-xl border border-[var(--line)] bg-[var(--tint-blue)] p-3"
          >
            <div>
              <p className="m-0 text-sm font-semibold text-[var(--sea-ink)]">
                {k.name}
              </p>
              <p className="m-0 text-xs text-[var(--sea-ink-soft)]">
                {k.prefix}... &middot; {k.scopes.join(', ')}
                {k.revokedAt && (
                  <span className="ml-2 text-red-500">Revoked</span>
                )}
              </p>
            </div>
            {!k.revokedAt && (
              <button
                type="button"
                onClick={() => revokeKey({ keyId: k._id })}
                className="rounded-lg border border-red-300 px-2 py-1 text-xs font-semibold text-red-600 transition hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-950"
              >
                Revoke
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Create new key */}
      <form
        onSubmit={async (e) => {
          e.preventDefault()
          setCreating(true)
          setNewKey(null)
          const fd = new FormData(e.currentTarget)
          try {
            const result = await createKey({
              name: fd.get('keyName') as string,
              scopes: ['*'],
            })
            setNewKey(result.key)
            e.currentTarget.reset()
          } finally {
            setCreating(false)
          }
        }}
        className="mt-3 flex gap-2"
      >
        <input
          name="keyName"
          required
          placeholder="Key name (e.g. my-agent)"
          className="flex-1 rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] px-3 py-2 text-sm text-[var(--sea-ink)] outline-none focus:border-[var(--lagoon)]"
        />
        <button
          type="submit"
          disabled={creating}
          className="rounded-2xl bg-[var(--lagoon)] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
        >
          {creating ? '...' : 'Create key'}
        </button>
      </form>
    </SectionShell>
  )
}

function StorageServicesSection() {
  const services = useQuery(api.mcp.listStorageServices)

  if (services === undefined) {
    return <SectionShell title="Storage Services" loading />
  }

  return (
    <SectionShell title="Storage Services" className="lg:col-span-2">
      {services.length === 0 ? (
        <p className="text-sm text-[var(--sea-ink-soft)]">
          No storage services provisioned yet. Use the MCP endpoint or demo
          console to provision one.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {services.map((s) => (
            <div
              key={s._id}
              className="rounded-xl border border-[var(--line)] bg-[var(--tint-amber)] p-4"
            >
              <p className="m-0 text-sm font-semibold text-[var(--sea-ink)]">
                {s.project}
              </p>
              <p className="m-0 text-xs uppercase tracking-[0.18em] text-[var(--kicker)]">
                {s.status} &middot; {s.region}
              </p>
              <div className="mt-2 space-y-1 text-xs text-[var(--sea-ink-soft)]">
                <p className="m-0">Endpoint: {s.endpoint}</p>
                <p className="m-0">Access key: {s.accessKeyId}</p>
                <p className="m-0">
                  Usage cap: {s.usageCapGb ? `${s.usageCapGb} GB` : 'Unlimited'}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </SectionShell>
  )
}

// --- Shared UI ---

function SectionShell({
  title,
  children,
  loading,
  className,
}: {
  title: string
  children?: React.ReactNode
  loading?: boolean
  className?: string
}) {
  return (
    <article className={`band-shell rounded-2xl p-6 ${className ?? ''}`}>
      <h2 className="m-0 text-lg font-semibold text-[var(--sea-ink)]">
        {title}
      </h2>
      <div className="mt-4">
        {loading ? (
          <p className="text-sm text-[var(--sea-ink-soft)]">Loading...</p>
        ) : (
          children
        )}
      </div>
    </article>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between">
      <span className="text-xs uppercase tracking-[0.18em] text-[var(--kicker)]">
        {label}
      </span>
      <span className="text-sm font-semibold text-[var(--sea-ink)]">
        {value}
      </span>
    </div>
  )
}
