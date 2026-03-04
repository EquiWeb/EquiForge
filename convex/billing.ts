/**
 * billing.ts — Convex billing functions for x402 payment tracking.
 *
 * All mutations here are internalMutation — never callable from the browser.
 * They are called from server-side API routes after x402 settlement is confirmed.
 */

import { internalMutation, internalQuery } from './_generated/server'
import { v } from 'convex/values'

function nowIso() {
  return new Date().toISOString()
}

// ---------------------------------------------------------------------------
// Billing event recording
// ---------------------------------------------------------------------------

/**
 * Record a billing event after successful x402 settlement.
 * Called from server-side S3/MCP handlers.
 *
 * SECURITY: This is an internalMutation — cannot be called from browsers.
 * The txHash index enforces idempotency (duplicate tx hashes will fail).
 */
export const recordBillingEvent = internalMutation({
  args: {
    accountId: v.id('accounts'),
    serviceId: v.optional(v.id('storageServices')),
    bucketId: v.optional(v.id('storageBuckets')),
    objectKey: v.optional(v.string()),
    operation: v.string(),
    amountUsd: v.number(),
    sizeBytes: v.optional(v.number()),
    wasGracePeriod: v.boolean(),
    txHash: v.string(),
    facilitatorResponse: v.optional(v.string()),
    network: v.string(),
    payerAddress: v.string(),
    receiverAddress: v.string(),
    settledAt: v.string(),
  },
  handler: async (ctx, args) => {
    // Idempotency check: reject duplicate tx hashes
    const existing = await ctx.db
      .query('billingEvents')
      .withIndex('by_tx_hash', (q) => q.eq('txHash', args.txHash))
      .first()

    if (existing) {
      // Already recorded — return existing ID without error
      return existing._id
    }

    return await ctx.db.insert('billingEvents', {
      ...args,
      createdAt: nowIso(),
    })
  },
})

// ---------------------------------------------------------------------------
// Billing event queries
// ---------------------------------------------------------------------------

/**
 * List billing events for an account, most recent first.
 */
export const listBillingEvents = internalQuery({
  args: {
    accountId: v.id('accounts'),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const events = await ctx.db
      .query('billingEvents')
      .withIndex('by_account', (q) => q.eq('accountId', args.accountId))
      .order('desc')
      .take(args.limit ?? 50)

    return events
  },
})

/**
 * List billing events for a specific storage service.
 */
export const listBillingEventsForService = internalQuery({
  args: {
    serviceId: v.id('storageServices'),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const events = await ctx.db
      .query('billingEvents')
      .withIndex('by_service', (q) => q.eq('serviceId', args.serviceId))
      .order('desc')
      .take(args.limit ?? 50)

    return events
  },
})

/**
 * Check if a transaction hash has already been used (idempotency check).
 * Used by payment middleware to reject replay attacks.
 */
export const checkTxHashExists = internalQuery({
  args: {
    txHash: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('billingEvents')
      .withIndex('by_tx_hash', (q) => q.eq('txHash', args.txHash))
      .first()

    return existing !== null
  },
})

// ---------------------------------------------------------------------------
// Storage service status + expiry helpers
// ---------------------------------------------------------------------------

/**
 * Get the storage service for a user's account.
 * Returns the first active/grace service, or null.
 * Used by S3 endpoints to determine billing status.
 */
export const getServiceForAccount = internalQuery({
  args: {
    accountId: v.id('accounts'),
  },
  handler: async (ctx, args) => {
    // Get first service for account (most accounts have one)
    const services = await ctx.db
      .query('storageServices')
      .withIndex('by_account', (q) => q.eq('accountId', args.accountId))
      .collect()

    // Return the first non-deleted service
    return services.find((s) => s.status !== 'deleted') ?? null
  },
})

/**
 * Update storage service expiry after an extension payment.
 * Called from server-side MCP handlers after x402 settlement.
 */
export const updateServiceExpiry = internalMutation({
  args: {
    serviceId: v.id('storageServices'),
    expiresAt: v.string(),
    graceExpiresAt: v.string(),
    // If extending from grace, also reset status to active
    resetToActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const patch: Record<string, unknown> = {
      expiresAt: args.expiresAt,
      graceExpiresAt: args.graceExpiresAt,
      updatedAt: nowIso(),
    }

    if (args.resetToActive) {
      patch.status = 'active'
    }

    await ctx.db.patch(args.serviceId, patch)
    return { updated: true }
  },
})

// ---------------------------------------------------------------------------
// Cron-related mutations (Phase 5 — defined here for schema completeness)
// ---------------------------------------------------------------------------

/**
 * Transition a service from active to grace.
 * Called by the daily cron when expiresAt has passed.
 */
export const transitionToGrace = internalMutation({
  args: {
    serviceId: v.id('storageServices'),
  },
  handler: async (ctx, args) => {
    const service = await ctx.db.get(args.serviceId)
    if (!service || service.status !== 'active') return

    await ctx.db.patch(args.serviceId, {
      status: 'grace',
      updatedAt: nowIso(),
    })
  },
})

/**
 * Transition a service from grace to deleting.
 * Called by the daily cron when graceExpiresAt has passed.
 */
export const transitionToDeleting = internalMutation({
  args: {
    serviceId: v.id('storageServices'),
  },
  handler: async (ctx, args) => {
    const service = await ctx.db.get(args.serviceId)
    if (!service || service.status !== 'grace') return

    await ctx.db.patch(args.serviceId, {
      status: 'deleting',
      updatedAt: nowIso(),
    })
  },
})

/**
 * Delete a batch of objects for a service in "deleting" status.
 * Processes up to maxBatch objects per call. Returns whether more remain.
 * Called by the daily cron — paginated to avoid Convex function timeouts.
 */
export const deleteBatchForService = internalMutation({
  args: {
    serviceId: v.id('storageServices'),
    maxBatch: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const service = await ctx.db.get(args.serviceId)
    if (!service || service.status !== 'deleting') {
      return { deleted: 0, remaining: false }
    }

    // Find buckets for this account
    const buckets = await ctx.db
      .query('storageBuckets')
      .withIndex('by_account', (q) => q.eq('accountId', service.accountId))
      .collect()

    const limit = args.maxBatch ?? 100
    let deleted = 0

    for (const bucket of buckets) {
      if (deleted >= limit) break

      const objects = await ctx.db
        .query('storageObjects')
        .withIndex('by_bucket', (q) => q.eq('bucketId', bucket._id))
        .take(limit - deleted)

      for (const obj of objects) {
        await ctx.storage.delete(obj.storageId)
        await ctx.db.delete(obj._id)
        deleted++
      }

      // If bucket is now empty, delete the bucket too
      if (objects.length < limit - deleted + deleted) {
        const remaining = await ctx.db
          .query('storageObjects')
          .withIndex('by_bucket', (q) => q.eq('bucketId', bucket._id))
          .first()
        if (!remaining) {
          await ctx.db.delete(bucket._id)
        }
      }
    }

    // Check if any objects remain
    let anyRemaining = false
    for (const bucket of buckets) {
      const obj = await ctx.db
        .query('storageObjects')
        .withIndex('by_bucket', (q) => q.eq('bucketId', bucket._id))
        .first()
      if (obj) {
        anyRemaining = true
        break
      }
    }

    // If nothing remains, mark as fully deleted
    if (!anyRemaining) {
      await ctx.db.patch(args.serviceId, {
        status: 'deleted',
        updatedAt: nowIso(),
      })
    }

    return { deleted, remaining: anyRemaining }
  },
})
