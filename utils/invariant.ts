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
 * @param condition - The condition that must be true
 * @param message - Error message describing what invariant was violated
 * @param context - Optional context object for debugging (attached to error)
 * @throws {InvariantViolationError} If condition is falsy
 *
 * @example
 * ```typescript
 * // Type narrowing
 * const publicId = parsePublicIdFromCloudinaryUrl(url)
 * invariant(publicId, 'Failed to parse Cloudinary public ID')
 * // TypeScript knows publicId is non-null here
 *
 * // Documenting assumptions
 * invariant(width > 0 && height > 0,
 *   'Image dimensions must be positive',
 *   { width, height, publicId }
 * )
 * ```
 */
export function invariant(
  condition: any,
  message: string,
  context?: Record<string, unknown>,
): asserts condition {
  if (!condition) {
    throw new InvariantViolationError(message, context)
  }
}
