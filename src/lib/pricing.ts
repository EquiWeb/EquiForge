/**
 * pricing.ts — Server-side price calculation for all S3 and storage operations.
 *
 * SECURITY: All prices are computed server-side. The client/agent NEVER specifies
 * the price. These functions are pure (no side effects) and deterministic.
 *
 * All amounts are in USD. The x402 layer handles USD → USDC conversion.
 */

// ---------------------------------------------------------------------------
// Rate table (placeholder rates — easy to adjust)
// ---------------------------------------------------------------------------

/** Normal (active) rates */
const RATES = {
  /** PUT: per megabyte */
  PUT_PER_MB: 0.001,
  /** GET: per megabyte of stored object */
  GET_PER_MB: 0.0001,
  /** HEAD: flat per request */
  HEAD_FLAT: 0.00001,
  /** LIST: flat per request */
  LIST_FLAT: 0.0001,
  /** DELETE: always free */
  DELETE: 0,
  /** CREATE_BUCKET: one-time */
  CREATE_BUCKET: 0.01,
  /** PROVISION: one-time for storage service creation */
  PROVISION: 0.05,
  /** EXTEND: per GB per 30 days */
  EXTEND_PER_GB_30D: 0.01,
} as const

/** Grace period multipliers */
const GRACE = {
  /** Read operations during grace cost 5x */
  READ_MULTIPLIER: 5,
  /** Extend during grace costs 2x */
  EXTEND_MULTIPLIER: 2,
} as const

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type S3Operation = 'PUT' | 'GET' | 'HEAD' | 'DELETE' | 'LIST'
export type BillingOperation = S3Operation | 'CREATE_BUCKET' | 'PROVISION' | 'EXTEND'
export type ServiceStatus = 'active' | 'grace' | 'deleting' | 'deleted' | 'provisioning'

export interface PriceResult {
  /** Price in USD */
  amountUsd: number
  /** The operation priced */
  operation: BillingOperation
  /** Whether grace period penalty was applied */
  wasGracePeriod: boolean
  /** If size-based, the bytes used for calculation */
  sizeBytes?: number
  /** Human-readable breakdown */
  breakdown: string
}

export interface PriceError {
  error: true
  code: 'BLOCKED_GRACE' | 'BLOCKED_STATUS'
  message: string
}

export type PriceOutcome = PriceResult | PriceError

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function bytesToMb(bytes: number): number {
  return bytes / (1024 * 1024)
}

function roundUsd(usd: number): number {
  // Round to 8 decimal places to avoid floating point noise
  return Math.round(usd * 1e8) / 1e8
}

// ---------------------------------------------------------------------------
// Price calculators
// ---------------------------------------------------------------------------

/**
 * Calculate price for a PUT operation.
 * During grace period, writes are BLOCKED (must extend first).
 */
export function pricePut(sizeBytes: number, status: ServiceStatus): PriceOutcome {
  if (status === 'grace') {
    return {
      error: true,
      code: 'BLOCKED_GRACE',
      message: 'Writes are blocked during grace period. Extend your storage first.',
    }
  }
  if (status !== 'active') {
    return {
      error: true,
      code: 'BLOCKED_STATUS',
      message: `Storage service is "${status}". Writes are not allowed.`,
    }
  }
  const mb = bytesToMb(sizeBytes)
  const amountUsd = roundUsd(mb * RATES.PUT_PER_MB)
  return {
    amountUsd,
    operation: 'PUT',
    wasGracePeriod: false,
    sizeBytes,
    breakdown: `${mb.toFixed(4)} MB × $${RATES.PUT_PER_MB}/MB = $${amountUsd}`,
  }
}

/**
 * Calculate price for a GET operation.
 * During grace period, reads cost 5x normal.
 */
export function priceGet(sizeBytes: number, status: ServiceStatus): PriceOutcome {
  if (status !== 'active' && status !== 'grace') {
    return {
      error: true,
      code: 'BLOCKED_STATUS',
      message: `Storage service is "${status}". Reads are not allowed.`,
    }
  }
  const isGrace = status === 'grace'
  const mb = bytesToMb(sizeBytes)
  const rate = isGrace ? RATES.GET_PER_MB * GRACE.READ_MULTIPLIER : RATES.GET_PER_MB
  const amountUsd = roundUsd(mb * rate)
  return {
    amountUsd,
    operation: 'GET',
    wasGracePeriod: isGrace,
    sizeBytes,
    breakdown: `${mb.toFixed(4)} MB × $${rate}/MB${isGrace ? ' (5x grace)' : ''} = $${amountUsd}`,
  }
}

/**
 * Calculate price for a HEAD operation (flat fee).
 * During grace period, costs 5x.
 */
export function priceHead(status: ServiceStatus): PriceOutcome {
  if (status !== 'active' && status !== 'grace') {
    return {
      error: true,
      code: 'BLOCKED_STATUS',
      message: `Storage service is "${status}". HEAD is not allowed.`,
    }
  }
  const isGrace = status === 'grace'
  const rate = isGrace ? RATES.HEAD_FLAT * GRACE.READ_MULTIPLIER : RATES.HEAD_FLAT
  const amountUsd = roundUsd(rate)
  return {
    amountUsd,
    operation: 'HEAD',
    wasGracePeriod: isGrace,
    breakdown: `$${rate}${isGrace ? ' (5x grace)' : ''}`,
  }
}

/**
 * Calculate price for a LIST operation (flat fee).
 * During grace period, costs 5x.
 */
