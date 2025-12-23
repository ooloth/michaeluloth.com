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
  initialDelayMs: 1000,
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
 * Determines if an error is retryable (network/timeout errors)
 */
function isRetryableError(error: unknown): boolean {
  if (!(error instanceof Error)) return false

  // Check error message for common network/timeout patterns
  const message = error.message.toLowerCase()
  const isNetworkError =
    message.includes('fetch failed') ||
    message.includes('network') ||
    message.includes('timeout') ||
    message.includes('etimedout') ||
    message.includes('econnreset') ||
    message.includes('enotfound')

  // Check error cause for timeout/network codes
  const cause = (error as Error & { cause?: { code?: string } }).cause
  const hasRetryableCode =
    cause?.code === 'ETIMEDOUT' ||
    cause?.code === 'ECONNRESET' ||
    cause?.code === 'ENOTFOUND' ||
    cause?.code === 'EAI_AGAIN'

  return isNetworkError || hasRetryableCode
}

/**
 * Retries an async operation with exponential backoff.
 * Only retries on network/timeout errors, not validation or other logical errors.
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

      // Don't retry non-retryable errors (validation errors, missing data, etc.)
      if (!isRetryableError(lastError)) {
        throw lastError
      }

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
