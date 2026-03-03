import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/mcp')({
  component: McpPage,
})

type ToolDoc = {
  name: string
  description: string
  params: { name: string; type: string; required: boolean; description: string }[]
}

const tools: ToolDoc[] = [
  {
    name: 'create_account',
    description: 'Create a new EquiForge account for an agent org.',
    params: [
      { name: 'orgName', type: 'string', required: true, description: 'Organization name' },
      { name: 'contact', type: 'string', required: true, description: 'Contact email' },
    ],
  },
  {
    name: 'check_status',
    description: 'Fetch account info and all provisioned services.',
    params: [],
  },
  {
    name: 'attach_payment',
    description: 'Bind x402 payment credentials to an account.',
    params: [
      { name: 'accountId', type: 'string', required: true, description: 'Account ID' },
      { name: 'profile', type: 'string', required: true, description: 'Payment profile identifier' },
      { name: 'wallet', type: 'string', required: true, description: 'Wallet address (e.g. x402://wallet/0x...)' },
    ],
  },
  {
    name: 'provision_storage',
    description: 'Provision S3-compatible storage with quotas.',
    params: [
      { name: 'accountId', type: 'string', required: true, description: 'Account ID' },
      { name: 'project', type: 'string', required: true, description: 'Project name' },
      { name: 'region', type: 'string', required: true, description: 'Storage region (e.g. us-east-1)' },
      { name: 'paymentProfile', type: 'string', required: true, description: 'Payment profile to use' },
      { name: 'usageCapGb', type: 'number', required: false, description: 'Usage cap in GB' },
    ],
  },
  {
    name: 'rotate_keys',
    description: 'Rotate access keys for a storage service.',
    params: [
      { name: 'serviceId', type: 'string', required: true, description: 'Storage service ID' },
      { name: 'reason', type: 'string', required: false, description: 'Reason for rotation' },
    ],
  },
  {
    name: 'create_bucket',
    description: 'Create an S3-compatible storage bucket.',
    params: [
      { name: 'accountId', type: 'string', required: true, description: 'Account ID' },
      { name: 'name', type: 'string', required: true, description: 'Bucket name (globally unique)' },
      { name: 'region', type: 'string', required: true, description: 'Bucket region' },
      { name: 'isPublic', type: 'boolean', required: false, description: 'Whether bucket is publicly readable' },
    ],
  },
  {
    name: 'list_buckets',
    description: 'List all buckets for an account.',
    params: [
      { name: 'accountId', type: 'string', required: true, description: 'Account ID' },
    ],
  },
  {
    name: 'put_object',
    description: 'Get an upload URL for storing an object.',
    params: [
      { name: 'bucketName', type: 'string', required: true, description: 'Bucket name' },
      { name: 'key', type: 'string', required: true, description: 'Object key (path)' },
      { name: 'size', type: 'number', required: true, description: 'Object size in bytes' },
      { name: 'contentType', type: 'string', required: false, description: 'MIME type' },
    ],
  },
  {
    name: 'put_object_complete',
    description: 'Finalize an object after uploading to the storage URL.',
    params: [
      { name: 'bucketId', type: 'string', required: true, description: 'Bucket ID' },
      { name: 'key', type: 'string', required: true, description: 'Object key' },
      { name: 'storageId', type: 'string', required: true, description: 'Storage ID from upload response' },
      { name: 'size', type: 'number', required: true, description: 'Object size in bytes' },
      { name: 'contentType', type: 'string', required: true, description: 'MIME type' },
      { name: 'etag', type: 'string', required: true, description: 'ETag/hash of the content' },
    ],
  },
  {
    name: 'get_object',
    description: 'Get an object download URL from a bucket.',
    params: [
      { name: 'bucketName', type: 'string', required: true, description: 'Bucket name' },
      { name: 'key', type: 'string', required: true, description: 'Object key' },
    ],
  },
  {
    name: 'delete_object',
    description: 'Delete an object from a bucket.',
    params: [
      { name: 'bucketName', type: 'string', required: true, description: 'Bucket name' },
      { name: 'key', type: 'string', required: true, description: 'Object key' },
    ],
  },
  {
    name: 'list_objects',
    description: 'List objects in a bucket with optional prefix filter.',
    params: [
      { name: 'bucketName', type: 'string', required: true, description: 'Bucket name' },
      { name: 'prefix', type: 'string', required: false, description: 'Key prefix to filter by' },
      { name: 'maxKeys', type: 'number', required: false, description: 'Max results (default 1000)' },
    ],
  },
]

