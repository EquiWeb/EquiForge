import { ConvexHttpClient } from 'convex/browser'
import { api, internal } from '../../convex/_generated/api'

let _client: ConvexHttpClient | null = null
let _adminClient: ConvexHttpClient | null = null

/**
 * Standard Convex client — no special auth.
 * Used for public queries/mutations (web-authenticated functions).
 */
export function getConvexClient(): ConvexHttpClient {
  if (!_client) {
    const url = process.env.VITE_CONVEX_URL
    if (!url) throw new Error('Missing VITE_CONVEX_URL')
    _client = new ConvexHttpClient(url)
  }
  return _client
}

/**
 * Admin Convex client — uses CONVEX_DEPLOY_KEY for admin auth.
 * This client can call internalQuery/internalMutation functions.
 * Used by server-side API routes (MCP, S3) after API key validation.
 *
 * Note: setAdminAuth exists at runtime but is not in the TS declarations
 * for ConvexHttpClient. We cast through `any` to access it.
 */
export function getAdminConvexClient(): ConvexHttpClient {
  if (!_adminClient) {
    const url = process.env.VITE_CONVEX_URL
    if (!url) throw new Error('Missing VITE_CONVEX_URL')
    const deployKey = process.env.CONVEX_DEPLOY_KEY
    if (!deployKey) throw new Error('Missing CONVEX_DEPLOY_KEY — required for admin client')
    _adminClient = new ConvexHttpClient(url)
    // setAdminAuth is a runtime method on ConvexHttpClient but not exposed in types
    ;(_adminClient as unknown as { setAdminAuth(token: string): void }).setAdminAuth(deployKey)
  }
  return _adminClient
}

export { api, internal }
