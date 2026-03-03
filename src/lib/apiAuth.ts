import { getAdminConvexClient, internal } from './convex'
import type { FunctionReference } from 'convex/server'

/**
 * Hash a raw API key to match against the stored hash.
 */
async function hashKey(rawKey: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(rawKey)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

export type ApiKeyAuth = {
  userId: string
  keyId: string
  scopes: string[]
}

/**
 * Helper: admin client can call internal functions but the TS types
 * restrict .query()/.mutation() to "public" visibility. We cast through
 * `any` because the admin auth header makes internal calls valid at runtime.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function asPublic<T extends FunctionReference<any, any>>(ref: T) {
  return ref as unknown as FunctionReference<T['_type'], 'public'>
}

/**
 * Validate an API key from a request.
 * Expects Authorization: Bearer eqf_...
 * Returns the user/scopes or null if invalid.
 *
 * Uses the admin client to call internal functions.
 */
export async function authenticateApiKey(
  request: Request,
): Promise<ApiKeyAuth | null> {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) return null

  const rawKey = authHeader.slice(7).trim()
  if (!rawKey.startsWith('eqf_')) return null

  const keyHash = await hashKey(rawKey)
  const client = getAdminConvexClient()

  const result = await client.query(asPublic(internal.apiKeys.validateApiKey), {
    keyHash,
  })

  if (!result) return null

  // Touch lastUsedAt (fire-and-forget)
  client
    .mutation(asPublic(internal.apiKeys.touchApiKey), { keyId: result.keyId })
    .catch(() => {})

  return {
    userId: result.userId,
    keyId: result.keyId,
    scopes: result.scopes,
  }
}

/**
 * Require API key auth. Returns 401 Response if invalid.
 */
export async function requireApiKey(
  request: Request,
  requiredScope?: string,
): Promise<ApiKeyAuth | Response> {
  const auth = await authenticateApiKey(request)

  if (!auth) {
    return Response.json(
      { error: 'Invalid or missing API key. Use Authorization: Bearer eqf_...' },
      { status: 401 },
    )
  }

  if (requiredScope && !auth.scopes.includes(requiredScope) && !auth.scopes.includes('*')) {
    return Response.json(
      { error: `Missing required scope: ${requiredScope}` },
      { status: 403 },
    )
  }

  return auth
}
