import { mutation, query } from './_generated/server'
import { v } from 'convex/values'
import { getAuthUserId } from '@convex-dev/auth/server'

function nowIso() {
  return new Date().toISOString()
}

// --- Bucket operations ---

export const createBucket = mutation({
  args: {
    accountId: v.id('accounts'),
    name: v.string(),
    region: v.string(),
    isPublic: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) throw new Error('Not authenticated')

    const account = await ctx.db.get(args.accountId)
    if (!account || account.userId !== userId) {
      throw new Error('Not authorized')
    }

    // Check bucket name uniqueness
    const existing = await ctx.db
      .query('storageBuckets')
      .withIndex('by_name', (q) => q.eq('name', args.name))
      .first()
    if (existing) {
      throw new Error('Bucket name already exists')
    }

    const bucketId = await ctx.db.insert('storageBuckets', {
      accountId: args.accountId,
      name: args.name,
      region: args.region,
      isPublic: args.isPublic ?? false,
      createdAt: nowIso(),
    })

    return bucketId
  },
})

export const listBuckets = query({
  args: {
    accountId: v.id('accounts'),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) return []

    const account = await ctx.db.get(args.accountId)
    if (!account || account.userId !== userId) return []

    return await ctx.db
      .query('storageBuckets')
      .withIndex('by_account', (q) => q.eq('accountId', args.accountId))
      .collect()
  },
})

export const deleteBucket = mutation({
  args: {
    bucketId: v.id('storageBuckets'),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) throw new Error('Not authenticated')

    const bucket = await ctx.db.get(args.bucketId)
    if (!bucket) throw new Error('Bucket not found')

    const account = await ctx.db.get(bucket.accountId)
    if (!account || account.userId !== userId) throw new Error('Not authorized')

    // Check bucket is empty
    const firstObject = await ctx.db
      .query('storageObjects')
      .withIndex('by_bucket', (q) => q.eq('bucketId', args.bucketId))
      .first()
    if (firstObject) {
      throw new Error('Bucket is not empty')
    }

    await ctx.db.delete(args.bucketId)
    return { deleted: true }
  },
})

export const getBucketByName = query({
  args: {
    name: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('storageBuckets')
      .withIndex('by_name', (q) => q.eq('name', args.name))
      .first()
  },
})

// --- Object operations ---

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl()
  },
})

export const putObject = mutation({
  args: {
    bucketId: v.id('storageBuckets'),
    key: v.string(),
    storageId: v.id('_storage'),
    size: v.number(),
    contentType: v.string(),
    etag: v.string(),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) throw new Error('Not authenticated')

    const bucket = await ctx.db.get(args.bucketId)
    if (!bucket) throw new Error('Bucket not found')

    const account = await ctx.db.get(bucket.accountId)
    if (!account || account.userId !== userId) throw new Error('Not authorized')

    const timestamp = nowIso()

    // Upsert: check if object with this key already exists
    const existing = await ctx.db
      .query('storageObjects')
      .withIndex('by_bucket_key', (q) =>
        q.eq('bucketId', args.bucketId).eq('key', args.key),
      )
      .first()

    if (existing) {
      // Delete old file from storage
      await ctx.storage.delete(existing.storageId)
      await ctx.db.patch(existing._id, {
        storageId: args.storageId,
        size: args.size,
        contentType: args.contentType,
        etag: args.etag,
        metadata: args.metadata,
        updatedAt: timestamp,
      })
      return existing._id
    }

    return await ctx.db.insert('storageObjects', {
      bucketId: args.bucketId,
      key: args.key,
      storageId: args.storageId,
      size: args.size,
      contentType: args.contentType,
      etag: args.etag,
      metadata: args.metadata,
      createdAt: timestamp,
      updatedAt: timestamp,
    })
  },
})

export const getObject = query({
  args: {
    bucketId: v.id('storageBuckets'),
    key: v.string(),
  },
  handler: async (ctx, args) => {
    const obj = await ctx.db
      .query('storageObjects')
      .withIndex('by_bucket_key', (q) =>
        q.eq('bucketId', args.bucketId).eq('key', args.key),
      )
      .first()

    if (!obj) return null

    const url = await ctx.storage.getUrl(obj.storageId)
    return { ...obj, url }
  },
})

export const deleteObject = mutation({
  args: {
    bucketId: v.id('storageBuckets'),
    key: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) throw new Error('Not authenticated')

    const bucket = await ctx.db.get(args.bucketId)
    if (!bucket) throw new Error('Bucket not found')

    const account = await ctx.db.get(bucket.accountId)
    if (!account || account.userId !== userId) throw new Error('Not authorized')

    const obj = await ctx.db
      .query('storageObjects')
      .withIndex('by_bucket_key', (q) =>
        q.eq('bucketId', args.bucketId).eq('key', args.key),
      )
      .first()

    if (!obj) throw new Error('Object not found')

    await ctx.storage.delete(obj.storageId)
    await ctx.db.delete(obj._id)

    return { deleted: true }
  },
})

