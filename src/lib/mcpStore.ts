type Account = {
  id: string
  orgName: string
  contact: string
  createdAt: string
  paymentProfiles: string[]
}

type StorageService = {
  id: string
  accountId: string
  project: string
  region: string
  usageCapGb: number | null
  paymentProfile: string
  status: 'provisioning' | 'active' | 'paused'
  endpoint: string
  accessKeyId: string
  secretAccessKey: string
  createdAt: string
  updatedAt: string
}

const accounts = new Map<string, Account>()
const storageServices = new Map<string, StorageService>()

function nowIso() {
  return new Date().toISOString()
}

function randomId(prefix: string) {
  return `${prefix}_${crypto.randomUUID()}`
}

function randomKey(prefix: string) {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, '')}`
}

export function createAccount(input: { orgName: string; contact: string }) {
  const account: Account = {
    id: randomId('acct'),
    orgName: input.orgName,
    contact: input.contact,
    createdAt: nowIso(),
    paymentProfiles: [],
  }

  accounts.set(account.id, account)
  return account
}

export function attachPaymentProfile(input: {
  accountId: string
  profile: string
  wallet: string
}) {
  const account = accounts.get(input.accountId)
  if (!account) {
    return null
  }

  if (!account.paymentProfiles.includes(input.profile)) {
    account.paymentProfiles = [...account.paymentProfiles, input.profile]
  }

  accounts.set(account.id, account)
  return {
    accountId: account.id,
    profile: input.profile,
    wallet: input.wallet,
  }
}

export function createStorageService(input: {
  accountId: string
  project: string
  region: string
  usageCapGb?: number
  paymentProfile: string
}) {
  const account = accounts.get(input.accountId)
  if (!account) {
    return { error: 'Account not found' as const }
  }

  if (!account.paymentProfiles.includes(input.paymentProfile)) {
    return { error: 'Payment profile not attached' as const }
  }

  const timestamp = nowIso()
  const service: StorageService = {
    id: randomId('storage'),
    accountId: input.accountId,
    project: input.project,
    region: input.region,
    usageCapGb: input.usageCapGb ?? null,
    paymentProfile: input.paymentProfile,
    status: 'active',
    endpoint: 'https://storage.equiforge.com',
    accessKeyId: randomKey('access'),
    secretAccessKey: randomKey('secret'),
    createdAt: timestamp,
    updatedAt: timestamp,
  }

  storageServices.set(service.id, service)
  return { service }
}

export function getStorageService(serviceId: string) {
  return storageServices.get(serviceId) ?? null
}

export function rotateStorageKeys(serviceId: string, reason?: string) {
  const service = storageServices.get(serviceId)
  if (!service) {
    return null
  }

  const updatedAt = nowIso()
  const updated: StorageService = {
    ...service,
    accessKeyId: randomKey('access'),
    secretAccessKey: randomKey('secret'),
    updatedAt,
  }

  storageServices.set(serviceId, updated)
  return { service: updated, reason: reason ?? null }
}
