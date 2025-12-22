#!/usr/bin/env tsx
/**
 * Parse Lighthouse CI results and show detailed failure information.
 *
 * Automatically runs after Lighthouse CI failures (via npm run lighthouse).
 * Reads .lighthouseci/*.json reports and formats failures with greppable attributes.
 *
 * IMPORTANT: This runs automatically when Lighthouse fails - you rarely need to run it manually.
 * If you do: npm run lighthouse (which calls this script on failure)
 */

import { readFileSync, existsSync, readdirSync } from 'fs'
import { join } from 'path'
import { LHCI_DIR } from './config'

interface LighthouseNode {
  selector?: string
  snippet?: string
  explanation?: string
}

interface LighthouseItem {
  node?: LighthouseNode
}

interface LighthouseDetails {
  items?: LighthouseItem[]
}

interface LighthouseAudit {
  id: string
  title: string
  score: number | null
  description: string
  details?: LighthouseDetails
}

interface LighthouseCategory {
  score: number
}

interface LighthouseResult {
  finalUrl?: string
  requestedUrl?: string
  audits: Record<string, LighthouseAudit>
  categories: {
    accessibility: LighthouseCategory
    performance: LighthouseCategory
    seo: LighthouseCategory
    'best-practices': LighthouseCategory
  }
}

interface FailingElement {
  selector?: string
  snippet?: string
  searchableAttrs: string[]
}

interface FailingAudit {
  id: string
  title: string
  score: number
  description: string
  elements: FailingElement[]
}

interface PageFailures {
  url: string
  categories: LighthouseResult['categories']
  audits: FailingAudit[]
}

// ============================================================================
// Pure Functions (no I/O, easily testable)
// ============================================================================

/**
 * Extract searchable HTML attributes from a snippet.
 * Returns attributes you can grep for in React source code.
 *
 * @example
 * extractSearchableAttrs('<a href="/rss.xml">') // ['href="/rss.xml"']
 */
export function extractSearchableAttrs(snippet: string): string[] {
  const attrs: string[] = []

  const patterns = [
    { regex: /href="([^"]+)"/, format: (val: string) => `href="${val}"` },
    { regex: /src="([^"]+)"/, format: (val: string) => `src="${val}"` },
    { regex: /alt="([^"]+)"/, format: (val: string) => `alt="${val}"` },
    { regex: /aria-label="([^"]+)"/, format: (val: string) => `aria-label="${val}"` },
    { regex: /\bid="([^"]+)"/, format: (val: string) => `id="${val}"` },
    { regex: /data-testid="([^"]+)"/, format: (val: string) => `data-testid="${val}"` },
  ]

  for (const { regex, format } of patterns) {
    const match = snippet.match(regex)
    if (match) attrs.push(format(match[1]))
  }

  return attrs
}

/**
 * Check if an audit has failed (score below 1.0).
 */
function isFailingAudit(audit: LighthouseAudit): boolean {
  return audit.score !== null && audit.score < 1
}

/**
 * Transform a Lighthouse audit item into a failing element with searchable attributes.
 */
function transformAuditItemToElement(item: LighthouseItem): FailingElement | null {
  const selector = item.node?.selector
  const snippet = item.node?.snippet

  if (!selector && !snippet) return null

  return {
    selector,
    snippet,
    searchableAttrs: snippet ? extractSearchableAttrs(snippet) : [],
  }
}

/**
 * Extract all failing audits from a Lighthouse result.
 *
 * Parses Lighthouse JSON report and returns only audits with score < 1.0,
 * including details about failing elements with searchable attributes.
 *
 * @example
 * const lhr = JSON.parse(readFileSync('.lighthouseci/lhr-123.json', 'utf-8'))
 * const failing = extractFailingAudits(lhr)
 * // Returns: [{ id: 'image-alt', title: 'Image elements have alt', score: 0.5, elements: [...] }]
 */
export function extractFailingAudits(lhr: LighthouseResult): FailingAudit[] {
  const failing: FailingAudit[] = []

  for (const [id, audit] of Object.entries(lhr.audits)) {
    if (!isFailingAudit(audit)) continue

    const items = audit.details?.items || []
    const elements = items.map(transformAuditItemToElement).filter((el): el is FailingElement => el !== null)

    failing.push({
      id,
      title: audit.title,
      score: audit.score as number, // Safe because isFailingAudit checks score !== null
      description: audit.description,
      elements,
    })
  }

  return failing
}

/**
 * Format a category score as a percentage.
 */
