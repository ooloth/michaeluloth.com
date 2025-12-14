// Import is unused but required for global type declaration to work
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { vi } from 'vitest'

declare global {
  const vi: typeof vi
}
