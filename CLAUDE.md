# michaeluloth.com - Claude Code Rules

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

## Publishing and Deploying

Blog posts live in Notion, not in this repo. `next.config.ts` sets `output: 'export'`, so the
site is a static build and posts are fetched at build time. A new post reaches the site only
after a rebuild and redeploy, even though nothing here changed.

### What makes a Notion post publishable

`io/notion/getPosts.ts` queries the writing data source with a filter requiring all three of:

- `Destination` (multi-select) contains `blog`
- `Status` equals `Published`
- `First published` holds a date on or before now

`io/notion/schemas/post.ts` then requires non-empty `Slug`, `Title`, and `Description`. The
`Featured image`, `Feed ID`, and `Featured order` properties may be blank.

A post that passes the filter but fails that validation aborts the build rather than being
skipped: a malformed property throws `INVALID_POST_PROPERTIES_ERROR`, and a property that parses
but violates the post schema throws `INVALID_POST_ERROR`. An empty `Description` on one post
takes down the whole site build, so check these properties before deploying.

### Deploy commands

`npm run deploy:ci` is the command to use for a new Notion post. It dispatches the Check workflow
against `origin/main`, so the full pipeline runs and the metadata and Lighthouse jobs validate
the new content before it ships. It deploys what GitHub has rather than what is on disk, and
warns when the two differ. It requires `gh` to be installed and authenticated, prints the URL of
the run it starts, and Pushover reports the result when the run finishes.

`npm run deploy:production` builds locally and uploads straight to Cloudflare Pages, skipping the
metadata and Lighthouse checks. Reach for it when CI is unavailable. It refuses to run unless the
working tree is clean and the current branch is `main`.

`npm run deploy:preview` builds locally and uploads without pinning `--branch=main`, so Cloudflare
files the deployment under the current git branch. On any branch other than `main` that is a
preview deployment.

### Confirming a post is live

The deploy is finished when the Check run's Deploy job succeeds, which Pushover reports. Then
confirm the post itself:

- `https://michaeluloth.com/<slug>/` renders it. Posts sit at the top level rather than under
  `/blog/`, and `trailingSlash: true` makes the trailing slash part of the URL.
- `https://michaeluloth.com/blog/` and `https://michaeluloth.com/rss.xml` both list it.

`app/rss.xml/route.ts` links each feed entry to the post's `Feed ID` when that property is set and
to `<site>/<slug>/` otherwise, so a post carrying a stale `Feed ID` renders correctly on the site
while sending subscribers somewhere else.

### Notion caching

`io/cache/filesystem.ts` reads and writes only when `NODE_ENV === 'development'`. Production
builds always fetch Notion fresh, so no cache clearing is needed before a deploy. Run
`npm run cache:clear:notion` to pick up new Notion content in `npm run dev`.
