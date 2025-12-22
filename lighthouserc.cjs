module.exports = {
  ci: {
    collect: {
      staticDistDir: './out',
    },
    assert: {
      assertions: {
        // Category-level assertions automatically include all current Lighthouse audits.
        // When Lighthouse adds new audits, they're included in the category score.
        // No need to hardcode individual audits - use scripts/lighthouse-debug.js for details.
        'categories:accessibility': ['error', { minScore: 1.0 }],
        'categories:best-practices': ['error', { minScore: 1.0 }],
        'categories:performance': ['error', { minScore: 0.95 }],
        'categories:seo': ['error', { minScore: 1.0 }],
      },
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
      ],
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
}
