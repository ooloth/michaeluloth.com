import { type z } from 'zod'
import { getCached, setCached } from './filesystem'

/**
 * Cache adapter interface for dependency injection.
 * Allows swapping cache implementations (filesystem, Redis, memory, etc.)
 * and easier testing without module mocking.
 */
export interface CacheAdapter {
  /**
   * Get a value from the cache.
   * @param key - The cache key
   * @param namespace - Optional namespace/directory for the cache
   * @param schema - Optional Zod schema to validate cached data
   * @returns The cached value or null if not found/expired/invalid
   */
  get<T>(key: string, namespace?: string, schema?: z.ZodSchema<T>): Promise<T | null>

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