export function priceList(status: ServiceStatus): PriceOutcome {
  if (status !== 'active' && status !== 'grace') {
    return {
      error: true,
      code: 'BLOCKED_STATUS',
      message: `Storage service is "${status}". LIST is not allowed.`,
    }
  }
  const isGrace = status === 'grace'
  const rate = isGrace ? RATES.LIST_FLAT * GRACE.READ_MULTIPLIER : RATES.LIST_FLAT
  const amountUsd = roundUsd(rate)
  return {
    amountUsd,
    operation: 'LIST',
    wasGracePeriod: isGrace,
    breakdown: `$${rate}${isGrace ? ' (5x grace)' : ''}`,
  }
}

/**
 * DELETE is always free, regardless of status.
 * (We allow deletes even during grace to let users clean up.)
 */
export function priceDelete(): PriceResult {
  return {
    amountUsd: 0,
    operation: 'DELETE',
    wasGracePeriod: false,
    breakdown: 'Free',
  }
}

/**
 * Price for creating a new bucket (one-time fee).
 */
export function priceCreateBucket(status: ServiceStatus): PriceOutcome {
  if (status !== 'active') {
    return {
      error: true,
      code: 'BLOCKED_STATUS',
      message: `Storage service is "${status}". Cannot create buckets.`,
    }
  }
  return {
    amountUsd: RATES.CREATE_BUCKET,
    operation: 'CREATE_BUCKET',
    wasGracePeriod: false,
    breakdown: `$${RATES.CREATE_BUCKET} (one-time)`,
  }
}

/**
 * Price for provisioning a new storage service (one-time fee).
 */
export function priceProvision(): PriceResult {
  return {
    amountUsd: RATES.PROVISION,
    operation: 'PROVISION',
    wasGracePeriod: false,
    breakdown: `$${RATES.PROVISION} (one-time)`,
  }
}

/**
 * Price for extending storage duration.
 * @param usageCapGb - the service's storage cap in GB
 * @param days - number of days to extend (must be multiple of 30)
 * @param status - current service status
 */
export function priceExtend(
  usageCapGb: number,
  days: number,
  status: ServiceStatus,
): PriceOutcome {
  if (status !== 'active' && status !== 'grace') {
    return {
      error: true,
      code: 'BLOCKED_STATUS',
      message: `Storage service is "${status}". Cannot extend.`,
    }
  }
  if (days <= 0 || days % 30 !== 0) {
    return {
      error: true,
      code: 'BLOCKED_STATUS',
      message: `Extension must be a positive multiple of 30 days. Got: ${days}`,
    }
  }
  const isGrace = status === 'grace'
  const periods = days / 30
  const baseRate = RATES.EXTEND_PER_GB_30D
  const rate = isGrace ? baseRate * GRACE.EXTEND_MULTIPLIER : baseRate
  const amountUsd = roundUsd(usageCapGb * periods * rate)
  return {
    amountUsd,
    operation: 'EXTEND',
    wasGracePeriod: isGrace,
    breakdown: `${usageCapGb} GB × ${periods} period(s) × $${rate}/GB/30d${isGrace ? ' (2x grace)' : ''} = $${amountUsd}`,
  }
}

// ---------------------------------------------------------------------------
// Unified pricer — dispatches by operation
// ---------------------------------------------------------------------------

export interface PriceRequest {
  operation: BillingOperation
  status: ServiceStatus
  /** Required for PUT/GET */
  sizeBytes?: number
  /** Required for EXTEND */
  usageCapGb?: number
  /** Required for EXTEND (days) */
  extensionDays?: number
}

/**
 * Compute the price for any billable operation.
 * Returns either a PriceResult or a PriceError.
 */
export function computePrice(req: PriceRequest): PriceOutcome {
  switch (req.operation) {
    case 'PUT':
      return pricePut(req.sizeBytes ?? 0, req.status)
    case 'GET':
      return priceGet(req.sizeBytes ?? 0, req.status)
    case 'HEAD':
      return priceHead(req.status)
    case 'LIST':
      return priceList(req.status)
    case 'DELETE':
      return priceDelete()
    case 'CREATE_BUCKET':
      return priceCreateBucket(req.status)
    case 'PROVISION':
      return priceProvision()
    case 'EXTEND':
      return priceExtend(req.usageCapGb ?? 1, req.extensionDays ?? 30, req.status)
    default: {
      const _exhaustive: never = req.operation
      throw new Error(`Unknown operation: ${_exhaustive}`)
    }
  }
}

/**
 * Type guard: is this a pricing error (blocked operation)?
 */
export function isPriceError(outcome: PriceOutcome): outcome is PriceError {
  return 'error' in outcome && outcome.error === true
}

// ---------------------------------------------------------------------------
// Exports for display (used by payments page)
// ---------------------------------------------------------------------------

export const PRICING_TABLE = {
  PUT_PER_MB: RATES.PUT_PER_MB,
  GET_PER_MB: RATES.GET_PER_MB,
  HEAD_FLAT: RATES.HEAD_FLAT,
  LIST_FLAT: RATES.LIST_FLAT,
  CREATE_BUCKET: RATES.CREATE_BUCKET,
  PROVISION: RATES.PROVISION,
  EXTEND_PER_GB_30D: RATES.EXTEND_PER_GB_30D,
  GRACE_READ_MULTIPLIER: GRACE.READ_MULTIPLIER,
  GRACE_EXTEND_MULTIPLIER: GRACE.EXTEND_MULTIPLIER,
} as const