export const listObjects = query({
  args: {
    bucketId: v.id('storageBuckets'),
    prefix: v.optional(v.string()),
    maxKeys: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const objects = await ctx.db
      .query('storageObjects')
      .withIndex('by_bucket', (q) => q.eq('bucketId', args.bucketId))
      .collect()

    let filtered = objects
    if (args.prefix) {
      filtered = objects.filter((o) => o.key.startsWith(args.prefix!))
    }

    const limit = args.maxKeys ?? 1000
    const truncated = filtered.length > limit
    const result = filtered.slice(0, limit)

    return {
      objects: result.map((o) => ({
        key: o.key,
        size: o.size,
        etag: o.etag,
        contentType: o.contentType,
        lastModified: o.updatedAt,
      })),
      isTruncated: truncated,
      keyCount: result.length,
    }
  },
})

export const getObjectDownloadUrl = query({
  args: {
    bucketId: v.id('storageBuckets'),
    key: v.string(),
  },
  handler: async (ctx, args) => {
    const obj = await ctx.db
      .query('storageObjects')
      .withIndex('by_bucket_key', (q) =>
        q.eq('bucketId', args.bucketId).eq('key', args.key),
      )
      .first()

    if (!obj) return null

    return await ctx.storage.getUrl(obj.storageId)
  },
})

// ============================================================
// API-key-authenticated functions (userId passed explicitly)
// Called from server-side S3/MCP handlers after API key validation.
// ============================================================

export const apiCreateBucket = mutation({
  args: {
    userId: v.id('users'),
    accountId: v.id('accounts'),
    name: v.string(),
    region: v.string(),
    isPublic: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const account = await ctx.db.get(args.accountId)
    if (!account || account.userId !== args.userId) {
      throw new Error('Not authorized')
    }

    const existing = await ctx.db
      .query('storageBuckets')
      .withIndex('by_name', (q) => q.eq('name', args.name))
      .first()
    if (existing) throw new Error('Bucket name already exists')

    return await ctx.db.insert('storageBuckets', {
      accountId: args.accountId,
      name: args.name,
      region: args.region,
      isPublic: args.isPublic ?? false,
      createdAt: nowIso(),
    })
  },
})

export const apiListBuckets = query({
  args: {
    userId: v.id('users'),
    accountId: v.id('accounts'),
  },
  handler: async (ctx, args) => {
    const account = await ctx.db.get(args.accountId)
    if (!account || account.userId !== args.userId) return []

    return await ctx.db
      .query('storageBuckets')
      .withIndex('by_account', (q) => q.eq('accountId', args.accountId))
      .collect()
  },
})

export const apiDeleteBucket = mutation({
  args: {
    userId: v.id('users'),
    bucketId: v.id('storageBuckets'),
  },
  handler: async (ctx, args) => {
    const bucket = await ctx.db.get(args.bucketId)
    if (!bucket) throw new Error('Bucket not found')

    const account = await ctx.db.get(bucket.accountId)
    if (!account || account.userId !== args.userId) throw new Error('Not authorized')

    const firstObject = await ctx.db
      .query('storageObjects')
      .withIndex('by_bucket', (q) => q.eq('bucketId', args.bucketId))
      .first()
    if (firstObject) throw new Error('Bucket is not empty')

    await ctx.db.delete(args.bucketId)
    return { deleted: true }
  },
})

export const apiPutObject = mutation({
  args: {
    userId: v.id('users'),
    bucketId: v.id('storageBuckets'),
    key: v.string(),
    storageId: v.id('_storage'),
    size: v.number(),
    contentType: v.string(),
    etag: v.string(),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const bucket = await ctx.db.get(args.bucketId)
    if (!bucket) throw new Error('Bucket not found')

    const account = await ctx.db.get(bucket.accountId)
    if (!account || account.userId !== args.userId) throw new Error('Not authorized')

    const timestamp = nowIso()
    const existing = await ctx.db
      .query('storageObjects')
      .withIndex('by_bucket_key', (q) =>
        q.eq('bucketId', args.bucketId).eq('key', args.key),
      )
      .first()

    if (existing) {
      await ctx.storage.delete(existing.storageId)
      await ctx.db.patch(existing._id, {
        storageId: args.storageId,
        size: args.size,
        contentType: args.contentType,
        etag: args.etag,
        metadata: args.metadata,
        updatedAt: timestamp,
      })
      return existing._id
    }

    return await ctx.db.insert('storageObjects', {
      bucketId: args.bucketId,
      key: args.key,
      storageId: args.storageId,
      size: args.size,
      contentType: args.contentType,
      etag: args.etag,
      metadata: args.metadata,
      createdAt: timestamp,
      updatedAt: timestamp,
    })
  },
})

export const apiDeleteObject = mutation({
  args: {
    userId: v.id('users'),
    bucketId: v.id('storageBuckets'),
    key: v.string(),
  },
  handler: async (ctx, args) => {
    const bucket = await ctx.db.get(args.bucketId)
    if (!bucket) throw new Error('Bucket not found')

    const account = await ctx.db.get(bucket.accountId)
    if (!account || account.userId !== args.userId) throw new Error('Not authorized')

    const obj = await ctx.db
      .query('storageObjects')
      .withIndex('by_bucket_key', (q) =>
        q.eq('bucketId', args.bucketId).eq('key', args.key),
      )
      .first()
    if (!obj) throw new Error('Object not found')

    await ctx.storage.delete(obj.storageId)
    await ctx.db.delete(obj._id)
    return { deleted: true }
  },
})
