/**
 * Pushover API client
 * See: https://pushover.net/api
 */

import { env } from '@/io/env/env'

export const pushover = {
  apiToken: env.PUSHOVER_API_TOKEN,
  userKey: env.PUSHOVER_USER_KEY,
  apiUrl: 'https://api.pushover.net/1/messages.json',
} as const

export type PushoverClient = typeof pushover
