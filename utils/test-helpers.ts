/**
 * Test utilities for common testing patterns.
 */

/**
 * Asserts that a value is an instance of a specific class and narrows the type.
 * Useful in catch blocks where TypeScript doesn't know the error type.
 *
 * @param value - The value to check
 * @param constructor - The constructor function to check against
 * @param message - Optional custom error message
 *
 * @example
 * ```typescript
 * try {
 *   riskyOperation()
 *   fail('should have thrown')
 * } catch (error) {
 *   assertInstanceOf(error, InvariantViolationError)
 *   // TypeScript now knows error is InvariantViolationError
 *   expect(error.context).toEqual({ ... })
 * }
 * ```
 */
export function assertInstanceOf<T>(
  value: unknown,
  // Constructor signature requires `any[]` for arbitrary class arguments
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor: new (...args: any[]) => T,
  message?: string,
): asserts value is T {
  if (!(value instanceof constructor)) {
    throw new Error(message ?? `Expected instance of ${constructor.name}, got ${typeof value}`)
  }
}
