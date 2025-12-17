import { mkdir, readFile, writeFile } from 'fs/promises'
import { join } from 'path'
import { z } from 'zod'

/**
 * Sanitizes a cache key to be safe for use as a filename.
 * Replaces slashes and other problematic characters with hyphens.
 */
function sanitizeCacheKey(key: string): string {
  return key.replace(/[/\\:*?"<>|]/g, '-')
}

/**
 * Schema for the cache file structure
 */
const CacheFileSchema = z.object({
  cachedAt: z.string(),
  data: z.unknown(),
})

/**
 * Gets cached data from the filesystem.
 * Only operates in development mode.
 *
 * Data is trusted - it was validated when fetched from source (before caching).
 * If cache is corrupted, clear it and refetch.
 *
 * @param key - The cache key (will be sanitized for filesystem use)
 * @param dir - Optional subdirectory within .local-cache (default: 'default')
 * @returns The cached data if found, null otherwise
 */
export async function getCached<T>(key: string, dir: string = 'default'): Promise<T | null> {
  // Only cache in development mode
  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  try {
    const sanitizedKey = sanitizeCacheKey(key)
    const cacheDir = join(process.cwd(), '.local-cache', dir)
    const filePath = join(cacheDir, `${sanitizedKey}.json`)

    const fileContents = await readFile(filePath, 'utf-8')
    const parsed = JSON.parse(fileContents)

    // Validate cache file structure
    const cacheFileResult = CacheFileSchema.safeParse(parsed)
    if (!cacheFileResult.success) {
      console.warn(`⚠️  Invalid cache file structure for ${key}. Clear cache and refetch.`)
      return null
    }

    const { data } = cacheFileResult.data

    console.log(`💾 Cache hit: ${key}`)
    return data as T
  } catch (error) {
    // Expected: ENOENT (cache miss) - stay quiet
    // Unexpected: permission errors, disk issues - log for debugging
    if (error && typeof error === 'object' && 'code' in error && error.code !== 'ENOENT') {
      console.warn(`⚠️  Cache read error for ${key}:`, error)
    }
    return null
  }
}

/**
 * Sets cached data in the filesystem.
 * Only operates in development mode.
 *
 * @param key - The cache key (will be sanitized for filesystem use)
 * @param data - The data to cache (must be JSON-serializable)
 * @param dir - Optional subdirectory within .local-cache (default: 'default')
 */
export async function setCached<T>(key: string, data: T, dir: string = 'default'): Promise<void> {
  // Only cache in development mode
  if (process.env.NODE_ENV !== 'development') {
    return
  }

  try {
    const sanitizedKey = sanitizeCacheKey(key)
    const cacheDir = join(process.cwd(), '.local-cache', dir)
    const filePath = join(cacheDir, `${sanitizedKey}.json`)

    // Ensure directory exists
    await mkdir(cacheDir, { recursive: true })

    // Write cache file with timestamp for potential future TTL support
    const cacheData = {
      cachedAt: new Date().toISOString(),
      data,
    }

    await writeFile(filePath, JSON.stringify(cacheData, null, 2), 'utf-8')
    console.log(`💾 Cached: ${key}`)
  } catch (error) {
    // Log warning but don't throw - caching failures shouldn't break the app
    console.warn(`⚠️  Failed to cache ${key}:`, error)
  }
}
