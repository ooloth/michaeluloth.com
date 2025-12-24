/**
 * Pushover API types
 * See: https://pushover.net/api
 */

export interface PushoverMessage {
  /** Your application's API token (required) */
  token: string
  /** The user/group key (required) */
  user: string
  /** Your message (required, max 1024 characters) */
  message: string
  /** A supplementary URL to show with your message */
  url?: string
  /** A title for your notification */
  title?: string
  /** Send as -2 (lowest), -1 (low), 0 (normal), 1 (high), 2 (emergency) */
  priority?: -2 | -1 | 0 | 1 | 2
}

export interface PushoverResponse {
  /** 1 if successful, 0 if failed */
  status: 0 | 1
  /** A random request identifier */
  request: string
  /** Array of error messages if status is 0 */
  errors?: string[]
}

/**
 * GitHub Actions job result status
 * See: https://docs.github.com/en/actions/learn-github-actions/contexts#needs-context
 */
export type JobResult = 'success' | 'failure' | 'cancelled' | 'skipped' | ''

export interface BuildStatusInputs {
  deploy: JobResult
  lighthouse: JobResult
  metadata: JobResult
  build: JobResult
  test: JobResult
  typecheck: JobResult
  lint: JobResult
  format: JobResult
  /** GitHub Actions run URL for failures */
  workflowUrl: string
}

export interface BuildNotification {
  /** The notification message text */
  message: string
  /** Optional URL to include with the notification */
  url?: string
}
