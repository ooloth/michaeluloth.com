/**
 * Custom error class for invariant violations.
 * Indicates a bug in the code - a condition that should be impossible was encountered.
 */
export class InvariantViolationError extends Error {
  context?: Record<string, unknown>

  constructor(message: string, context?: Record<string, unknown>) {
    super(message)
    this.name = 'InvariantViolationError'
    this.context = context
  }
}

/**
 * Runtime assertion helper for conditions that should be impossible if code is correct.
 *
 * Use this to document and enforce invariants - assumptions that should never be violated.
 * If an invariant fails, it indicates a bug in the code, not a runtime error.
 *
 * Message convention: Use "X must Y" pattern to state the invariant clearly.
 * Since InvariantViolationError already signals "this shouldn't happen",
 * the message should describe what must be true, not what operation failed.
 *
 * @param condition - The condition that must be true
 * @param message - Error message stating the invariant (use "X must Y" pattern)
 * @param context - Optional context object for debugging (attached to error)
 * @throws {InvariantViolationError} If condition is falsy
 *
 * @example
 * ```typescript
 * // Type narrowing
 * const user = getUser(id)
 * invariant(user, 'User must exist after authentication')
 * // TypeScript knows user is non-null here
 *
 * // Documenting assumptions with context
 * invariant(width > 0 && height > 0,
 *   'Image dimensions must be positive',
 *   { width, height, publicId }
 * )
 *
 * // State must have required property
 * invariant(ariaLabel, 'Emoji must have aria-label', { symbol })
 * ```
 */
// Allow `any` type for condition to accept any truthy/falsy value for runtime checks
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function invariant(condition: any, message: string, context?: Record<string, unknown>): asserts condition {
  if (!condition) {
    throw new InvariantViolationError(message, context)
  }
}