function formatScore(score: number): string {
  return `${(score * 100).toFixed(0)}%`
}

/**
 * Format failures for a single page.
 *
 * Returns formatted string showing category scores, failing audits, and
 * greppable attributes for each failing element.
 *
 * @example
 * const output = formatPageFailures({
 *   url: 'http://localhost:3000/index.html',
 *   categories: { accessibility: { score: 0.89 }, performance: { score: 0.95 }, ... },
 *   audits: [{ id: 'image-alt', title: 'Image alt text', score: 0.5, elements: [...] }]
 * })
 * // Returns formatted multi-line string for console output with URL, scores, and greppable attributes
 */
export function formatPageFailures(failures: PageFailures): string {
  const lines: string[] = []

  lines.push(`\n${failures.url}`)
  lines.push(`  Accessibility: ${formatScore(failures.categories.accessibility.score)}`)
  lines.push(`  Performance:   ${formatScore(failures.categories.performance.score)}`)
  lines.push(`  SEO:           ${formatScore(failures.categories.seo.score)}`)
  lines.push(`  Best Practices: ${formatScore(failures.categories['best-practices'].score)}`)

  lines.push(`\n  Failing audits (${failures.audits.length}):`)

  for (const audit of failures.audits) {
    lines.push(`\n    ✗ ${audit.title} (score: ${audit.score})`)
    lines.push(`      ${audit.description}`)

    if (audit.elements.length > 0) {
      lines.push(`\n      Failing elements (${audit.elements.length}):`)
      for (const element of audit.elements) {
        if (element.searchableAttrs.length > 0) {
          lines.push(`        GREP FOR: ${element.searchableAttrs.join(' ')}`)
        }
        if (element.selector) {
          lines.push(`        CSS: ${element.selector}`)
        }
        if (element.snippet) {
          lines.push(`        HTML: ${element.snippet}`)
        }
        lines.push('') // Blank line between elements
      }
    }
  }

  return lines.join('\n')
}

// ============================================================================
// I/O Functions
// ============================================================================

/**
 * Find all Lighthouse report JSON files in .lighthouseci directory.
 */
function findLighthouseReportFiles(): string[] {
  if (!existsSync(LHCI_DIR)) return []
  return readdirSync(LHCI_DIR)
    .filter(f => f.startsWith('lhr-') && f.endsWith('.json'))
    .map(f => join(LHCI_DIR, f))
}

/**
 * Load and parse all Lighthouse reports, grouping failures by URL.
 */
function loadAllFailures(): PageFailures[] {
  const files = findLighthouseReportFiles()
  const failuresByUrl = new Map<string, PageFailures>()

  for (const file of files) {
    const lhr: LighthouseResult = JSON.parse(readFileSync(file, 'utf-8'))
    const url = lhr.finalUrl || lhr.requestedUrl || 'unknown'
    const audits = extractFailingAudits(lhr)

    if (audits.length > 0 && !failuresByUrl.has(url)) {
      failuresByUrl.set(url, {
        url,
        categories: lhr.categories,
        audits,
      })
    }
  }

  return Array.from(failuresByUrl.values())
}

// ============================================================================
// Environment Validation
// ============================================================================

/**
 * Validate environment and preconditions before running.
 * Throws descriptive errors if environment is not ready.
 */
function validateEnvironment(): void {
  if (!existsSync(LHCI_DIR)) {
    throw new Error(
      `Lighthouse reports directory not found: ${LHCI_DIR}\n` +
        `This script runs automatically after 'lhci autorun' fails.\n` +
        `If running manually: npm run lighthouse`
    )
  }

  const reportFiles = readdirSync(LHCI_DIR).filter(f => f.startsWith('lhr-') && f.endsWith('.json'))

  if (reportFiles.length === 0) {
    throw new Error(
      `No Lighthouse report files found in ${LHCI_DIR}\n` + `Expected files matching pattern: lhr-*.json`
    )
  }
}

// ============================================================================
// Main Entry Point
// ============================================================================

function main() {
  try {
    validateEnvironment()

    const failures = loadAllFailures()

    if (failures.length === 0) {
      console.log('✓ No audit failures found!')
      return
    }

    console.log('\n=== Lighthouse Audit Failures ===\n')

    for (const pageFailures of failures) {
      console.log(formatPageFailures(pageFailures))
    }

    console.log('\n')
  } catch (error) {
    console.error('❌ Failed to parse Lighthouse results:', error)
    process.exit(1)
  }
}

main()
