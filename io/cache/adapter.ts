import { type z } from 'zod'
import { getCached, setCached } from './filesystem'

/**
 * Cache adapter interface for dependency injection.
 * Allows swapping cache implementations (filesystem, Redis, memory, etc.)
 * and easier testing without module mocking.
 *
 * ## Validation Pattern
 * Always provide a Zod schema when reading from cache to ensure data integrity:
 *
 * @example
 * ```typescript
 * // ✅ Good - validates cached data
 * const cached = await cache.get<PostListItem[]>(
 *   'posts-list',
 *   'notion',
 *   z.array(PostListItemSchema)
 * )
 *
 * // ⚠️ Avoid - no validation, unsafe
 * const cached = await cache.get<PostListItem[]>('posts-list', 'notion')
 * ```
 *
 * Benefits of validation:
 * - Detects corrupted cache files
 * - Handles schema evolution gracefully (cache miss on invalid data)
 * - Prevents runtime errors from malformed data
 */
export interface CacheAdapter {
  /**
   * Get a value from the cache.
   *
   * @param key - The cache key
   * @param namespace - Optional namespace/directory for the cache
   * @param schema - Zod schema to validate cached data (strongly recommended)
   * @returns The cached value or null if not found/expired/invalid
   *
   * @example
   * ```typescript
   * const post = await cache.get('post-123', 'notion', PostSchema)
   * ```
   */
  get<T>(key: string, namespace?: string, schema?: z.ZodSchema<T>): Promise<T | null>

  /**
   * Set a value in the cache.
   *
   * @param key - The cache key
   * @param value - The value to cache (must be JSON-serializable)
   * @param namespace - Optional namespace/directory for the cache
   */
  set<T>(key: string, value: T, namespace?: string): Promise<void>
}

/**
 * Default filesystem cache implementation.
 * Uses the existing getCached/setCached utilities.
 */
export const filesystemCache: CacheAdapter = {
  get: getCached,
  set: setCached,
}
