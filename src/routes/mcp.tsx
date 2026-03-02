import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/mcp')({
  component: McpPage,
})

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
          any tool.
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
              </code>
            </p>
          </div>

          <h2 className="mt-6 text-lg font-semibold text-[var(--sea-ink)]">
            Available tools
          </h2>
          <div className="mt-4 grid gap-3">
            {[
              {
                name: 'create_account',
                description: 'Create a new EquiForge account for an agent org.',
              },
              {
                name: 'check_status',
                description: 'Fetch account info and all provisioned services.',
              },
              {
                name: 'attach_payment',
                description: 'Bind x402 payment credentials to an account.',
              },
              {
                name: 'provision_storage',
                description: 'Provision S3-compatible storage with quotas.',
              },
              {
                name: 'rotate_keys',
                description: 'Rotate access keys for a storage service.',
              },
              {
                name: 'create_bucket',
                description: 'Create an S3-compatible storage bucket.',
              },
              {
                name: 'list_buckets',
                description: 'List all buckets for an account.',
              },
              {
                name: 'put_object',
                description: 'Get an upload URL for storing an object.',
              },
              {
                name: 'put_object_complete',
                description: 'Finalize an object after uploading to the storage URL.',
              },
              {
                name: 'get_object',
                description: 'Get an object download URL from a bucket.',
              },
              {
                name: 'delete_object',
                description: 'Delete an object from a bucket.',
              },
              {
                name: 'list_objects',
                description: 'List objects in a bucket with optional prefix filter.',
              },
            ].map((tool) => (
              <div
                key={tool.name}
                className="rounded-2xl border border-[var(--line)] bg-[var(--tint-blue)] p-4"
              >
                <p className="m-0 font-mono text-sm font-semibold text-[var(--sea-ink)]">
                  {tool.name}
                </p>
                <p className="m-0 mt-2 text-sm text-[var(--sea-ink-soft)]">
                  {tool.description}
                </p>
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
              Direct HTTP access for S3 clients. Same API key auth.
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
