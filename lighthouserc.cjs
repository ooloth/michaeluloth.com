// URLs are generated dynamically from RSS feed before each run
// See: validation/generate-lighthouse-urls.ts (runs via "prelighthouse" script)
// eslint-disable-next-line @typescript-eslint/no-require-imports -- Lighthouse CI requires CommonJS
const urls = require('./validation/lighthouse-urls.json')

module.exports = {
  ci: {
    collect: {
      staticDistDir: './out',
      url: urls,
    },
    assert: {
      // Category-level assertions automatically include all current Lighthouse audits.
      // When Lighthouse adds new audits, they're included in the category score.
      // No need to hardcode individual audits - use scripts/lighthouse-debug.js for details.
      assertMatrix: [
        {
          // 404 pages should have noindex - this is correct behavior
          // Skip SEO assertions for these routes
          matchingUrlPattern: '.*/(404|_not-found).*',
          assertions: {
            'categories:accessibility': ['error', { minScore: 1.0 }],
            'categories:best-practices': ['error', { minScore: 1.0 }],
            'categories:performance': ['error', { minScore: 0.95 }],
            // SEO assertion intentionally omitted for 404 pages
          },
        },
        {
          // All other routes - full validation including SEO
          // Negative lookahead excludes URLs containing /404 or /_not-found
          matchingUrlPattern: '^((?!/(404|_not-found)).)*$',
          assertions: {
            'categories:accessibility': ['error', { minScore: 1.0 }],
            'categories:best-practices': ['error', { minScore: 1.0 }],
            'categories:performance': ['error', { minScore: 0.95 }],
            'categories:seo': ['error', { minScore: 1.0 }],
          },
        },
      ],
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
}
