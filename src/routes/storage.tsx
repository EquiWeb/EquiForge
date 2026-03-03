import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useConvexAuth, useQuery, useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { useState, useEffect } from 'react'
import type { Id } from '../../convex/_generated/dataModel'

export const Route = createFileRoute('/storage')({
  component: StoragePage,
})

function StoragePage() {
  const { isAuthenticated, isLoading } = useConvexAuth()
  const navigate = useNavigate()
  const [selectedBucket, setSelectedBucket] = useState<string | null>(null)

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
      <section className="mb-6">
        <p className="island-kicker mb-2">Storage</p>
        <h1 className="display-title m-0 text-4xl font-bold tracking-tight text-[var(--sea-ink)] sm:text-5xl">
          S3-compatible storage for agents.
        </h1>
        <p className="mt-3 max-w-3xl text-base text-[var(--sea-ink-soft)]">
          Manage buckets, browse objects, and configure access. All data is
          persisted in Convex file storage.
        </p>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.5fr]">
        <BucketList
          selectedBucket={selectedBucket}
          onSelectBucket={setSelectedBucket}
        />
        {selectedBucket ? (
          <ObjectBrowser
            bucketId={selectedBucket as Id<'storageBuckets'>}
            onClose={() => setSelectedBucket(null)}
          />
        ) : (
          <EmptyState />
        )}
      </div>
    </main>
  )
}

