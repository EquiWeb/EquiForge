/**
 * x402.ts — x402 payment integration layer for EquiForge.
 *
 * Uses the public x402 facilitator (https://x402.org/facilitator) to verify
 * and settle on-chain payments on Base Sepolia (testnet) / Base (mainnet).
 *
 * ARCHITECTURE:
 * - x402ResourceServer handles verify/settle lifecycle
 * - HTTPFacilitatorClient talks to the public facilitator
 * - We provide a high-level `processPayment()` function that S3/MCP endpoints call
 *
 * SECURITY:
 * - Price is ALWAYS computed server-side (never from client)
 * - Settlement must be confirmed before any state change
 * - Transaction hashes are stored for idempotency (reject duplicate signatures)
 */

import {
  x402ResourceServer,
  HTTPFacilitatorClient,
} from '@x402/core/server'
import type {
  PaymentRequirements,
  PaymentPayload,
  SettleResponse,
  VerifyResponse,
  PaymentRequired,
} from '@x402/core/types'
import {
  decodePaymentSignatureHeader,
  encodePaymentRequiredHeader,
  encodePaymentResponseHeader,
} from '@x402/core/http'
import { registerExactEvmScheme } from '@x402/evm/exact/server'
import { validatePaymentPayload } from '@x402/core/schemas'

import type { PriceResult } from './pricing'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Base Sepolia chain in CAIP-2 format */
export const BASE_SEPOLIA_NETWORK = 'eip155:84532' as const

/** Base mainnet chain in CAIP-2 format */
export const BASE_MAINNET_NETWORK = 'eip155:8453' as const

/** Current network — Base Sepolia for testnet */
export const CURRENT_NETWORK = BASE_SEPOLIA_NETWORK

/** Public x402 facilitator URL */
const FACILITATOR_URL = 'https://x402.org/facilitator'

/** Payment scheme — "exact" means exact amount (no tipping) */
const PAYMENT_SCHEME = 'exact'

/** Max timeout for payment authorization (5 minutes) */
const MAX_TIMEOUT_SECONDS = 300

// ---------------------------------------------------------------------------
// Env
// ---------------------------------------------------------------------------

/**
 * Get the EquiForge wallet address (recipient of all payments).
 * Must be set as EQUIFORGE_WALLET_ADDRESS env var.
 */
export function getWalletAddress(): string {
  const addr = process.env.EQUIFORGE_WALLET_ADDRESS
  if (!addr) {
    throw new Error(
      'EQUIFORGE_WALLET_ADDRESS environment variable is not set. ' +
        'This must be a Base Sepolia wallet address that receives x402 payments.',
    )
  }
  // Basic validation
  if (!/^0x[a-fA-F0-9]{40}$/.test(addr)) {
    throw new Error(
      `EQUIFORGE_WALLET_ADDRESS is not a valid Ethereum address: ${addr}`,
    )
  }
  return addr
}

// ---------------------------------------------------------------------------
// Server singleton (lazy-initialized)
// ---------------------------------------------------------------------------

let _resourceServer: x402ResourceServer | null = null
let _initPromise: Promise<void> | null = null

/**
 * Get or create the x402 resource server singleton.
 * The server is initialized lazily on first call (fetches /supported from facilitator).
 */
async function getResourceServer(): Promise<x402ResourceServer> {
  if (_resourceServer && _initPromise) {
    await _initPromise
    return _resourceServer
  }

  const facilitator = new HTTPFacilitatorClient({
    url: FACILITATOR_URL,
  })

  _resourceServer = new x402ResourceServer(facilitator)
  registerExactEvmScheme(_resourceServer)

  _initPromise = _resourceServer.initialize()
  await _initPromise

  return _resourceServer
}

// ---------------------------------------------------------------------------
// Build payment requirements (what we tell the client to pay)
// ---------------------------------------------------------------------------

/**
 * Build PaymentRequirements for a given USD price.
 * The resource server converts USD to the on-chain token amount.
 */
export async function buildPaymentRequirements(
  priceUsd: number,
): Promise<PaymentRequirements[]> {
  const server = await getResourceServer()
  const payTo = getWalletAddress()

  const requirements = await server.buildPaymentRequirements({
    scheme: PAYMENT_SCHEME,
    payTo,
    price: priceUsd, // USD — the SDK handles conversion to USDC amount
    network: CURRENT_NETWORK,
    maxTimeoutSeconds: MAX_TIMEOUT_SECONDS,
  })

  return requirements
}

// ---------------------------------------------------------------------------
// HTTP 402 response builder
// ---------------------------------------------------------------------------

export interface PaymentRequiredInfo {
  /** The URL of the resource being accessed */
  url: string
  /** Human-readable description */
  description: string
  /** MIME type of the response */
  mimeType?: string
}

/**
 * Create an HTTP 402 Payment Required response.
 * Returns a Response object that the endpoint can return directly.
 */
export async function createPaymentRequiredResponse(
  priceResult: PriceResult,
  resourceInfo: PaymentRequiredInfo,
): Promise<Response> {
  const server = await getResourceServer()
  const requirements = await buildPaymentRequirements(priceResult.amountUsd)

  const paymentRequired: PaymentRequired = await server.createPaymentRequiredResponse(
    requirements,
    {
      url: resourceInfo.url,
      description: `${resourceInfo.description} — ${priceResult.breakdown}`,
      mimeType: resourceInfo.mimeType ?? 'application/octet-stream',
    },
  )

  const encodedHeader = encodePaymentRequiredHeader(paymentRequired)

  return new Response(
    JSON.stringify({
      error: 'Payment Required',
      x402Version: 2,
      operation: priceResult.operation,
      price: {
        amountUsd: priceResult.amountUsd,
        breakdown: priceResult.breakdown,
        wasGracePeriod: priceResult.wasGracePeriod,
      },
      accepts: requirements,
    }),
    {
      status: 402,
      headers: {
        'Content-Type': 'application/json',
        'PAYMENT-REQUIRED': encodedHeader,
      },
    },
  )
}

