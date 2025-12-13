/**
 * Result type for operations that can fail.
 * Represents either a successful value (Ok) or an error (Err).
 *
 * Inspired by Rust's Result type and functional error handling patterns.
 */
export type Result<T, E = Error> = Ok<T> | Err<E>

export type Ok<T> = {
  readonly ok: true
  readonly value: T
}

export type Err<E> = {
  readonly ok: false
  readonly error: E
}

/**
 * Create a successful Result
 */
export function Ok<T>(value: T): Ok<T> {
  return { ok: true, value }
}

/**
 * Create a failed Result
 */
export function Err<E>(error: E): Err<E> {
  return { ok: false, error }
}

/**
 * Check if a Result is Ok
 */
export function isOk<T, E>(result: Result<T, E>): result is Ok<T> {
  return result.ok === true
}

/**
 * Check if a Result is Err
 */
export function isErr<T, E>(result: Result<T, E>): result is Err<E> {
  return result.ok === false
}

/**
 * Extract value from Ok, or throw if Err
 * Use with caution - only when you're sure the operation succeeded
 */
export function unwrap<T, E>(result: Result<T, E>): T {
  if (result.ok) {
    return result.value
  }
  throw result.error
}

/**
 * Extract value from Ok, or return a default value if Err
 */
export function unwrapOr<T, E>(result: Result<T, E>, defaultValue: T): T {
  return result.ok ? result.value : defaultValue
}

/**
 * Map over the value in an Ok Result
 */
export function map<T, U, E>(result: Result<T, E>, fn: (value: T) => U): Result<U, E> {
  return result.ok ? Ok(fn(result.value)) : result
}

/**
 * Map over the error in an Err Result
 */
export function mapErr<T, E, F>(result: Result<T, E>, fn: (error: E) => F): Result<T, F> {
  return result.ok ? result : Err(fn(result.error))
}

/**
 * Chain multiple Result-returning operations
 */
export function flatMap<T, U, E>(
  result: Result<T, E>,
  fn: (value: T) => Result<U, E>
): Result<U, E> {
  return result.ok ? fn(result.value) : result
}
