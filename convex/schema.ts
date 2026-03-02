import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'
import { authTables } from '@convex-dev/auth/server'

export default defineSchema({
  ...authTables,

  // Extend the default users table with our fields
  users: defineTable({
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    email: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
  }).index('email', ['email']),

  // API keys for agent/MCP authentication
  apiKeys: defineTable({
    userId: v.id('users'),
    name: v.string(),
    prefix: v.string(), // first 8 chars, for display (e.g. "eqf_abc1...")
    keyHash: v.string(), // SHA-256 hash of the full key
    scopes: v.array(v.string()), // e.g. ["mcp", "storage", "storage:read"]
    lastUsedAt: v.optional(v.string()),
    expiresAt: v.optional(v.string()),
    revokedAt: v.optional(v.string()),
    createdAt: v.string(),
  })
    .index('by_user', ['userId'])
    .index('by_key_hash', ['keyHash']),

  // --- Existing tables (now linked to users) ---

  accounts: defineTable({
    userId: v.id('users'),
    orgName: v.string(),
    contact: v.string(),
    createdAt: v.string(),
    paymentProfiles: v.array(v.string()),
  })
    .index('by_contact', ['contact'])
    .index('by_user', ['userId']),

  paymentProfiles: defineTable({
    accountId: v.id('accounts'),
    profile: v.string(),
    wallet: v.string(),
    createdAt: v.string(),
  }).index('by_account', ['accountId']),

  storageServices: defineTable({
    accountId: v.id('accounts'),
    project: v.string(),
    region: v.string(),
    usageCapGb: v.union(v.number(), v.null()),
    paymentProfile: v.string(),
    status: v.string(),
    endpoint: v.string(),
    accessKeyId: v.string(),
    secretAccessKey: v.string(),
    createdAt: v.string(),
    updatedAt: v.string(),
  }).index('by_account', ['accountId']),

  // --- S3-compatible storage ---

  // Buckets belong to an account
  storageBuckets: defineTable({
    accountId: v.id('accounts'),
    name: v.string(), // bucket name, globally unique
    region: v.string(),
    createdAt: v.string(),
    isPublic: v.boolean(),
  })
    .index('by_account', ['accountId'])
    .index('by_name', ['name']),

  // Objects stored in buckets, backed by Convex file storage
  storageObjects: defineTable({
    bucketId: v.id('storageBuckets'),
    key: v.string(), // object key (path)
    storageId: v.id('_storage'), // Convex file storage reference
    size: v.number(), // bytes
    contentType: v.string(),
    etag: v.string(), // MD5 hash of content
    metadata: v.optional(v.any()), // user-defined metadata
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index('by_bucket', ['bucketId'])
    .index('by_bucket_key', ['bucketId', 'key']),
})
