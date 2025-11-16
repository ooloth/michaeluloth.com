# Cloudinary Rate Limiting Fix: Local Filesystem Cache

## Problem

During local development, Next.js 16 is making repeated Cloudinary API calls for the same images, hitting rate limits within 5-10 minutes of normal dev work. The `Image` component calls the `fetchCloudinaryImageMetadata` function, but it doesn't cache its responses.

## Current Implementation

- `ui/image.tsx`: calls `lib/cloudinary/fetchCloudinaryImageMetadata.ts`
- `lib/cloudinary/fetchCloudinaryImageMetadata.ts`: Makes API calls via `cloudinary.api.resource()` with no caching
- Each page refresh triggers fresh API calls for all images

## Solution: Filesystem Cache for Dev Mode

Implement a filesystem cache that:

1. Stores Cloudinary API responses in `.local-cache/cloudinary/` directory
2. Keys cache files by public ID (e.g., `{publicId}.json`)
3. Checks cache before making API calls
4. Only enabled in development mode (check `process.env.NODE_ENV === 'development'`)
5. Gracefully handles cache read/write errors (logs warning, continues with API call)

## Implementation Plan

### 1. Create Cache Utility (`lib/cache/filesystem.ts`)

```typescript
/**
 * Simple filesystem cache for development mode.
 * Stores JSON responses keyed by a cache key.
 */
export async function getCached<T>(key: string, dir: string = '.local-cache'): Promise<T | null>
export async function setCached<T>(key: string, data: T, dir: string = '.local-cache'): Promise<void>
```

Features:

- Sanitize cache keys (replace `/` with `_`, handle special chars)
- Store in `.local-cache/{dir}/{key}.json`
- Return `null` on cache miss or read errors
- Log cache hits/misses for visibility
- Only operate in development mode

### 2. Update `fetchCloudinaryImageMetadata`

Add caching layer:

```typescript
const cacheKey = publicId.replace(/\//g, '_')
const cached = await getCached<CloudinaryImageMetadata>(cacheKey, 'cloudinary')
if (cached) {
  console.log(`✅ Cache hit for "${publicId}"`)
  return cached
}

// ... existing API call ...

// Cache the result before returning
await setCached(cacheKey, metadata, 'cloudinary')
```

### 3. Update `.gitignore`

Add `.local-cache/` to prevent committing cached responses.

### 4. Add Cache Bust Mechanism (Optional)

Consider adding a way to invalidate cache:

- npm script: `"cache:clear": "rm -rf .local-cache"`
- Or TTL-based invalidation (check file mtime)

## Why This Approach?

1. **Reliable in dev mode**: Filesystem cache survives hot reloads and Next.js dev server restarts
2. **Simple**: No external dependencies, just Node.js `fs` module
3. **Safe**: Errors gracefully fall back to API calls
4. **Visible**: Console logs show cache hits/misses
5. **Fast**: Local disk reads are near-instant vs API calls
6. **Production-safe**: Only runs in development mode

## Alternative Approaches Considered

### Option A: Add `'use cache'` to `fetchCloudinaryImageMetadata`

- **Pro**: Uses Next.js 16 built-in caching
- **Con**: Dev mode often bypasses/invalidates cache during hot reloads
- **Con**: Less control over cache behavior

### Option B: Use Next.js `unstable_cache`

- **Pro**: More explicit than `'use cache'` directive
- **Con**: Still subject to Next.js dev mode cache invalidation
- **Con**: API is marked as unstable

### Option C: Redis or in-memory cache

- **Pro**: Very fast
- **Con**: Overkill for dev mode, requires additional setup
- **Con**: In-memory cache lost on server restart

## Files to Modify

1. **Create**: `lib/cache/filesystem.ts` - New cache utility
2. **Modify**: `lib/cloudinary/fetchCloudinaryImageMetadata.ts` - Add cache layer
3. **Modify**: `.gitignore` - Add `.local-cache/`

## Success Criteria

- [ ] Cloudinary API calls only made once per unique image during dev session
- [ ] Cache survives hot reloads and page refreshes
- [ ] No rate limiting errors during normal dev work
- [ ] Cache hits logged to console for visibility
- [ ] Cache directory excluded from git
- [ ] Errors gracefully fall back to API calls
- [ ] Only active in development mode

## Notes for Implementation Agent

- Use `fs/promises` for async file operations
- Ensure directory exists before writing (use `mkdir -p` equivalent)
- Sanitize public IDs properly (they can contain `/` and other special chars)
- Keep error handling simple: log and continue
- Consider adding timestamp to cached data for future TTL support