function McpPage() {
  return (
    <main className="page-wrap px-4 pb-10 pt-8">
      <section className="mb-6">
        <p className="island-kicker mb-2">MCP</p>
        <h1 className="display-title m-0 text-4xl font-bold tracking-tight text-[var(--sea-ink)] sm:text-5xl">
          MCP-first provisioning and support.
        </h1>
        <p className="mt-3 max-w-3xl text-base text-[var(--sea-ink-soft)]">
          Agents discover EquiForge, authenticate, and manage services through a
          single JSON-RPC 2.0 endpoint. Authenticate with an API key, then call
          any tool. Try it live in the{' '}
          <a href="/demo" className="underline">
            Demo Console
          </a>
          .
        </p>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <article className="band-shell rounded-2xl p-6">
          <h2 className="m-0 text-lg font-semibold text-[var(--sea-ink)]">
            Endpoint
          </h2>
          <div className="mt-3 rounded-2xl border border-[var(--line)] bg-[var(--tint-blue)] p-4">
            <p className="m-0 font-mono text-sm font-semibold text-[var(--sea-ink)]">
              POST /api/mcp
            </p>
            <p className="m-0 mt-1 text-sm text-[var(--sea-ink-soft)]">
              JSON-RPC 2.0 over Streamable HTTP. Requires{' '}
              <code className="rounded bg-[var(--surface-strong)] px-1 py-0.5 text-xs">
                Authorization: Bearer eqf_...
              </code>{' '}
              and{' '}
              <code className="rounded bg-[var(--surface-strong)] px-1 py-0.5 text-xs">
                Accept: application/json, text/event-stream
              </code>
            </p>
          </div>

          <h2 className="mt-6 text-lg font-semibold text-[var(--sea-ink)]">
            Available tools ({tools.length})
          </h2>
          <div className="mt-4 grid gap-3">
            {tools.map((tool) => (
              <div
                key={tool.name}
                className="rounded-2xl border border-[var(--line)] bg-[var(--tint-blue)] p-4"
              >
                <p className="m-0 font-mono text-sm font-semibold text-[var(--sea-ink)]">
                  {tool.name}
                </p>
                <p className="m-0 mt-1 text-sm text-[var(--sea-ink-soft)]">
                  {tool.description}
                </p>
                {tool.params.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {tool.params.map((p) => (
                      <div key={p.name} className="flex items-baseline gap-2 text-xs">
                        <code className="rounded bg-[var(--surface-strong)] px-1 py-0.5 font-semibold text-[var(--sea-ink)]">
                          {p.name}
                        </code>
                        <span className="text-[var(--sea-ink-soft)]">
                          {p.type}
                          {!p.required && ' (optional)'}
                        </span>
                        <span className="text-[var(--sea-ink-soft)]">
                          &mdash; {p.description}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </article>

        <div className="flex flex-col gap-4">
          <article className="band-shell rounded-2xl p-6">
            <h2 className="m-0 text-lg font-semibold text-[var(--sea-ink)]">
              Example: tool discovery
            </h2>
            <p className="mt-3 text-sm text-[var(--sea-ink-soft)]">
              Send a JSON-RPC 2.0 request to discover available tools.
            </p>
            <pre className="mt-4 overflow-x-auto text-xs text-[var(--sea-ink)]">
              <code>{`POST /api/mcp
Authorization: Bearer eqf_your_key_here
Content-Type: application/json
Accept: application/json, text/event-stream

{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/list"
}`}</code>
            </pre>
          </article>

          <article className="band-shell rounded-2xl p-6">
            <h2 className="m-0 text-lg font-semibold text-[var(--sea-ink)]">
              Example: call a tool
            </h2>
            <p className="mt-3 text-sm text-[var(--sea-ink-soft)]">
              Create an account, attach payment, then provision storage.
            </p>
            <pre className="mt-4 overflow-x-auto text-xs text-[var(--sea-ink)]">
              <code>{`POST /api/mcp
Authorization: Bearer eqf_your_key_here
Content-Type: application/json
Accept: application/json, text/event-stream

{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/call",
  "params": {
    "name": "create_account",
    "arguments": {
      "orgName": "Forge Labs",
      "contact": "ops@forgelabs.ai"
    }
  }
}`}</code>
            </pre>
          </article>

          <article className="band-shell rounded-2xl p-6">
            <h2 className="m-0 text-lg font-semibold text-[var(--sea-ink)]">
              S3-compatible endpoints
            </h2>
            <p className="mt-3 text-sm text-[var(--sea-ink-soft)]">
              Direct HTTP access for S3 clients. Same API key auth via{' '}
              <code className="rounded bg-[var(--surface-strong)] px-1 py-0.5 text-xs">
                Authorization: Bearer eqf_...
              </code>
            </p>
            <pre className="mt-4 overflow-x-auto text-xs text-[var(--sea-ink)]">
              <code>{`PUT  /s3/{bucket}          Create bucket
PUT  /s3/{bucket}/{key}    Upload object
GET  /s3/{bucket}          List objects
GET  /s3/{bucket}/{key}    Download object
DELETE /s3/{bucket}/{key}  Delete object
DELETE /s3/{bucket}        Delete bucket
HEAD /s3/{bucket}/{key}    Object metadata`}</code>
            </pre>
          </article>
        </div>
      </section>
    </main>
  )
}
