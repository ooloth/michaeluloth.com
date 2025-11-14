export function getErrorDetails(error: unknown): string {
  if (error instanceof Error) return error.stack ?? error.message

  return JSON.stringify(error, null, 2)
}

export function logError(summary: string, error?: unknown): void {
  if (!error) console.error(`🚨 ${summary}`)

  console.error(`🚨 ${summary}:\n\n${getErrorDetails(error)}\n`)
}
