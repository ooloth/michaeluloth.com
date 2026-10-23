/**
 * Handles Notion rate limits for the requests a build makes.
 *
 * Notion answers 429 (rate limited) or 529 (overloaded) with a Retry-After header in seconds, and
 * asks clients to pause new requests for at least that long. Every Notion call in this process
 * shares one pause, so a call that starts while another is waiting holds back too.
 * See: https://developers.notion.com/reference/request-limits
 */

import { APIResponseError, UnknownHTTPResponseError } from '@notionhq/client'
import type { RetryDecision, RetryOptions, RetryPolicy } from '@/io/utils/retry'

/** Longer waits fail the build rather than stall it; Notion's budget resets every 60 seconds. */
const MAX_RETRY_AFTER_SECONDS = 90

type RetryAfter = {
  seconds: number
  reason: string | undefined
  requestId: string | undefined
}

/**
 * Notion asked the build to wait longer than it is willing to.
 */
export class NotionRateLimitTooLong extends Error {
  readonly retryAfterSeconds: number
  readonly reason: string | undefined
  readonly requestId: string | undefined

  constructor({ seconds, reason, requestId }: RetryAfter) {
    super(
      `Notion rate limited the build and asked it to wait ${seconds} seconds, more than the ${MAX_RETRY_AFTER_SECONDS} seconds it will wait (reason: ${reason ?? 'unknown'}, request: ${requestId ?? 'unknown'})`,
    )
    this.name = 'NotionRateLimitTooLong'
    this.retryAfterSeconds = seconds
    this.reason = reason
    this.requestId = requestId
  }
}

/**
 * Reads how long Notion asked to wait, from a 429 or 529 response with a whole-number Retry-After.
 * Returns null for every other error, which then gets the ordinary backoff.
 */
export function readRetryAfter(error: unknown): RetryAfter | null {
  if (!APIResponseError.isAPIResponseError(error) && !UnknownHTTPResponseError.isUnknownHTTPResponseError(error)) {
    return null
  }
  if (error.status !== 429 && error.status !== 529) {
    return null
  }

  // The SDK types headers as unknown; Node's fetch, which the client uses, returns Headers
  const header = error.headers instanceof Headers ? error.headers.get('retry-after') : null
  if (header === null || !/^\d+$/.test(header) || Number(header) <= 0) {
    return null
  }

  const reason = error.additional_data?.rate_limit_reason
  return {
    seconds: Number(header),
    reason: typeof reason === 'string' ? reason : undefined,
    requestId: error.request_id,
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export type NotionRetryPolicy = RetryPolicy & {
  /** When the current pause ends, in milliseconds since the epoch (0 when never paused). */
  pausedUntil: () => number
}

/**
 * Creates the pause that Notion calls in one process share.
 */
export function createNotionRetryPolicy(): NotionRetryPolicy {
  let pausedUntil = 0

  function extendPause(delayMs: number): void {
    const previous = pausedUntil
    pausedUntil = Math.max(pausedUntil, Date.now() + delayMs)
    if (pausedUntil < previous) throw new Error(`Notion pause moved backwards from ${previous} to ${pausedUntil}`)
  }

  return {
    decide(error, _attempt, backoffDelayMs): RetryDecision {
      const retryAfter = readRetryAfter(error)
      if (retryAfter === null) {
        return { kind: 'backoff', delayMs: backoffDelayMs }
      }

      if (retryAfter.seconds > MAX_RETRY_AFTER_SECONDS) {
        return { kind: 'give-up', error: new NotionRateLimitTooLong(retryAfter) }
      }

      const delayMs = retryAfter.seconds * 1000
      extendPause(delayMs)
      if (delayMs < retryAfter.seconds * 1000) {
        throw new Error(`Notion wait of ${delayMs}ms is shorter than Retry-After ${retryAfter.seconds}s`)
      }
      return { kind: 'wait', delayMs }
    },

    async beforeAttempt() {
      // The pause can be extended while we sleep, so check again after each sleep
      while (pausedUntil > Date.now()) {
        await sleep(pausedUntil - Date.now())
      }
    },

    pausedUntil: () => pausedUntil,
  }
}

/** The pause shared by every Notion call in this process. */
const notionRetryPolicy = createNotionRetryPolicy()

/**
 * Retry options for a Notion call: honours Retry-After through the shared pause, and logs each
 * retry with what was being fetched.
 *
 * @param label - What the call fetches, for the log (e.g. `post "hello-world"`)
 */
export function notionRetryOptions(label: string): RetryOptions {
  return {
    policy: notionRetryPolicy,
    onRetry: (error, attempt, delayMs) => {
      const retryAfter = readRetryAfter(error)
      const seconds = Math.round(delayMs / 1000)

      console.log(
        retryAfter === null
          ? `⚠️  Notion request for ${label} failed - retrying (attempt ${attempt}/3 after ${delayMs}ms): ${error.message}`
          : `⏸️  Notion rate limited the request for ${label} (${retryAfter.reason ?? 'unknown reason'}) - pausing Notion requests in this process for ${seconds}s as Retry-After asks (attempt ${attempt}/3)`,
      )
    },
  }
}
