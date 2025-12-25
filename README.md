# michaeluloth.com

Personal site with writing, projects, and media consumption. Built with Next.js, deployed as a static site to Cloudflare Pages.

## Tech Stack

- Next.js 16 (App Router, static export)
- TypeScript + Zod (runtime validation)
- Tailwind CSS 4
- Vitest + Testing Library
- Content from Notion, images from Cloudinary
- CI via GitHub Actions (format, lint, typecheck, test, build, Lighthouse, metadata validation)

## Code Worth Looking At

### Data Pipeline

The interesting bit is how external data gets validated and transformed at the I/O boundary:

- **I/O boundary pattern**: `io/notion/getPosts.ts` - Fetch → validate with Zod → transform to domain types → cache → return Result
- **Schema transformers**: `io/notion/schemas/properties.ts` - Zod schemas that both validate and reshape data
- **Responsive images**: `io/cloudinary/fetchCloudinaryImageMetadata.ts` - Generates 9 srcset sizes with retry logic
- **Environment validation**: `io/env/env.ts` - All env vars validated at startup

### Error Handling

- **Result type**: `utils/errors/result.ts` - Explicit error handling (no try/catch everywhere)
- **Invariants**: `utils/errors/invariant.ts` - Runtime assertions with context
- **Retry logic**: `utils/retry.ts` - Exponential backoff for all external APIs

### Testing

- **Pure function tests**: `io/notion/getPosts.test.ts` - Dependency injection, no mocking needed
- **Component tests**: `ui/link.test.tsx` - Testing Library patterns
- 46 test files, ~70k lines of test code

### CI/CD

- **Pipeline**: `.github/workflows/ci.yml` - Eight stages (format → lint → typecheck → test → build → Lighthouse → metadata → deploy)
- **Metadata validation**: `ci/metadata/validate.ts` - Post-build validation of OG tags, images, SEO
- **Dynamic Lighthouse**: `ci/lighthouse/generate-urls.ts` - Tests actual content from RSS feed

### Frontend

- **Accessibility**: Components tested with Testing Library, semantic HTML throughout
- **Link component**: `ui/link.tsx` - Auto-detects internal/external, adds security attributes
- **Tailwind utilities**: `styles/globals.css` - Custom utilities for consistent design tokens

## Notable Details

- Alt text is enforced (build fails if Cloudinary images missing alt text)
- Lighthouse scores: 100% accessibility, 100% best practices, 100% SEO, 90%+ performance
- Development caching (doesn't hammer Notion API on every page refresh)
- Pushover notifications on CI failures
