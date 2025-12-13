# Build Integration Tests Plan

**Date**: 2025-12-13
**Status**: Planning
**Branch**: To be implemented after `fill-testing-gaps` is merged

## Overview

This plan adds **build integration tests** that verify the actual Next.js build process succeeds. Unlike unit tests that mock dependencies, these tests run `next build` and validate the output.

## Goals

1. **Verify builds succeed**: Ensure `next build` completes without errors
2. **Catch build-time failures**: Detect issues that only appear during actual builds
3. **Validate static generation**: Confirm all expected pages are pre-rendered
4. **Monitor build warnings**: Ensure no unexpected warnings appear
5. **Test cache invalidation**: Verify `nocache=true` query param works

## Non-Goals

- Not replacing unit tests (those stay - faster feedback loop)
- Not testing runtime behavior (that's E2E testing)
- Not running on every commit (too slow - run in CI only)

## Implementation Strategy

### 1. Test Framework Setup

**File**: `tests/build/setup.ts`

Create a test harness that:
- Runs `next build` in a child process
- Captures stdout/stderr
- Parses build output for errors/warnings
- Validates `.next` directory structure
- Cleans up after tests

**Dependencies needed**:
```json
{
  "execa": "^8.0.0" // For running shell commands with proper stdio handling
}
```

### 2. Core Build Tests

**File**: `tests/build/next-build.test.ts`

#### Test Cases:

1. **Build succeeds without errors**
   - Run `next build`
   - Assert exit code is 0
   - Assert no error messages in output

2. **All expected pages are generated**
   - Verify `.next/server/app/(prose)/[slug]/` contains HTML files
   - Verify `.next/server/app/(prose)/blog.html` exists
   - Verify `.next/server/app/likes.html` exists
   - Count matches expected number of blog posts

3. **Static params generate all routes**
   - Parse build output for "generating static pages"
   - Verify count matches number of posts
   - Verify specific known slugs appear

4. **No unexpected build warnings**
   - Parse stdout for warning patterns
   - Allow known/acceptable warnings (if any)
   - Fail on unexpected warnings (e.g., missing env vars, deprecated APIs)

5. **Build artifacts are valid**
   - Verify `.next/BUILD_ID` exists and is non-empty
   - Verify `.next/required-server-files.json` exists
   - Verify client bundles exist in `.next/static/`

### 3. Cache Invalidation Tests

**File**: `tests/build/cache-behavior.test.ts`

#### Test Cases:

1. **Cache is used in development**
   - Mock Notion API responses
   - Run two builds
   - Verify second build uses cached data (faster)
   - Verify cache files exist in `.local-cache/`

2. **Cache is bypassed in production**
   - Set NODE_ENV=production
   - Verify no cache reads/writes
   - Verify `.local-cache/` is not used

3. **skipCache query param works**
   - Test would need to verify builds with different cache behavior
   - (This might be more of a runtime test - consider scope)

### 4. Error Scenario Tests

**File**: `tests/build/error-handling.test.ts`

#### Test Cases:

1. **Build fails when API returns error**
   - Mock Notion API to return 500
   - Run build
   - Assert build fails with helpful error message
   - Verify error shows which API failed

2. **Build fails when validation fails**
   - Mock Notion API to return invalid data
   - Run build
   - Assert build fails with validation error
   - Verify error shows which field failed validation

3. **Build fails when env vars missing**
   - Unset required env var
   - Run build
   - Assert build fails with clear error about missing env var

4. **Build fails when getPost returns null for invalid slug**
   - This should trigger `notFound()` which is expected
   - Build should still succeed
   - (This validates the happy path of error handling)

### 5. Performance Monitoring (Optional)

**File**: `tests/build/performance.test.ts`

#### Test Cases:

1. **Build completes within reasonable time**
   - Run build with timer
   - Assert completes within threshold (e.g., 2 minutes)
   - Track build time in CI for regression detection

2. **Parallel API calls work efficiently**
   - Monitor that likes page fetches all 5 APIs in parallel
   - Verify build time reflects parallelization

### 6. CI Integration

**File**: `.github/workflows/build-tests.yml`

```yaml
name: Build Integration Tests

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  build-test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run unit tests
        run: npm test -- --run

      - name: Run build integration tests
        run: npm run test:build
        env:
          NODE_ENV: production
          NOTION_TOKEN: ${{ secrets.NOTION_TOKEN }}
          NOTION_BLOG_DATABASE_ID: ${{ secrets.NOTION_BLOG_DATABASE_ID }}
          # ... all required env vars

      - name: Upload build artifacts on failure
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: build-output
          path: .next/
```

**Note**: This requires secrets to be set in GitHub repository settings.

## Test Isolation Strategy

### Challenge: External API Dependencies

Build tests call real APIs (Notion, TMDB, iTunes). Options:

**Option A: Use Real APIs (Recommended for first iteration)**
- Pros: Tests real integration, catches API changes
- Cons: Slower, requires API credentials in CI, subject to rate limits
- Mitigation: Run less frequently (only on PR/main), use caching where possible

**Option B: Mock at Network Level**
- Use MSW (Mock Service Worker) or nock to intercept HTTP requests
- Pros: Fast, deterministic, no API credentials needed
- Cons: Doesn't catch API changes, more setup overhead

**Option C: Hybrid Approach**
- Unit tests: Mock everything (fast feedback)
- Build tests: Real APIs (comprehensive validation)
- Best of both worlds

**Recommendation**: Start with Option A for simplicity. If builds become too slow or flaky, move to Option C.

## Directory Structure

```
tests/
├── build/
│   ├── setup.ts              # Build harness utilities
│   ├── next-build.test.ts    # Core build tests
│   ├── cache-behavior.test.ts
│   ├── error-handling.test.ts
│   └── performance.test.ts   # Optional
├── fixtures/                  # Mock data if needed
└── README.md                  # How to run build tests
```

## NPM Scripts

Add to `package.json`:

```json
{
  "scripts": {
    "test": "vitest",
    "test:unit": "vitest --run",
    "test:build": "NODE_ENV=test vitest --run tests/build",
    "test:all": "npm run test:unit && npm run test:build"
  }
}
```

## Implementation Order

1. **Phase 1: Basic Setup** (1-2 hours)
   - Install dependencies (execa)
   - Create test harness in `tests/build/setup.ts`
   - Write first test: "build succeeds without errors"
   - Verify it runs and passes

2. **Phase 2: Core Validation** (2-3 hours)
   - Test all expected pages are generated
   - Test static params generate all routes
   - Test no unexpected warnings
   - Test build artifacts are valid

3. **Phase 3: Error Scenarios** (2-3 hours)
   - Test build fails when API returns error
   - Test build fails when validation fails
   - Test build fails when env vars missing

4. **Phase 4: CI Integration** (1 hour)
   - Create GitHub workflow
   - Add secrets to repository
   - Verify workflow runs on PR

5. **Phase 5: Polish** (1 hour)
   - Add README documentation
   - Update analysis document
   - Add performance monitoring (optional)

**Total estimated effort**: 6-10 hours

## Success Criteria

- [ ] Can run `npm run test:build` locally
- [ ] Build tests pass with real API calls
- [ ] Build tests fail appropriately when errors injected
- [ ] CI runs build tests on every PR
- [ ] Build test failures provide actionable error messages
- [ ] Documentation explains how to run and interpret build tests

## Edge Cases to Consider

1. **Rate Limiting**: TMDB/iTunes APIs may rate limit in CI
   - Mitigation: Add retry logic, use caching, or mock these specific APIs

2. **Notion API Pagination**: If blog grows beyond 100 posts
   - Mitigation: Already handled in code, but verify build doesn't timeout

3. **Build Output Size**: Large blogs may produce many files
   - Mitigation: Add cleanup step to CI, monitor disk usage

4. **Flaky Tests**: Network issues may cause intermittent failures
   - Mitigation: Add retries, better error messages, consider mocking flaky APIs

5. **Parallel Builds**: Multiple builds running simultaneously may conflict
   - Mitigation: Use separate output directories per test run

## Future Enhancements

After initial implementation, consider:

1. **Visual Regression Tests**: Screenshot generated pages, compare to baseline
2. **Performance Benchmarks**: Track build time trends over time
3. **Bundle Size Monitoring**: Alert if bundle size increases significantly
4. **Lighthouse Scores**: Run Lighthouse on generated pages
5. **Link Checking**: Verify all internal links resolve correctly

## References

- [Next.js Build Output](https://nextjs.org/docs/app/api-reference/next-config-js/output)
- [Vitest Node Test Examples](https://vitest.dev/guide/environment.html#test-environment)
- [GitHub Actions - Artifacts](https://docs.github.com/en/actions/using-workflows/storing-workflow-data-as-artifacts)
