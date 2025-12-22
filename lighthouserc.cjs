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
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
}
