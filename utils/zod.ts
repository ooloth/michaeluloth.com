import { type ZodError } from 'zod'

/**
 * Logs a Zod validation error in a concise, readable format.
 * Example: "Skipping invalid post (title: Required, date: Invalid format)"
 */
export function logValidationError(error: ZodError, context: string): void {
  const errors = error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`).join(', ')
  console.warn(`Skipping invalid ${context} (${errors})`)
}
