import { getConvexClient, api } from './convex'

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
 * Validate an API key from a request.
 * Expects Authorization: Bearer eqf_...
 * Returns the user/scopes or null if invalid.
 */
export async function authenticateApiKey(
  request: Request,
): Promise<ApiKeyAuth | null> {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) return null

  const rawKey = authHeader.slice(7).trim()
  if (!rawKey.startsWith('eqf_')) return null

  const keyHash = await hashKey(rawKey)
  const client = getConvexClient()

  // Use the internal query to validate
  const result = await client.query(api.apiKeys.validateApiKey, {
    keyHash,
  })

  if (!result) return null

  // Touch lastUsedAt (fire-and-forget)
  client
    .mutation(api.apiKeys.touchApiKey, { keyId: result.keyId })
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
