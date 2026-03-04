import { createFileRoute } from '@tanstack/react-router'
import { PRICING_TABLE } from '#/lib/pricing'

export const Route = createFileRoute('/payments')({
  component: Payments,
})

function Payments() {
  return (
    <main className="page-wrap px-4 pb-10 pt-8">
      <section className="mb-6">
        <p className="island-kicker mb-2">Payments</p>
        <h1 className="display-title m-0 text-4xl font-bold tracking-tight text-[var(--sea-ink)] sm:text-5xl">
          x402-native billing.
        </h1>
        <p className="mt-3 max-w-3xl text-base text-[var(--sea-ink-soft)]">
          Every S3 operation is gated by x402 per-request payment on Base Sepolia.
          Agents sign payments inline; settlement is confirmed before any state change.
        </p>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        {/* Pricing table */}
        <article className="band-shell rounded-2xl p-6">
          <h2 className="m-0 text-lg font-semibold text-[var(--sea-ink)]">
            Pricing schedule
          </h2>
          <p className="mt-2 text-sm text-[var(--sea-ink-soft)]">
            All prices in USD, settled as USDC on Base Sepolia (testnet).
            Grace period rates apply when a service has expired but is within the
            5-day grace window.
          </p>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--line)] text-xs uppercase tracking-wider text-[var(--kicker)]">
                  <th className="pb-2 pr-4">Operation</th>
                  <th className="pb-2 pr-4">Normal rate</th>
                  <th className="pb-2">Grace rate</th>
                </tr>
              </thead>
              <tbody className="text-[var(--sea-ink)]">
                <PriceRow
                  op="PUT object"
                  normal={`$${PRICING_TABLE.PUT_PER_MB}/MB`}
                  grace="Blocked"
                  graceNote="Must extend first"
                />
                <PriceRow
                  op="GET object"
                  normal={`$${PRICING_TABLE.GET_PER_MB}/MB`}
                  grace={`$${PRICING_TABLE.GET_PER_MB * PRICING_TABLE.GRACE_READ_MULTIPLIER}/MB`}
                  graceNote={`${PRICING_TABLE.GRACE_READ_MULTIPLIER}x`}
                />
                <PriceRow
                  op="HEAD object"
                  normal={`$${PRICING_TABLE.HEAD_FLAT}`}
                  grace={`$${PRICING_TABLE.HEAD_FLAT * PRICING_TABLE.GRACE_READ_MULTIPLIER}`}
                  graceNote={`${PRICING_TABLE.GRACE_READ_MULTIPLIER}x`}
                />
                <PriceRow
                  op="LIST bucket"
                  normal={`$${PRICING_TABLE.LIST_FLAT}`}
                  grace={`$${PRICING_TABLE.LIST_FLAT * PRICING_TABLE.GRACE_READ_MULTIPLIER}`}
                  graceNote={`${PRICING_TABLE.GRACE_READ_MULTIPLIER}x`}
                />
                <PriceRow op="DELETE object" normal="Free" grace="Free" />
                <PriceRow
                  op="Create bucket"
                  normal={`$${PRICING_TABLE.CREATE_BUCKET}`}
                  grace="Blocked"
                />
                <PriceRow
                  op="Provision storage"
                  normal={`$${PRICING_TABLE.PROVISION}`}
                  grace="N/A"
                  graceNote="One-time"
                />
                <PriceRow
                  op="Extend storage"
                  normal={`$${PRICING_TABLE.EXTEND_PER_GB_30D}/GB/30d`}
                  grace={`$${PRICING_TABLE.EXTEND_PER_GB_30D * PRICING_TABLE.GRACE_EXTEND_MULTIPLIER}/GB/30d`}
                  graceNote={`${PRICING_TABLE.GRACE_EXTEND_MULTIPLIER}x`}
                />
              </tbody>
            </table>
          </div>
        </article>

        {/* Settlement flow + expiry lifecycle */}
        <div className="flex flex-col gap-4">
          <article className="band-shell rounded-2xl p-6">
            <h2 className="m-0 text-lg font-semibold text-[var(--sea-ink)]">
              x402 settlement flow
            </h2>
            <ol className="m-0 mt-4 list-decimal space-y-3 pl-5 text-sm text-[var(--sea-ink-soft)]">
              <li>
                Agent sends an S3 or MCP request <strong>without</strong> a payment header.
              </li>
              <li>
                Server computes the price server-side and returns{' '}
                <code className="rounded bg-[var(--surface-strong)] px-1 text-xs">HTTP 402</code>{' '}
                with <code className="rounded bg-[var(--surface-strong)] px-1 text-xs">PAYMENT-REQUIRED</code> header.
              </li>
              <li>
                Agent signs the payment (EIP-3009 or Permit2) and retries with{' '}
                <code className="rounded bg-[var(--surface-strong)] px-1 text-xs">PAYMENT-SIGNATURE</code> header.
              </li>
              <li>
                Server verifies the signature with the x402 facilitator.
              </li>
              <li>
                Server settles the payment on-chain (Base Sepolia USDC).
              </li>
              <li>
                Only after confirmed settlement: the operation executes.
              </li>
              <li>
                Billing event recorded with tx hash for auditability.
              </li>
            </ol>
          </article>

          <article className="band-shell rounded-2xl p-6">
            <h2 className="m-0 text-lg font-semibold text-[var(--sea-ink)]">
              Expiry lifecycle
            </h2>
            <div className="mt-4 space-y-2 text-sm text-[var(--sea-ink-soft)]">
              <LifecycleStep
                badge="Active"
                color="green"
                text="Full read/write access. All normal rates apply."
              />
              <LifecycleStep
                badge="Grace"
                color="amber"
                text="5-day window after expiry. Reads at 5x rate. Writes blocked. Extend to reactivate."
              />
              <LifecycleStep
                badge="Deleting"
                color="red"
                text="Grace expired. Objects being deleted in batches (100/day)."
              />
              <LifecycleStep
                badge="Deleted"
                color="gray"
                text="All data removed. Service record retained for billing history."
              />
            </div>
            <div className="mt-4 rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] p-3 text-xs text-[var(--sea-ink-soft)]">
              Cron runs daily at 00:01 UTC. A "day" is a GMT calendar day
              (00:00:00 UTC to 23:59:59 UTC). Expiry timestamps snap to 23:59:00 UTC.
            </div>
          </article>
        </div>
      </section>

      {/* Network info */}
      <section className="mt-6">
        <article className="band-shell rounded-2xl p-6">
          <h2 className="m-0 text-lg font-semibold text-[var(--sea-ink)]">
            Network details
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <InfoCard label="Network" value="Base Sepolia (testnet)" />
            <InfoCard label="Token" value="USDC" />
            <InfoCard label="Chain ID" value="84532" />
            <InfoCard label="Facilitator" value="x402.org (public)" />
          </div>
        </article>
      </section>
    </main>
  )
}

