# michaeluloth.com - Claude Code Rules

## What this project is

A personal blog and portfolio site built with Next.js, deployed to Cloudflare Pages (not Vercel). Content is authored in Notion and pulled at build time via the Notion API. The architecture treats the data pipeline like a production system: Zod validates every external API response at the boundary, errors are values (Rust-style `Result<T, E>`), and all external calls use exponential backoff retry.

## External integrations

| Integration | Role                                                        |
| ----------- | ----------------------------------------------------------- |
| Notion      | CMS — albums, books, podcasts, writing                      |
| Cloudinary  | Image CDN — responsive srcsets, format/quality optimization |
| TMDB        | Film metadata (movie and TV list data)                      |
| iTunes      | Podcast metadata                                            |

## Local development

```bash
npm run dev   # starts dev server at http://localhost:3000
```

On first run, each page fetch hits the real external APIs and caches the results under `.local-cache/` by namespace. Subsequent requests are served from that persistent on-disk cache until `.local-cache/` is manually cleared. The directory is created automatically on first write — no manual setup needed.

Required env vars (copy `.env.example` to `.env.local` and fill in):

- `NOTION_ACCESS_TOKEN`, `NOTION_DATA_SOURCE_ID_*` (albums, books, podcasts, writing)
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- `TMDB_READ_ACCESS_TOKEN`, `TMDB_MOVIE_LIST_ID`, `TMDB_TV_LIST_ID`
- `PUSHOVER_API_TOKEN`, `PUSHOVER_USER_KEY`

CI/deploy only (not needed for local dev):

- `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN`

## Check commands

```bash
npm run lint        # ESLint
npm run typecheck   # TypeScript
npm run test:ci     # Vitest (all tests, no watch)
```

Run these before committing. To run a single test file: `npx vitest run path/to/file.test.ts`.

## Post-build metadata validation

```bash
npm run build && npm run test:metadata
```

`test:metadata` reads the static HTML from the `out/` build directory and validates OpenGraph tags, image dimensions, alt text, and SEO fields. It must run **after** `npm run build` — running it against a stale or missing build will produce false results.

## Deployment

The site deploys to **Cloudflare Pages** via GitHub Actions. Do not add Vercel config or assume Vercel-specific behaviour (e.g. `vercel.json`, edge runtime defaults).

---

## TypeScript Type Safety

### Never use `any`

**Rule:** Never use `any`, `as any`, or `@typescript-eslint/no-explicit-any` to bypass type errors.

**Why:** Type errors indicate a mismatch between what TypeScript expects and what you're providing. The solution is always to communicate the real type properly, not to suppress the error.

**How to fix type errors properly:**

1. **Understand what TypeScript expects** - Read the error message carefully to understand the expected type
2. **Provide the correct type** - Use proper type annotations, interfaces, or type assertions with the actual type
3. **Use the right syntax** - If a library expects JSX/ReactNode, use JSX syntax (`.tsx` files) instead of plain objects
4. **Import necessary types** - Ensure you have the correct imports (e.g., `React` for JSX)

**Example: Satori type error**

```typescript
// ❌ WRONG - bypassing the type error
const svg = await satori(
  {
    type: 'div',
    props: { /* ... */ }
  } as any,  // Never do this!
  options
)

// ✅ CORRECT - using proper JSX syntax that TypeScript understands
// 1. Rename file from .ts to .tsx
// 2. Import React
import React from 'react'

// 3. Use JSX syntax instead of plain objects
const svg = await satori(
  <div>
    {/* ... */}
  </div>,
  options
)
```

This rule ensures the codebase maintains full type safety and prevents runtime errors that `any` would hide.
