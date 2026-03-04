/**
 * crons.ts — Convex cron jobs for storage service expiry lifecycle.
 *
 * Runs ONCE DAILY at 00:01 UTC (saves compute vs hourly).
 *
 * Lifecycle passes (atomic per-service):
 *   1. Active → Grace: services where expiresAt has passed
 *   2. Grace → Deleting: services where graceExpiresAt has passed
 *   3. Deleting → Deleted: batch-delete objects (max 100/run, continues next day)
 */

import { cronJobs } from 'convex/server'
import { internal } from './_generated/api'
import { internalAction } from './_generated/server'

// ---------------------------------------------------------------------------
// Cron action — runs the three lifecycle passes
// ---------------------------------------------------------------------------

/**
 * Daily expiry lifecycle action.
 * Uses internalAction so it can call multiple mutations sequentially.
 * Each service transition is its own mutation call (atomic per-service).
 */
export const dailyExpiryLifecycle = internalAction({
  args: {},
  handler: async (ctx) => {
    const now = new Date().toISOString()

    // Pass 1: Find active services that have expired → transition to grace
    const activeServices = await ctx.runQuery(
      internal.crons.getExpiredActiveServices,
      { now },
    )
    for (const serviceId of activeServices) {
      await ctx.runMutation(internal.billing.transitionToGrace, { serviceId })
    }

    // Pass 2: Find grace services that have grace-expired → transition to deleting
    const graceServices = await ctx.runQuery(
      internal.crons.getExpiredGraceServices,
      { now },
    )
    for (const serviceId of graceServices) {
      await ctx.runMutation(internal.billing.transitionToDeleting, { serviceId })
    }

    // Pass 3: Delete objects in batches for services in "deleting" status
    const deletingServices = await ctx.runQuery(
      internal.crons.getDeletingServices,
      {},
    )
    for (const serviceId of deletingServices) {
      // Each call deletes up to 100 objects; continues next day if more remain
      await ctx.runMutation(internal.billing.deleteBatchForService, {
        serviceId,
        maxBatch: 100,
      })
    }
  },
})

// ---------------------------------------------------------------------------
// Helper queries (internal only, used by the cron action)
// ---------------------------------------------------------------------------

import { internalQuery } from './_generated/server'
import { v } from 'convex/values'

/**
 * Find active services where expiresAt has passed.
 */
export const getExpiredActiveServices = internalQuery({
  args: { now: v.string() },
  handler: async (ctx, args) => {
    const services = await ctx.db
      .query('storageServices')
      .withIndex('by_status', (q) => q.eq('status', 'active'))
      .collect()

    return services
      .filter((s) => s.expiresAt && s.expiresAt < args.now)
      .map((s) => s._id)
  },
})

/**
 * Find grace services where graceExpiresAt has passed.
 */
export const getExpiredGraceServices = internalQuery({
  args: { now: v.string() },
  handler: async (ctx, args) => {
    const services = await ctx.db
      .query('storageServices')
      .withIndex('by_status', (q) => q.eq('status', 'grace'))
      .collect()

    return services
      .filter((s) => s.graceExpiresAt && s.graceExpiresAt < args.now)
      .map((s) => s._id)
  },
})

/**
 * Find services in "deleting" status (need object cleanup).
 */
export const getDeletingServices = internalQuery({
  args: {},
  handler: async (ctx) => {
    const services = await ctx.db
      .query('storageServices')
      .withIndex('by_status', (q) => q.eq('status', 'deleting'))
      .collect()

    return services.map((s) => s._id)
  },
})

// ---------------------------------------------------------------------------
// Cron schedule
// ---------------------------------------------------------------------------

const crons = cronJobs()

crons.daily(
  'storage-expiry-lifecycle',
  { hourUTC: 0, minuteUTC: 1 }, // 00:01 UTC daily
  internal.crons.dailyExpiryLifecycle,
)

export default crons
