/**
 * What to do after a failed attempt: wait a time the server asked for, back off, or stop retrying.
 */
export type RetryDecision =
  | { kind: 'wait'; delayMs: number }
  | { kind: 'backoff'; delayMs: number }
  | { kind: 'give-up'; error: Error }

/**
 * Lets one API decide how its failures are retried, and hold back new attempts while it is paused.
 */
export type RetryPolicy = {
  decide: (error: Error, attempt: number, backoffDelayMs: number) => RetryDecision
  beforeAttempt: () => Promise<void>
}

/**
 * Retry configuration options
 */
export type RetryOptions = {
  policy?: RetryPolicy
  maxAttempts?: number
  initialDelayMs?: number
  maxDelayMs?: number
  backoffMultiplier?: number
  onRetry?: (error: Error, attempt: number, delayMs: number) => void
}

/**
 * Default retry configuration
 */
const DEFAULT_OPTIONS: Required<Omit<RetryOptions, 'policy'>> = {
  maxAttempts: 3,
  initialDelayMs: 2000,
  maxDelayMs: 10000,
  backoffMultiplier: 2,
  onRetry: () => {},
}

/**
 * Sleep for a specified duration
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Calculate delay with exponential backoff
 */
function calculateDelay(attempt: number, options: Required<Omit<RetryOptions, 'policy'>>): number {
  const delay = options.initialDelayMs * Math.pow(options.backoffMultiplier, attempt - 1)
  return Math.min(delay, options.maxDelayMs)
}

/**
 * Retries an async operation with exponential backoff, or as a policy decides.
 *
 * @param fn - The async function to retry
 * @param options - Retry configuration
 * @returns The result of the function
 * @throws The last error if all retries are exhausted
 *
 * @example
 * const data = await withRetry(() => fetchFromAPI(), {
 *   maxAttempts: 3,
 *   initialDelayMs: 1000,
 *   onRetry: (error, attempt, delay) => {
 *     console.log(`Retry attempt ${attempt} after ${delay}ms: ${error.message}`)
 *   }
 * })
 */
export async function withRetry<T>(fn: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
  const { policy, ...rest } = options
  const opts = { ...DEFAULT_OPTIONS, ...rest }
  let lastError: Error

  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    await policy?.beforeAttempt()

    try {
      return await fn()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))

      const backoffDelayMs = calculateDelay(attempt, opts)
      const decision: RetryDecision = policy
        ? policy.decide(lastError, attempt, backoffDelayMs)
        : { kind: 'backoff', delayMs: backoffDelayMs }

      if (decision.kind === 'give-up') {
        throw decision.error
      }

      // Don't retry if this was the last attempt
      if (attempt >= opts.maxAttempts) {
        throw lastError
      }

      // Wait before retrying; a wait the server asked for is not capped by maxDelayMs
      opts.onRetry(lastError, attempt, decision.delayMs)
      await sleep(decision.delayMs)
    }
  }

  // TypeScript doesn't know lastError is always assigned
  throw lastError!
}
