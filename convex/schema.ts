import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

export default defineSchema({
  accounts: defineTable({
    orgName: v.string(),
    contact: v.string(),
    createdAt: v.string(),
    paymentProfiles: v.array(v.string()),
  }).index('by_contact', ['contact']),

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
})
