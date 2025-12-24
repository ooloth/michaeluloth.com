/**
 * Send notification via Pushover API
 *
 * WHY THIS EXISTS:
 * Centralized Pushover notification sending with proper error handling.
 * Separating this from the CLI script allows for:
 * - Testing with mocked fetch
 * - Reuse in other contexts (future notification scenarios)
 * - Centralized error handling
 *
 * See: https://pushover.net/api
 */

import type { PushoverClient } from './client'
import type { PushoverMessage, PushoverResponse } from './types'

export async function sendNotification(
  client: PushoverClient,
  params: Omit<PushoverMessage, 'token' | 'user'>,
): Promise<PushoverResponse> {
  const formData = new URLSearchParams({
    token: client.apiToken,
    user: client.userKey,
    message: params.message,
    ...(params.url && { url: params.url }),
    ...(params.title && { title: params.title }),
    ...(params.priority !== undefined && { priority: params.priority.toString() }),
  })

  const response = await fetch(client.apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formData.toString(),
  })

  const data: PushoverResponse = await response.json()

  if (data.status === 0) {
    throw new Error(`Pushover API error: ${data.errors?.join(', ') || 'Unknown error'}`)
  }

  return data
}