// ---------------------------------------------------------------------------
// Payment verification + settlement
// ---------------------------------------------------------------------------

export interface PaymentResult {
  success: true
  /** On-chain transaction hash */
  txHash: string
  /** Network the payment was settled on */
  network: string
  /** Payer's wallet address */
  payerAddress: string
  /** Raw facilitator settle response */
  settleResponse: SettleResponse
  /** Headers to include in the success response */
  responseHeaders: Record<string, string>
}

export interface PaymentError {
  success: false
  /** HTTP status code to return */
  statusCode: number
  /** Error message */
  message: string
  /** If verification failed, the reason */
  reason?: string
}

export type PaymentOutcome = PaymentResult | PaymentError

/**
 * Process a payment from the PAYMENT-SIGNATURE header.
 *
 * Flow:
 * 1. Decode the payment signature header
 * 2. Validate the payload structure (Zod)
 * 3. Find matching requirements for the claimed price
 * 4. Verify the payment with the facilitator
 * 5. Settle the payment on-chain
 * 6. Return the tx hash and payer address
 *
 * SECURITY: The `expectedPriceUsd` is computed server-side. We rebuild
 * requirements from it and verify the payment matches.
 */
export async function processPayment(
  paymentSignatureHeader: string,
  expectedPriceUsd: number,
): Promise<PaymentOutcome> {
  const server = await getResourceServer()

  // 1. Decode the payment payload from the header
  let paymentPayload: PaymentPayload
  try {
    paymentPayload = decodePaymentSignatureHeader(paymentSignatureHeader)
  } catch (err) {
    return {
      success: false,
      statusCode: 400,
      message: `Invalid PAYMENT-SIGNATURE header: ${err instanceof Error ? err.message : String(err)}`,
    }
  }

  // 2. Validate payload structure
  try {
    validatePaymentPayload(paymentPayload)
  } catch (err) {
    return {
      success: false,
      statusCode: 400,
      message: `Malformed payment payload: ${err instanceof Error ? err.message : String(err)}`,
    }
  }

  // 3. Rebuild requirements from server-side price
  const requirements = await buildPaymentRequirements(expectedPriceUsd)

  // 4. Find matching requirements for this payment
  const matchedRequirements = server.findMatchingRequirements(
    requirements,
    paymentPayload,
  )

  if (!matchedRequirements) {
    return {
      success: false,
      statusCode: 402,
      message:
        'Payment does not match any accepted payment requirements. ' +
        'The price may have changed or the payment was for a different resource.',
      reason: 'requirements_mismatch',
    }
  }

  // 5. Verify the payment
  let verifyResult: VerifyResponse
  try {
    verifyResult = await server.verifyPayment(paymentPayload, matchedRequirements)
  } catch (err) {
    return {
      success: false,
      statusCode: 502,
      message: `Payment verification failed (facilitator error): ${err instanceof Error ? err.message : String(err)}`,
      reason: 'verify_error',
    }
  }

  if (!verifyResult.isValid) {
    return {
      success: false,
      statusCode: 402,
      message: `Payment verification failed: ${verifyResult.invalidMessage ?? verifyResult.invalidReason ?? 'unknown reason'}`,
      reason: verifyResult.invalidReason,
    }
  }

  // 6. Settle the payment on-chain
  let settleResult: SettleResponse
  try {
    settleResult = await server.settlePayment(paymentPayload, matchedRequirements)
  } catch (err) {
    return {
      success: false,
      statusCode: 502,
      message: `Payment settlement failed (facilitator error): ${err instanceof Error ? err.message : String(err)}`,
      reason: 'settle_error',
    }
  }

  if (!settleResult.success) {
    return {
      success: false,
      statusCode: 502,
      message: `Payment settlement failed: ${settleResult.errorMessage ?? settleResult.errorReason ?? 'unknown'}`,
      reason: settleResult.errorReason,
    }
  }

  // 7. Build response headers
  const encodedResponse = encodePaymentResponseHeader(settleResult)

  return {
    success: true,
    txHash: settleResult.transaction,
    network: settleResult.network,
    payerAddress: settleResult.payer ?? verifyResult.payer ?? 'unknown',
    settleResponse: settleResult,
    responseHeaders: {
      'PAYMENT-RESPONSE': encodedResponse,
    },
  }
}

// ---------------------------------------------------------------------------
// Convenience: check if request has payment header
// ---------------------------------------------------------------------------

/**
 * Extract the PAYMENT-SIGNATURE header from a Request, if present.
 * Checks both V2 header name and V1 fallback (X-PAYMENT).
 */
export function getPaymentHeader(request: Request): string | null {
  // V2 header
  const v2 = request.headers.get('PAYMENT-SIGNATURE')
  if (v2) return v2

  // V1 fallback
  const v1 = request.headers.get('X-PAYMENT')
  if (v1) return v1

  return null
}

/**
 * Check if a request includes a payment signature.
 */
export function hasPayment(request: Request): boolean {
  return getPaymentHeader(request) !== null
}

// ---------------------------------------------------------------------------
// Network info (for billing events)
// ---------------------------------------------------------------------------

/**
 * Get the human-readable network name for billing records.
 */
export function getNetworkName(): string {
  return CURRENT_NETWORK === BASE_SEPOLIA_NETWORK ? 'base-sepolia' : 'base'
}
