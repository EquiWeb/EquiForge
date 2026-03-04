/**
 * billing-dates.ts — GMT/UTC calendar day boundary utilities.
 *
 * All EquiForge billing operates on GMT calendar days:
 * - A "day" = 00:00:00 UTC to 23:59:59 UTC
 * - Expiry timestamps are snapped to 23:59:00 UTC (the ":00" not ":59" avoids
 *   edge cases with second-level comparisons in the cron)
 * - GMT does NOT observe DST — all times are UTC, period
 * - Cron runs at 00:01 UTC daily, so services expire at 23:59 the previous day
 *
 * All functions are pure and return ISO 8601 strings.
 */

// ---------------------------------------------------------------------------
// Core boundary functions
// ---------------------------------------------------------------------------

/**
 * Returns 00:00:00.000 UTC on the given date's calendar day.
 */
export function startOfDayUTC(date: Date = new Date()): Date {
  const d = new Date(date)
  d.setUTCHours(0, 0, 0, 0)
  return d
}

/**
 * Returns 23:59:00.000 UTC on the given date's calendar day.
 * We use :59:00 (not :59:59) to leave a clean boundary for the cron job
 * which runs at 00:01 UTC — there's a full minute gap.
 */
export function endOfDayUTC(date: Date = new Date()): Date {
  const d = new Date(date)
  d.setUTCHours(23, 59, 0, 0)
  return d
}

// ---------------------------------------------------------------------------
// Snapping / adding days
// ---------------------------------------------------------------------------

/**
 * Add N calendar days to a date, then snap to 23:59:00 UTC on that day.
 *
 * @param from - base date (if string, parsed as ISO 8601)
 * @param days - number of calendar days to add
 * @returns ISO 8601 string snapped to 23:59:00 UTC
 */
export function addDaysSnapped(from: Date | string, days: number): string {
  const base = typeof from === 'string' ? new Date(from) : new Date(from)
  base.setUTCDate(base.getUTCDate() + days)
  return endOfDayUTC(base).toISOString()
}

/**
 * Snap a date to 23:59:00 UTC on its calendar day.
 * Used when setting initial expiresAt or recalculating after extension.
 */
export function snapToEndOfDay(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : new Date(date)
  return endOfDayUTC(d).toISOString()
}

// ---------------------------------------------------------------------------
// Grace period
// ---------------------------------------------------------------------------

/** Number of grace days after expiry before deletion begins */
export const GRACE_PERIOD_DAYS = 5

/**
 * Given an expiresAt timestamp, compute the graceExpiresAt timestamp.
 * Grace period = expiresAt + 5 calendar days, snapped to 23:59:00 UTC.
 */
export function computeGraceExpiry(expiresAt: string): string {
  return addDaysSnapped(expiresAt, GRACE_PERIOD_DAYS)
}

// ---------------------------------------------------------------------------
// Extension helpers
// ---------------------------------------------------------------------------

/**
 * Compute a new expiresAt after extending by N days.
 *
 * If the service is still active (not yet expired), the extension starts from
 * the current expiresAt. If the service is in grace (already expired), the
 * extension starts from NOW (you don't get credit for the grace period you used).
 *
 * @param currentExpiresAt - current expiresAt ISO string (may be in the past for grace)
 * @param extensionDays - days to extend (must be positive multiple of 30)
 * @param isGrace - whether the service is currently in grace period
 * @returns New expiresAt and graceExpiresAt ISO strings
 */
export function computeExtension(
  currentExpiresAt: string,
  extensionDays: number,
  isGrace: boolean,
): { expiresAt: string; graceExpiresAt: string } {
  const base = isGrace ? new Date() : new Date(currentExpiresAt)
  const newExpiresAt = addDaysSnapped(base, extensionDays)
  const newGraceExpiresAt = computeGraceExpiry(newExpiresAt)
  return {
    expiresAt: newExpiresAt,
    graceExpiresAt: newGraceExpiresAt,
  }
}

/**
 * Compute the initial expiresAt for a newly provisioned storage service.
 * Default: 30 days from now, snapped to 23:59:00 UTC.
 */
export function computeInitialExpiry(daysFromNow: number = 30): {
  expiresAt: string
  graceExpiresAt: string
} {
  const expiresAt = addDaysSnapped(new Date(), daysFromNow)
  const graceExpiresAt = computeGraceExpiry(expiresAt)
  return { expiresAt, graceExpiresAt }
}

// ---------------------------------------------------------------------------
// Status checks (used by cron and request handlers)
// ---------------------------------------------------------------------------

/**
 * Check if a service has expired (current time is past expiresAt).
 */
export function isExpired(expiresAt: string, now: Date = new Date()): boolean {
  return now > new Date(expiresAt)
}

/**
 * Check if the grace period has expired.
 */
export function isGraceExpired(graceExpiresAt: string, now: Date = new Date()): boolean {
  return now > new Date(graceExpiresAt)
}

/**
 * Calculate days remaining until expiry. Returns negative if expired.
 */
export function daysUntilExpiry(expiresAt: string, now: Date = new Date()): number {
  const diff = new Date(expiresAt).getTime() - now.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

/**
 * Format an expiry date for display. Returns a human-readable string.
 */
export function formatExpiry(expiresAt: string): string {
  const days = daysUntilExpiry(expiresAt)
  if (days < 0) {
    return `Expired ${Math.abs(days)} day(s) ago`
  }
  if (days === 0) {
    return 'Expires today'
  }
  if (days === 1) {
    return 'Expires tomorrow'
  }
  return `${days} day(s) remaining`
}
