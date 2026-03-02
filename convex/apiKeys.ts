import { mutation, query } from './_generated/server'
import { v } from 'convex/values'
import { getAuthUserId } from '@convex-dev/auth/server'

function nowIso() {
  return new Date().toISOString()
}

/**
 * Generate a new API key. Returns the full key (only shown once).
 * We store only the SHA-256 hash in the database.
 */
export const createApiKey = mutation({
  args: {
    name: v.string(),
    scopes: v.array(v.string()),
    expiresAt: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) throw new Error('Not authenticated')

    // Generate the key: eqf_{32 random hex chars}
    const rawKey = `eqf_${crypto.randomUUID().replace(/-/g, '')}${crypto.randomUUID().replace(/-/g, '').slice(0, 8)}`
    const prefix = rawKey.slice(0, 12) // "eqf_XXXXXXXX" for display

    // Hash the key for storage
    const encoder = new TextEncoder()
    const data = encoder.encode(rawKey)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const keyHash = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')

    await ctx.db.insert('apiKeys', {
      userId,
      name: args.name,
      prefix,
      keyHash,
      scopes: args.scopes,
      expiresAt: args.expiresAt,
      createdAt: nowIso(),
    })

    // Return the full key — this is the only time it's available
    return { key: rawKey, prefix }
  },
})

/**
 * List all API keys for the current user (never returns hashes or full keys).
 */
export const listApiKeys = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) return []

    const keys = await ctx.db
      .query('apiKeys')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .collect()

    return keys.map((k) => ({
      _id: k._id,
      name: k.name,
      prefix: k.prefix,
      scopes: k.scopes,
      lastUsedAt: k.lastUsedAt,
      expiresAt: k.expiresAt,
      revokedAt: k.revokedAt,
      createdAt: k.createdAt,
    }))
  },
})

/**
 * Revoke an API key.
 */
export const revokeApiKey = mutation({
  args: {
    keyId: v.id('apiKeys'),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) throw new Error('Not authenticated')

    const key = await ctx.db.get(args.keyId)
    if (!key) throw new Error('Key not found')
    if (key.userId !== userId) throw new Error('Not authorized')

    await ctx.db.patch(args.keyId, {
      revokedAt: nowIso(),
    })

    return { revoked: true }
  },
})

/**
 * Validate an API key by its hash.
 * Returns the userId and scopes if valid, null if not.
 * Used by server-side auth middleware.
 */
export const validateApiKey = query({
  args: {
    keyHash: v.string(),
  },
  handler: async (ctx, args) => {
    const key = await ctx.db
      .query('apiKeys')
      .withIndex('by_key_hash', (q) => q.eq('keyHash', args.keyHash))
      .first()

    if (!key) return null
    if (key.revokedAt) return null
    if (key.expiresAt && new Date(key.expiresAt) < new Date()) return null

    return {
      userId: key.userId,
      keyId: key._id,
      scopes: key.scopes,
    }
  },
})

/**
 * Internal: update lastUsedAt for an API key.
 */
export const touchApiKey = mutation({
  args: {
    keyId: v.id('apiKeys'),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.keyId, {
      lastUsedAt: nowIso(),
    })
  },
})
