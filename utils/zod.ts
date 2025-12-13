import { type ZodError } from 'zod'

/**
 * Formats a Zod validation error into a concise, readable string.
 * Returns the problematic fields and their error messages.
 *
 * @param error - The Zod validation error
 * @returns Formatted string like "title: Required, date: Invalid format"
 *
 * @example
 * const formatted = formatValidationError(zodError)
 * // Returns: "title: Required, date: Invalid format"
 */
export function formatValidationError(error: ZodError): string {
  return error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`).join(', ')
}

/**
 * Logs a Zod validation error in a concise, readable format.
 * Example: "Skipping invalid post (title: Required, date: Invalid format)"
 */
export function logValidationError(error: ZodError, context: string): void {
  const errors = formatValidationError(error)
  console.warn(`Skipping invalid ${context} (${errors})`)
}
