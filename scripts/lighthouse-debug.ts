#!/usr/bin/env tsx
/**
 * Parse Lighthouse CI results and show detailed failure information.
 * Run automatically after lighthouse failures to help debug what went wrong.
 */

import { readFileSync, existsSync, readdirSync } from 'fs'
import { join } from 'path'

const LHCI_DIR = join(process.cwd(), '.lighthouseci')

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

function getLHRFiles(): string[] {
  if (!existsSync(LHCI_DIR)) return []
  return readdirSync(LHCI_DIR)
    .filter(f => f.startsWith('lhr-') && f.endsWith('.json'))
    .map(f => join(LHCI_DIR, f))
}

/**
 * Extract searchable attributes from HTML snippet.
 * These are the actual values you can grep for in your React source.
 */
function extractSearchableAttrs(snippet: string): string[] {
  const attrs: string[] = []

  // Extract href (for links)
  const hrefMatch = snippet.match(/href="([^"]+)"/)
  if (hrefMatch) attrs.push(`href="${hrefMatch[1]}"`)

  // Extract src (for images/scripts)
  const srcMatch = snippet.match(/src="([^"]+)"/)
  if (srcMatch) attrs.push(`src="${srcMatch[1]}"`)

  // Extract alt (for images)
  const altMatch = snippet.match(/alt="([^"]+)"/)
  if (altMatch) attrs.push(`alt="${altMatch[1]}"`)

  // Extract aria-label
  const ariaLabelMatch = snippet.match(/aria-label="([^"]+)"/)
  if (ariaLabelMatch) attrs.push(`aria-label="${ariaLabelMatch[1]}"`)

  // Extract id
  const idMatch = snippet.match(/id="([^"]+)"/)
  if (idMatch) attrs.push(`id="${idMatch[1]}"`)

  // Extract data-testid
  const testIdMatch = snippet.match(/data-testid="([^"]+)"/)
  if (testIdMatch) attrs.push(`data-testid="${testIdMatch[1]}"`)

  return attrs
}

function getFailingAudits(lhr: LighthouseResult): FailingAudit[] {
  const failing: FailingAudit[] = []

  for (const [id, audit] of Object.entries(lhr.audits)) {
    if (audit.score !== null && audit.score < 1) {
      const items = audit.details?.items || []
      failing.push({
        id,
        title: audit.title,
        score: audit.score,
        description: audit.description,
        elements: items
          .map(item => ({
            selector: item.node?.selector,
            snippet: item.node?.snippet,
            searchableAttrs: item.node?.snippet ? extractSearchableAttrs(item.node.snippet) : [],
          }))
          .filter(item => item.selector || item.snippet),
      })
    }
  }

  return failing
}

function main() {
  const lhrFiles = getLHRFiles()
  if (!lhrFiles.length) {
    console.error('No Lighthouse reports found in .lighthouseci/')
    process.exit(1)
  }

  // Group failures by URL
  const failuresByUrl = new Map<
    string,
    {
      categories: LighthouseResult['categories']
      audits: FailingAudit[]
    }
  >()

  for (const file of lhrFiles) {
    const lhr: LighthouseResult = JSON.parse(readFileSync(file, 'utf-8'))
    const url = lhr.finalUrl || lhr.requestedUrl || 'unknown'
    const failing = getFailingAudits(lhr)

    if (failing.length > 0) {
      if (!failuresByUrl.has(url)) {
        failuresByUrl.set(url, {
          categories: lhr.categories,
          audits: failing,
        })
      }
    }
  }

  if (failuresByUrl.size === 0) {
    console.log('✓ No audit failures found!')
    return
  }

  console.log('\n=== Lighthouse Audit Failures ===\n')

  for (const [url, { categories, audits }] of failuresByUrl) {
    console.log(`\n${url}`)
    console.log(`  Accessibility: ${(categories.accessibility.score * 100).toFixed(0)}%`)
    console.log(`  Performance:   ${(categories.performance.score * 100).toFixed(0)}%`)
    console.log(`  SEO:           ${(categories.seo.score * 100).toFixed(0)}%`)
    console.log(`  Best Practices: ${(categories['best-practices'].score * 100).toFixed(0)}%`)

    console.log(`\n  Failing audits (${audits.length}):`)
    for (const audit of audits) {
      console.log(`\n    ✗ ${audit.title} (score: ${audit.score})`)
      console.log(`      ${audit.description}`)

      if (audit.elements.length > 0) {
        console.log(`\n      Failing elements (${audit.elements.length}):`)
        for (const element of audit.elements) {
          if (element.searchableAttrs.length > 0) {
            // Show searchable attributes first (what you can grep for)
            console.log(`        GREP FOR: ${element.searchableAttrs.join(' ')}`)
          }
          if (element.selector) {
            console.log(`        CSS: ${element.selector}`)
          }
          if (element.snippet) {
            // Show full snippet for reference (no truncation)
            console.log(`        HTML: ${element.snippet}`)
          }
          console.log('') // Blank line between elements
        }
      }
    }
  }

  console.log('\n')
}

main()
