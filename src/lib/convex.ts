import { ConvexHttpClient } from 'convex/browser'
import { api, internal } from '../../convex/_generated/api'

let _client: ConvexHttpClient | null = null

export function getConvexClient(): ConvexHttpClient {
  if (!_client) {
    const url = process.env.VITE_CONVEX_URL
    if (!url) throw new Error('Missing VITE_CONVEX_URL')
    _client = new ConvexHttpClient(url)
  }
  return _client
}

export { api, internal }
