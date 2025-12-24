/**
 * Pure function to determine notification message and URL based on GitHub Actions job results.
 *
 * WHY THIS EXISTS:
 * GitHub Actions job results need to be prioritized to show the most relevant failure.
 * For example, if the build fails, we shouldn't report "deployment failed" - we should
 * report "build failed" since that's the root cause.
 *
 * WHAT IT DOES:
 * - Checks job results in priority order (deploy > lighthouse > metadata > build > test > typecheck > lint > format)
 * - Returns success message if deployment succeeded
 * - Returns specific failure message for first failing job
 * - Includes workflow URL for all failures (not for success)
 *
 * WHY IT'S PURE:
 * Being a pure function (no I/O, no side effects) makes it:
 * - Easy to test with Vitest
 * - Easy to reason about
 * - Reliable and predictable
 */

import type { BuildStatusInputs, BuildNotification } from '@/io/pushover/types'

export function determineBuildStatus(inputs: BuildStatusInputs): BuildNotification {
  const { deploy, lighthouse, metadata, build, test, typecheck, lint, format, workflowUrl } = inputs

  if (deploy === 'success') {
    return {
      message: '✅ michaeluloth.com deployed successfully',
    }
  }

  if (deploy === 'failure') {
    return {
      message: '❌ Deployment to Cloudflare failed',
      url: workflowUrl,
    }
  }

  if (lighthouse === 'failure') {
    return {
      message: '❌ Lighthouse checks failed',
      url: workflowUrl,
    }
  }

  if (metadata === 'failure') {
    return {
      message: '❌ Metadata validation failed',
      url: workflowUrl,
    }
  }

  if (build === 'failure') {
    return {
      message: '❌ Build failed',
      url: workflowUrl,
    }
  }

  if (test === 'failure') {
    return {
      message: '❌ Tests failed',
      url: workflowUrl,
    }
  }

  if (typecheck === 'failure') {
    return {
      message: '❌ Type checking failed',
      url: workflowUrl,
    }
  }

  if (lint === 'failure') {
    return {
      message: '❌ Linting failed',
      url: workflowUrl,
    }
  }

  if (format === 'failure') {
    return {
      message: '❌ Formatting check failed',
      url: workflowUrl,
    }
  }

  // Fallback for unexpected states (e.g., all jobs cancelled/skipped)
  return {
    message: '❌ Deployment pipeline failed',
    url: workflowUrl,
  }
}
