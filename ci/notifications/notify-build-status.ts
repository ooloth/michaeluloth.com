#!/usr/bin/env tsx
/**
 * Send Pushover notification based on GitHub Actions build status
 *
 * WHY THIS EXISTS:
 * GitHub Actions workflows need to send notifications about build outcomes.
 * This script determines the appropriate message based on which job failed
 * and sends it via Pushover API.
 *
 * WHAT IT DOES:
 * - Reads job results from command-line arguments
 * - Determines appropriate notification message (success vs specific failure)
 * - Sends notification via Pushover API
 * - Exits with appropriate status code
 *
 * USAGE:
 * Called by GitHub Actions workflow with job results as arguments:
 *
 *   tsx ci/notifications/notify-build-status.ts \
 *     --deploy=success \
 *     --lighthouse=success \
 *     --metadata=success \
 *     --build=success \
 *     --test=success \
 *     --typecheck=success \
 *     --lint=success \
 *     --format=success \
 *     --workflow-url="https://github.com/user/repo/actions/runs/123"
 *
 * ENVIRONMENT VARIABLES:
 * - PUSHOVER_API_TOKEN: Your Pushover application API token (required)
 * - PUSHOVER_USER_KEY: Your Pushover user/group key (required)
 *
 * See io/env/env.ts for validation
 */

import { pushover } from '@/io/pushover/client'
import { determineBuildStatus } from './determine-build-notification'
import { sendNotification } from '@/io/pushover/send-notification'
import type { BuildStatusInputs, JobResult } from '@/io/pushover/types'

/**
 * Parse command-line arguments into BuildStatusInputs
 */
function parseArgs(): BuildStatusInputs {
  const args = process.argv.slice(2)
  const parsed: Record<string, string> = {}

  for (const arg of args) {
    const match = arg.match(/^--([^=]+)=(.*)$/)
    if (match) {
      const [, key, value] = match
      parsed[key] = value
    }
  }

  return {
    deploy: (parsed.deploy || '') as JobResult,
    lighthouse: (parsed.lighthouse || '') as JobResult,
    metadata: (parsed.metadata || '') as JobResult,
    build: (parsed.build || '') as JobResult,
    test: (parsed.test || '') as JobResult,
    typecheck: (parsed.typecheck || '') as JobResult,
    lint: (parsed.lint || '') as JobResult,
    format: (parsed.format || '') as JobResult,
    workflowUrl: parsed['workflow-url'] || '',
  }
}

/**
 * Validate required inputs
 */
function validateInputs(inputs: BuildStatusInputs): void {
  if (!inputs.workflowUrl) {
    throw new Error('Missing required argument: --workflow-url')
  }

  // Validate at least one job result is provided
  const hasJobResult = Object.entries(inputs)
    .filter(([key]) => key !== 'workflowUrl')
    .some(([, value]) => value !== '')

  if (!hasJobResult) {
    throw new Error('At least one job result must be provided')
  }
}

async function main() {
  try {
    // Parse and validate inputs
    const inputs = parseArgs()
    validateInputs(inputs)

    // Determine notification content
    const notification = determineBuildStatus(inputs)

    console.log(`Sending notification: ${notification.message}`)
    if (notification.url) {
      console.log(`URL: ${notification.url}`)
    }

    // Send notification
    const response = await sendNotification(pushover, notification)

    console.log(`✓ Notification sent (request: ${response.request})`)
    process.exit(0)
  } catch (error) {
    console.error('❌ Failed to send notification:', error)
    process.exit(1)
  }
}

// Only execute main() when this file is run directly (not when imported by tests)
// Similar to Python's: if __name__ == "__main__"
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}

export { parseArgs, validateInputs }
