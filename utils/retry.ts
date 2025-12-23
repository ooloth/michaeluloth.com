/**
 * Retry configuration options
 */
export type RetryOptions = {
  maxAttempts?: number
  initialDelayMs?: number
  maxDelayMs?: number
  backoffMultiplier?: number
  onRetry?: (error: Error, attempt: number, delayMs: number) => void
}

/**
 * Default retry configuration
 */
const DEFAULT_OPTIONS: Required<RetryOptions> = {
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
function calculateDelay(attempt: number, options: Required<RetryOptions>): number {
  const delay = options.initialDelayMs * Math.pow(options.backoffMultiplier, attempt - 1)
  return Math.min(delay, options.maxDelayMs)
}

/**
 * Retries an async operation with exponential backoff.
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
  const opts = { ...DEFAULT_OPTIONS, ...options }
  let lastError: Error

  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))

      // Don't retry if this was the last attempt
      if (attempt >= opts.maxAttempts) {
        throw lastError
      }

      // Calculate delay and wait before retrying
      const delayMs = calculateDelay(attempt, opts)
      opts.onRetry(lastError, attempt, delayMs)
      await sleep(delayMs)
    }
  }

  // TypeScript doesn't know lastError is always assigned
  throw lastError!
}