function BucketList({
  selectedBucket,
  onSelectBucket,
}: {
  selectedBucket: string | null
  onSelectBucket: (id: string | null) => void
}) {
  const account = useQuery(api.mcp.getAccountForUser)
  const buckets = useQuery(
    api.storage.listBuckets,
    account ? { accountId: account._id } : 'skip',
  )
  const createBucket = useMutation(api.storage.createBucket)
  const deleteBucket = useMutation(api.storage.deleteBucket)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (account === undefined || buckets === undefined) {
    return <SectionShell title="Buckets" loading />
  }

  if (!account) {
    return (
      <SectionShell title="Buckets">
        <p className="text-sm text-[var(--sea-ink-soft)]">
          Create an account from the Dashboard first to manage storage.
        </p>
      </SectionShell>
    )
  }

  return (
    <SectionShell title="Buckets">
      {error && (
        <div className="mb-3 rounded-xl border border-red-300 bg-red-50 p-2 text-xs text-red-700 dark:border-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
        </div>
      )}

      <div className="space-y-2">
        {buckets.length === 0 && (
          <p className="text-sm text-[var(--sea-ink-soft)]">
            No buckets yet. Create one below.
          </p>
        )}
        {buckets.map((b) => (
          <div
            key={b._id}
            onClick={() =>
              onSelectBucket(b._id === selectedBucket ? null : b._id)
            }
            className={`cursor-pointer rounded-xl border p-3 transition ${
              b._id === selectedBucket
                ? 'border-[var(--lagoon)] bg-[var(--tint-blue)]'
                : 'border-[var(--line)] bg-[var(--surface-strong)] hover:border-[var(--lagoon)]'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="m-0 text-sm font-semibold text-[var(--sea-ink)]">
                  {b.name}
                </p>
                <p className="m-0 text-xs text-[var(--sea-ink-soft)]">
                  {b.region} &middot;{' '}
                  {b.isPublic ? 'Public' : 'Private'} &middot;{' '}
                  {new Date(b.createdAt).toLocaleDateString()}
                </p>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setError(null)
                  deleteBucket({ bucketId: b._id }).catch((err: unknown) => {
                    const message = err instanceof Error ? err.message : 'Failed to delete bucket'
                    setError(message)
                  })
                  if (b._id === selectedBucket) {
                    onSelectBucket(null)
                  }
                }}
                className="rounded-lg border border-red-300 px-2 py-1 text-xs font-semibold text-red-600 transition hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-950"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      <form
        onSubmit={async (e) => {
          e.preventDefault()
          setCreating(true)
          setError(null)
          const fd = new FormData(e.currentTarget)
          try {
            await createBucket({
              accountId: account._id,
              name: fd.get('bucketName') as string,
              region: fd.get('region') as string || 'us-east-1',
            })
            e.currentTarget.reset()
          } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Failed to create bucket'
            setError(message)
          } finally {
            setCreating(false)
          }
        }}
        className="mt-4 space-y-2"
      >
        <input
          name="bucketName"
          required
          placeholder="Bucket name"
          pattern="[a-z0-9][a-z0-9.-]{2,62}"
          title="3-63 lowercase letters, numbers, dots, and hyphens"
          className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] px-3 py-2 text-sm text-[var(--sea-ink)] outline-none focus:border-[var(--lagoon)]"
        />
        <div className="flex gap-2">
          <select
            name="region"
            defaultValue="us-east-1"
            className="flex-1 rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] px-3 py-2 text-sm text-[var(--sea-ink)] outline-none focus:border-[var(--lagoon)]"
          >
            <option value="us-east-1">us-east-1</option>
            <option value="us-west-2">us-west-2</option>
            <option value="eu-west-1">eu-west-1</option>
            <option value="ap-northeast-1">ap-northeast-1</option>
          </select>
          <button
            type="submit"
            disabled={creating}
            className="rounded-2xl bg-[var(--lagoon)] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
          >
            {creating ? '...' : 'Create'}
          </button>
        </div>
      </form>
    </SectionShell>
  )
}

function ObjectBrowser({
  bucketId,
  onClose,
}: {
  bucketId: Id<'storageBuckets'>
  onClose: () => void
}) {
  const [prefix, setPrefix] = useState('')
  const [debouncedPrefix, setDebouncedPrefix] = useState('')
  const [error, setError] = useState<string | null>(null)

  // Debounce prefix to avoid spamming queries on every keystroke
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedPrefix(prefix), 300)
    return () => clearTimeout(timer)
  }, [prefix])

  const objects = useQuery(api.storage.webListObjects, {
    bucketId,
    prefix: debouncedPrefix || undefined,
  })
  const deleteObject = useMutation(api.storage.deleteObject)

  if (objects === undefined) {
    return <SectionShell title="Objects" loading />
  }

  const filtered = objects.objects

  return (
    <SectionShell title="Objects">
      <div className="mb-3 flex items-center gap-2">
        <input
          type="text"
          placeholder="Filter by prefix..."
          value={prefix}
          onChange={(e) => setPrefix(e.target.value)}
          className="flex-1 rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] px-3 py-2 text-sm text-[var(--sea-ink)] outline-none focus:border-[var(--lagoon)]"
        />
        <button
          type="button"
          onClick={onClose}
          className="rounded-xl border border-[var(--line)] px-3 py-2 text-sm text-[var(--sea-ink-soft)] transition hover:bg-[var(--link-bg-hover)]"
        >
          Close
        </button>
      </div>

      {error && (
        <div className="mb-3 rounded-xl border border-red-300 bg-red-50 p-2 text-xs text-red-700 dark:border-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
        </div>
      )}

      <div className="space-y-1">
        <div className="flex items-center border-b border-[var(--line)] pb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--kicker)]">
          <span className="flex-1">Key</span>
          <span className="w-20 text-right">Size</span>
          <span className="w-32 text-right">Modified</span>
          <span className="w-16" />
        </div>

        {filtered.length === 0 ? (
          <p className="py-4 text-center text-sm text-[var(--sea-ink-soft)]">
            {prefix ? 'No objects match this prefix.' : 'Bucket is empty.'}
          </p>
        ) : (
          filtered.map((obj) => (
            <div
              key={obj.key}
              className="flex items-center rounded-lg py-2 text-sm hover:bg-[var(--tint-blue)]"
            >
              <span
                className="flex-1 truncate font-mono text-xs text-[var(--sea-ink)]"
                title={obj.key}
              >
                {obj.key}
              </span>
              <span className="w-20 text-right text-xs text-[var(--sea-ink-soft)]">
                {formatBytes(obj.size)}
              </span>
              <span className="w-32 text-right text-xs text-[var(--sea-ink-soft)]">
                {new Date(obj.lastModified).toLocaleDateString()}
              </span>
              <span className="flex w-16 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setError(null)
                    deleteObject({ bucketId, key: obj.key }).catch(
                      (err: unknown) => {
                        const message = err instanceof Error ? err.message : 'Failed to delete'
                        setError(message)
                      },
                    )
                  }}
                  className="rounded px-2 py-0.5 text-xs text-red-500 transition hover:bg-red-50 dark:hover:bg-red-950"
                  title="Delete object"
                >
                  Delete
                </button>
              </span>
            </div>
          ))
        )}
      </div>

      {objects.isTruncated && (
        <p className="mt-2 text-xs text-[var(--sea-ink-soft)]">
          Results truncated. {objects.keyCount} of many objects shown.
        </p>
      )}

      <p className="mt-4 text-xs text-[var(--sea-ink-soft)]">
        Upload objects via the MCP endpoint (<code>put_object</code> tool) or S3
        API (<code>PUT /s3/bucket/key</code>).
      </p>
    </SectionShell>
  )
}

function EmptyState() {
  return (
    <SectionShell title="Objects">
      <p className="text-sm text-[var(--sea-ink-soft)]">
        Select a bucket to browse its objects, or create a new bucket.
      </p>
      <div className="mt-4 rounded-2xl border border-[var(--line)] bg-[var(--tint-amber)] p-4">
        <p className="m-0 text-xs uppercase tracking-[0.18em] text-[var(--kicker)]">
          S3 API endpoint
        </p>
        <pre className="m-0 mt-2 text-xs text-[var(--sea-ink)]">
          <code>{`PUT  /s3/{bucket}/{key}    Upload
GET  /s3/{bucket}/{key}    Download
GET  /s3/{bucket}          List
DELETE /s3/{bucket}/{key}  Delete`}</code>
        </pre>
      </div>
    </SectionShell>
  )
}

// --- Shared UI ---

function SectionShell({
  title,
  children,
  loading,
}: {
  title: string
  children?: React.ReactNode
  loading?: boolean
}) {
  return (
    <article className="band-shell rounded-2xl p-6">
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

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${(bytes / Math.pow(k, i)).toFixed(i > 0 ? 1 : 0)} ${sizes[i]}`
}
