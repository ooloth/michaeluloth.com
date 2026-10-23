/**
 * Pushover API client
 * See: https://pushover.net/api
 */

import { pushoverEnv } from '@/io/env/pushover'

export const pushover = {
  apiToken: pushoverEnv.PUSHOVER_API_TOKEN,
  userKey: pushoverEnv.PUSHOVER_USER_KEY,
  apiUrl: 'https://api.pushover.net/1/messages.json',
} as const

export type PushoverClient = typeof pushover
