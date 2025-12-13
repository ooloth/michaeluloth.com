# Zod Validation for Notion Data Fetching

## Context

The `/likes` page (PR #6) established a pattern for parsing external data at I/O boundaries using Zod:

- Parse raw API responses with Zod schemas
- Transform to convenient internal domain objects
- Infer TypeScript types from schemas (single source of truth)
- Handle validation errors gracefully
- Separate pure transformation functions from I/O

This pattern is already applied to:

- ✅ `lib/notion/getMediaItems.ts` - Media items (books/albums/podcasts)
- ✅ `lib/tmdb/fetchTmdbList.ts` - TMDB TV shows and movies
- ✅ `lib/itunes/fetchItunesItems.ts` - iTunes metadata enrichment

## Goal

Apply this pattern to **all remaining Notion data fetching** to:

1. Make no assumptions about data from the Notion SDK
2. Parse and validate at the API boundary
3. Output type-safe internal domain objects with ergonomic, flat APIs

## Design Principles

- **Domain-first naming**: Use `Post`, `PostListItem` — not `NotionPost`
- **Ergonomic APIs**: Flatten nested Notion structures at the boundary
  - Before: `getPropertyValue(post.properties, 'Title')`
  - After: `post.title`
- **Validation over reshaping for blocks**: Blocks are complex; validate structure but keep Notion shape for now

## Scope

### In Scope

1. **`lib/notion/getPosts.ts`** (Priority 1)
   - Currently: Returns `any[]`, callsites use `getPropertyValue()` repeatedly
   - Output: `PostListItem[]` with flat, ergonomic API
   - Callsites: `app/(prose)/blog/page.tsx`, `app/(prose)/[slug]/page.tsx`, `getPost.ts`

2. **`lib/notion/getPost.ts`** (Priority 2)
   - Currently: Returns `any` with `prevPost`/`nextPost`
   - Output: `Post | null` with flat metadata + validated blocks
   - Callsites: `app/(prose)/[slug]/page.tsx`

3. **`lib/notion/getBlockChildren.ts`** (Priority 3)
   - Currently: Returns raw blocks from Notion SDK
   - Output: Validated `Block[]` (keep Notion shape, just validate structure)
   - Note: Block types already defined in `lib/notion/types.ts` using SDK types

### Out of Scope (for now)

- `lib/notion/getPropertyValue.ts` - Will become internal to transform functions, not used by callsites
- `lib/notion/getPage.ts` - Not currently used in app
- `lib/cloudinary/fetchCloudinaryImageMetadata.ts` - Different API, separate task
- Block reshaping - Validate structure only; keep Notion shape for renderers

## Implementation Plan

### Step 1: Create `lib/notion/schemas/post.ts`

Define domain types with flat, ergonomic APIs:

```typescript
import { z } from 'zod'

export const PostListItemSchema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  firstPublished: z.string().regex(/^\d{4}-\d{2}-\d{2}/),
  featuredImage: z.url().optional(),
})

export type PostListItem = z.infer<typeof PostListItemSchema>

export const PostSchema = PostListItemSchema.extend({
  lastEditedTime: z.string(),
  blocks: z.array(z.unknown()), // Validated separately
  prevPost: PostListItemSchema.nullable(),
  nextPost: PostListItemSchema.nullable(),
})

export type Post = z.infer<typeof PostSchema>
```

### Step 2: Refactor `getPosts.ts`

1. Add `transformNotionPagesToPostListItems()` pure function
2. Use `getPropertyValue` internally to extract, then validate with schema
3. Return `PostListItem[]` instead of `any[]`
4. Follow pattern from `getMediaItems.ts`

### Step 3: Update `getPosts` callsites

- `app/(prose)/blog/page.tsx` - Remove `getPropertyValue` calls, use `post.title` etc.
- `app/(prose)/[slug]/page.tsx` (`generateStaticParams`) - Use `post.slug` directly

### Step 4: Refactor `getPost.ts`

1. Add `transformNotionPageToPost()` pure function
2. Reuse `PostListItem` for `prevPost`/`nextPost`
3. Return `Post | null` instead of `any`

### Step 5: Update `getPost` callsites

- `app/(prose)/[slug]/page.tsx` - Pass typed `Post` to components
- `app/(prose)/[slug]/ui/post.tsx` - Change props from `any` to `Post`

### Step 6: Validate blocks in `getBlockChildren.ts`

- Minimal validation: ensure array of objects with `id` and `type`
- Keep Notion shape for renderers
- Type as `Block[]` using existing SDK types from `types.ts`

## Files to Modify

| File                             | Change                                 |
| -------------------------------- | -------------------------------------- |
| `lib/notion/schemas/post.ts`     | **New** - Domain schemas               |
| `lib/notion/getPosts.ts`         | Add transform, return `PostListItem[]` |
| `lib/notion/getPost.ts`          | Add transform, return `Post \| null`   |
| `lib/notion/getBlockChildren.ts` | Add minimal validation                 |
| `app/(prose)/blog/page.tsx`      | Use flat `post.title` API              |
| `app/(prose)/[slug]/page.tsx`    | Use typed `Post`                       |
| `app/(prose)/[slug]/ui/post.tsx` | Type props as `Post`                   |

## Testing

Add tests for transform functions (follow `getMediaItems.test.ts` pattern):

- Valid Notion page → correct domain object
- Missing required field → filtered out with log
- Optional fields → handled correctly

## Next Priority

After Notion: `lib/cloudinary/fetchCloudinaryImageMetadata.ts` (has TODO comment)
