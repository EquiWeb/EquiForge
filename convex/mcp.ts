import { mutation, query } from './_generated/server'
import { v } from 'convex/values'

function nowIso() {
  return new Date().toISOString()
}

function randomKey(prefix: string) {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, '')}`
}

export const createAccount = mutation({
  args: {
    orgName: v.string(),
    contact: v.string(),
  },
  handler: async (ctx, args) => {
    const accountId = await ctx.db.insert('accounts', {
      orgName: args.orgName,
      contact: args.contact,
      createdAt: nowIso(),
      paymentProfiles: [],
    })

    return accountId
  },
})

export const attachPaymentProfile = mutation({
  args: {
    accountId: v.id('accounts'),
    profile: v.string(),
    wallet: v.string(),
  },
  handler: async (ctx, args) => {
    const account = await ctx.db.get(args.accountId)
    if (!account) {
      return { error: 'Account not found' as const }
    }

    await ctx.db.insert('paymentProfiles', {
      accountId: args.accountId,
      profile: args.profile,
      wallet: args.wallet,
      createdAt: nowIso(),
    })

    const nextProfiles = account.paymentProfiles.includes(args.profile)
      ? account.paymentProfiles
      : [...account.paymentProfiles, args.profile]

    await ctx.db.patch(args.accountId, {
      paymentProfiles: nextProfiles,
    })

    return { profile: args.profile, wallet: args.wallet }
  },
})

export const createStorageService = mutation({
  args: {
    accountId: v.id('accounts'),
    project: v.string(),
    region: v.string(),
    usageCapGb: v.optional(v.number()),
    paymentProfile: v.string(),
  },
  handler: async (ctx, args) => {
    const account = await ctx.db.get(args.accountId)
    if (!account) {
      return { error: 'Account not found' as const }
    }

    if (!account.paymentProfiles.includes(args.paymentProfile)) {
      return { error: 'Payment profile not attached' as const }
    }

    const timestamp = nowIso()
    const serviceId = await ctx.db.insert('storageServices', {
      accountId: args.accountId,
      project: args.project,
      region: args.region,
      usageCapGb: args.usageCapGb ?? null,
      paymentProfile: args.paymentProfile,
      status: 'active',
      endpoint: 'https://storage.equiforge.com',
      accessKeyId: randomKey('access'),
      secretAccessKey: randomKey('secret'),
      createdAt: timestamp,
      updatedAt: timestamp,
    })

    return serviceId
  },
})

export const getStorageService = query({
  args: {
    serviceId: v.id('storageServices'),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.serviceId)
  },
})

export const rotateStorageKeys = mutation({
  args: {
    serviceId: v.id('storageServices'),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const service = await ctx.db.get(args.serviceId)
    if (!service) {
      return { error: 'Service not found' as const }
    }

    const updatedAt = nowIso()
    await ctx.db.patch(args.serviceId, {
      accessKeyId: randomKey('access'),
      secretAccessKey: randomKey('secret'),
      updatedAt,
    })

    return { updatedAt, reason: args.reason ?? null }
  },
})
