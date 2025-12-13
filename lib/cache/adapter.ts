import { getCached, setCached } from './filesystem'

/**
 * Cache adapter interface for dependency injection.
 * Allows swapping cache implementations (filesystem, Redis, memory, etc.)
 * and easier testing without module mocking.
 */
export interface CacheAdapter {
  /**
   * Get a value from the cache.
   * @returns The cached value or null if not found/expired
   */
  get<T>(key: string, namespace?: string): Promise<T | null>

  /**
   * Set a value in the cache.
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