function PriceRow({
  op,
  normal,
  grace,
  graceNote,
}: {
  op: string
  normal: string
  grace: string
  graceNote?: string
}) {
  return (
    <tr className="border-b border-[var(--line)] last:border-b-0">
      <td className="py-2 pr-4 font-medium">{op}</td>
      <td className="py-2 pr-4 font-mono text-xs">{normal}</td>
      <td className="py-2">
        <span className={grace === 'Blocked' ? 'font-semibold text-red-500' : 'font-mono text-xs'}>
          {grace}
        </span>
        {graceNote && (
          <span className="ml-1 text-xs text-[var(--sea-ink-soft)]">({graceNote})</span>
        )}
      </td>
    </tr>
  )
}

function LifecycleStep({
  badge,
  color,
  text,
}: {
  badge: string
  color: 'green' | 'amber' | 'red' | 'gray'
  text: string
}) {
  const colorMap = {
    green: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    amber: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300',
    red: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    gray: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  }

  return (
    <div className="flex items-start gap-3">
      <span
        className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${colorMap[color]}`}
      >
        {badge}
      </span>
      <span>{text}</span>
    </div>
  )
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[var(--line)] bg-[var(--tint-blue)] p-3">
      <p className="m-0 text-xs uppercase tracking-[0.18em] text-[var(--kicker)]">
        {label}
      </p>
      <p className="m-0 mt-1 text-sm font-semibold text-[var(--sea-ink)]">
        {value}
      </p>
    </div>
  )
}
