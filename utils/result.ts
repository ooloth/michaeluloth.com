/**
 * Result type for operations that can fail.
 * Represents either a successful value (Ok) or an error (Err).
 *
 * Inspired by Rust's Result type and functional error handling patterns.
 *
 * Usage:
 * ```typescript
 * const result = await fetchData()
 *
 * // Method-based API with autocomplete:
 * const data = result.unwrap()                    // Throws on error
 * const dataOrDefault = result.unwrapOr([])       // Returns default on error
 * const mapped = result.map(d => d.length)        // Transform success value
 *
 * // Type narrowing still works:
 * if (result.ok) {
 *   result.value  // Type: T
 * } else {
 *   result.error  // Type: E
 * }
 * ```
 */
export type Result<T, E = Error> = OkResult<T> | ErrResult<E>

export interface OkResult<T> {
  readonly ok: true
  readonly value: T

  /** Extract value, or throw if Err */
  unwrap(): T

  /** Extract value, or return default if Err */
  unwrapOr(defaultValue: T): T

  /** Transform the value inside Ok */
  map<U>(fn: (value: T) => U): OkResult<U>

  /** Chain Result-returning operations */
  flatMap<U, F>(fn: (value: T) => Result<U, F>): Result<U, F>

  /** Transform the error (no-op for Ok) */
  mapErr<F>(fn: (error: never) => F): OkResult<T>
}

export interface ErrResult<E> {
  readonly ok: false
  readonly error: E

  /** Extract value, or throw if Err */
  unwrap(): never

  /** Extract value, or return default if Err */
  unwrapOr<T>(defaultValue: T): T

  /** Transform the value (no-op for Err) */
  map<U>(fn: (value: never) => U): ErrResult<E>

  /** Chain Result-returning operations (no-op for Err) */
  flatMap<U, F>(fn: (value: never) => Result<U, F>): ErrResult<E>

  /** Transform the error inside Err */
  mapErr<F>(fn: (error: E) => F): ErrResult<F>
}

/**
 * Create a successful Result
 */
export function Ok<T>(value: T): OkResult<T> {
  return {
    ok: true,
    value,

    unwrap() {
      return value
    },

    // Parameter unused in Ok case - always returns value, ignoring default
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    unwrapOr(_defaultValue: T) {
      return value
    },

    map<U>(fn: (value: T) => U): OkResult<U> {
      return Ok(fn(value))
    },

    flatMap<U, F>(fn: (value: T) => Result<U, F>): Result<U, F> {
      return fn(value)
    },

    // Parameter unused in Ok case - no error to transform
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    mapErr<F>(_fn: (error: never) => F): OkResult<T> {
      return this
    },
  }
}

/**
 * Create a failed Result
 */
export function Err<E>(error: E): ErrResult<E> {
  return {
    ok: false,
    error,

    unwrap(): never {
      throw error
    },

    unwrapOr<T>(defaultValue: T): T {
      return defaultValue
    },

    // Parameter unused in Err case - no value to transform
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    map<U>(_fn: (value: never) => U): ErrResult<E> {
      return this
    },

    // Parameter unused in Err case - no value to flatMap over
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    flatMap<U, F>(_fn: (value: never) => Result<U, F>): ErrResult<E> {
      return this
    },

    mapErr<F>(fn: (error: E) => F): ErrResult<F> {
      return Err(fn(error))
    },
  }
}

/**
 * Check if a Result is Ok
 */
export function isOk<T, E>(result: Result<T, E>): result is OkResult<T> {
  return result.ok === true
}

/**
 * Check if a Result is Err
 */
export function isErr<T, E>(result: Result<T, E>): result is ErrResult<E> {
  return result.ok === false
}

/**
 * Normalizes any caught value to an Error instance.
 *
 * JavaScript allows throwing any value (not just Error objects).
 * This helper ensures the value is always an Error instance with proper stack traces.
 *
 * @param error - The caught exception (can be Error, string, number, object, etc.)
 * @returns Error instance
 *
 * @example
 * ```typescript
 * try {
 *   riskyOperation()
 * } catch (error) {
 *   const normalizedError = normalizeError(error)
 *   logger.error(normalizedError.message, normalizedError.stack)
 *   throw normalizedError
 * }
 * ```
 */
export function normalizeError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error))
}

/**
 * Converts caught exceptions to ErrResult<Error>.
 *
 * Combines error normalization with Result wrapping and optional logging.
 * This is the most common pattern for catch blocks in Result-returning functions.
 *
 * @param error - The caught exception (can be Error, string, number, object, etc.)
 * @param context - Optional context string for logging (e.g., function name)
 * @returns ErrResult containing an Error instance
 *
 * @example
 * ```typescript
 * try {
 *   const data = await externalAPI()
 *   return Ok(data)
 * } catch (error) {
 *   return toErr(error, 'fetchData')
 * }
 * ```
 */
export function toErr(error: unknown, context?: string): ErrResult<Error> {
  const normalizedError = normalizeError(error)

  if (context) {
    console.error(`${context} error:`, error)
  }

  return Err(normalizedError)
}
