import { type z } from 'zod'
import { getCached, setCached } from './filesystem'

/**
 * Cache adapter interface for dependency injection.
 * Allows swapping cache implementations (filesystem, Redis, memory, etc.)
 * and easier testing without module mocking.
 *
 * ## Cache Philosophy
 * Cache is a local dev convenience only. Data is validated when fetched from source
 * (before caching). If cache becomes corrupted, simply clear it and refetch.
 * No validation on cache reads - trust what was written.
 *
 * @example
 * ```typescript
 * const cached = await cache.get<PostListItem[]>('posts-list', 'notion')
 * ```
 */
export interface CacheAdapter {
  /**
   * Get a value from the cache.
   *
   * @param key - The cache key
   * @param namespace - Optional namespace/directory for the cache
   * @returns The cached value or null if not found/expired
   *
   * @example
   * ```typescript
   * const post = await cache.get<Post>('post-123', 'notion')
   * ```
   */
  get<T>(key: string, namespace?: string): Promise<T | null>

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
