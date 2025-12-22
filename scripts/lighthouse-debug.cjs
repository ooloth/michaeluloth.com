#!/usr/bin/env node
/**
 * Parse Lighthouse CI results and show detailed failure information.
 * Run automatically after lighthouse failures to help debug what went wrong.
 */

const fs = require('fs');
const path = require('path');

const LHCI_DIR = path.join(process.cwd(), '.lighthouseci');

function getLHRFiles() {
  if (!fs.existsSync(LHCI_DIR)) return [];
  return fs.readdirSync(LHCI_DIR)
    .filter(f => f.startsWith('lhr-') && f.endsWith('.json'))
    .map(f => path.join(LHCI_DIR, f));
}

function getFailingAudits(lhr) {
  const failing = [];

  for (const [id, audit] of Object.entries(lhr.audits)) {
    if (audit.score !== null && audit.score < 1) {
      const items = audit.details?.items || [];
      failing.push({
        id,
        title: audit.title,
        score: audit.score,
        description: audit.description,
        items: items.map(item => ({
          selector: item.node?.selector,
          snippet: item.node?.snippet,
          explanation: item.node?.explanation,
        })).filter(item => item.selector || item.snippet),
      });
    }
  }

  return failing;
}

function main() {
  const lhrFiles = getLHRFiles();
  if (!lhrFiles.length) {
    console.error('No Lighthouse reports found in .lighthouseci/');
    process.exit(1);
  }

  // Group failures by URL
  const failuresByUrl = new Map();

  for (const file of lhrFiles) {
    const lhr = JSON.parse(fs.readFileSync(file, 'utf-8'));
    const url = lhr.finalUrl || lhr.requestedUrl;
    const failing = getFailingAudits(lhr);

    if (failing.length > 0) {
      if (!failuresByUrl.has(url)) {
        failuresByUrl.set(url, {
          categories: lhr.categories,
          audits: failing,
        });
      }
    }
  }

  if (failuresByUrl.size === 0) {
    console.log('✓ No audit failures found!');
    return;
  }

  console.log('\n=== Lighthouse Audit Failures ===\n');

  for (const [url, {categories, audits}] of failuresByUrl) {
    console.log(`\n${url}`);
    console.log(`  Accessibility: ${(categories.accessibility.score * 100).toFixed(0)}%`);
    console.log(`  Performance:   ${(categories.performance.score * 100).toFixed(0)}%`);
    console.log(`  SEO:           ${(categories.seo.score * 100).toFixed(0)}%`);
    console.log(`  Best Practices: ${(categories['best-practices'].score * 100).toFixed(0)}%`);

    console.log(`\n  Failing audits (${audits.length}):`);
    for (const audit of audits) {
      console.log(`\n    ✗ ${audit.title} (score: ${audit.score})`);
      console.log(`      ${audit.description}`);

      if (audit.items.length > 0) {
        console.log(`\n      Failing elements (${audit.items.length}):`);
        for (const item of audit.items) {
          if (item.selector) {
            console.log(`        • ${item.selector}`);
          }
          if (item.snippet) {
            // Truncate long snippets
            const truncated = item.snippet.length > 100
              ? item.snippet.slice(0, 100) + '...'
              : item.snippet;
            console.log(`          ${truncated}`);
          }
        }
      }
    }
  }

  console.log('\n');
}

main();
