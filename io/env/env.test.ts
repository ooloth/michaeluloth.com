import { beforeEach, describe, expect, it, vi } from 'vitest'

// Unmock the env module so we can test the actual validation logic
vi.doUnmock('@/lib/env/env')

describe('env', () => {
  // Valid environment variables for testing
  const validEnv = {
    TMDB_TV_LIST_ID: 'tv-list-123',
    TMDB_MOVIE_LIST_ID: 'movie-list-456',
    TMDB_READ_ACCESS_TOKEN: 'tmdb-token-xyz',
    NOTION_ACCESS_TOKEN: 'notion-token-abc',
    NOTION_DATA_SOURCE_ID_BOOKS: 'books-db-id',
    NOTION_DATA_SOURCE_ID_ALBUMS: 'albums-db-id',
    NOTION_DATA_SOURCE_ID_PODCASTS: 'podcasts-db-id',
    NOTION_DATA_SOURCE_ID_WRITING: 'writing-db-id',
    CLOUDINARY_CLOUD_NAME: 'my-cloud',
    CLOUDINARY_API_KEY: 'cloudinary-key',
    CLOUDINARY_API_SECRET: 'cloudinary-secret',
  }

  beforeEach(() => {
    // Reset modules to allow re-importing with different env vars
    vi.resetModules()
    vi.unstubAllEnvs()
    // Ensure the env module is unmocked for each test
    vi.doUnmock('@/lib/env/env')
  })

  describe('success cases', () => {
    it('validates and exports env when all required variables are present', async () => {
      // Stub all required env vars
      Object.entries(validEnv).forEach(([key, value]) => {
        vi.stubEnv(key, value)
      })

      const { env } = await import('./env')

      expect(env).toEqual(validEnv)
    })

    it('includes all TMDB environment variables', async () => {
      Object.entries(validEnv).forEach(([key, value]) => {
        vi.stubEnv(key, value)
      })

      const { env } = await import('./env')

      expect(env.TMDB_TV_LIST_ID).toBe('tv-list-123')
      expect(env.TMDB_MOVIE_LIST_ID).toBe('movie-list-456')
      expect(env.TMDB_READ_ACCESS_TOKEN).toBe('tmdb-token-xyz')
    })

    it('includes all Notion environment variables', async () => {
      Object.entries(validEnv).forEach(([key, value]) => {
        vi.stubEnv(key, value)
      })

      const { env } = await import('./env')

      expect(env.NOTION_ACCESS_TOKEN).toBe('notion-token-abc')
      expect(env.NOTION_DATA_SOURCE_ID_BOOKS).toBe('books-db-id')
      expect(env.NOTION_DATA_SOURCE_ID_ALBUMS).toBe('albums-db-id')
      expect(env.NOTION_DATA_SOURCE_ID_PODCASTS).toBe('podcasts-db-id')
      expect(env.NOTION_DATA_SOURCE_ID_WRITING).toBe('writing-db-id')
    })

    it('includes all Cloudinary environment variables', async () => {
      Object.entries(validEnv).forEach(([key, value]) => {
        vi.stubEnv(key, value)
      })

      const { env } = await import('./env')

      expect(env.CLOUDINARY_CLOUD_NAME).toBe('my-cloud')
      expect(env.CLOUDINARY_API_KEY).toBe('cloudinary-key')
      expect(env.CLOUDINARY_API_SECRET).toBe('cloudinary-secret')
    })
  })

  describe('error cases - missing variables', () => {
    it.each([
      'TMDB_TV_LIST_ID',
      'TMDB_MOVIE_LIST_ID',
      'TMDB_READ_ACCESS_TOKEN',
      'NOTION_ACCESS_TOKEN',
      'NOTION_DATA_SOURCE_ID_BOOKS',
      'NOTION_DATA_SOURCE_ID_ALBUMS',
      'NOTION_DATA_SOURCE_ID_PODCASTS',
      'NOTION_DATA_SOURCE_ID_WRITING',
      'CLOUDINARY_CLOUD_NAME',
      'CLOUDINARY_API_KEY',
      'CLOUDINARY_API_SECRET',
    ])('throws when %s is missing', async key => {
      // Stub all env vars except the one being tested
      Object.entries(validEnv).forEach(([envKey, value]) => {
        if (envKey !== key) {
          vi.stubEnv(envKey, value)
        }
      })

      // When a variable is missing (undefined), Zod says "expected string, received undefined"
      await expect(import('./env')).rejects.toThrow()
      await expect(import('./env')).rejects.toThrow(/expected string, received undefined/)
    })
  })

  describe('error cases - empty strings', () => {
    it.each([
      { key: 'TMDB_TV_LIST_ID', message: 'TMDB_TV_LIST_ID is required' },
      { key: 'TMDB_MOVIE_LIST_ID', message: 'TMDB_MOVIE_LIST_ID is required' },
      { key: 'TMDB_READ_ACCESS_TOKEN', message: 'TMDB_READ_ACCESS_TOKEN is required' },
      { key: 'NOTION_ACCESS_TOKEN', message: 'NOTION_ACCESS_TOKEN is required' },
      { key: 'NOTION_DATA_SOURCE_ID_BOOKS', message: 'NOTION_DATA_SOURCE_ID_BOOKS is required' },
      { key: 'NOTION_DATA_SOURCE_ID_ALBUMS', message: 'NOTION_DATA_SOURCE_ID_ALBUMS is required' },
      { key: 'NOTION_DATA_SOURCE_ID_PODCASTS', message: 'NOTION_DATA_SOURCE_ID_PODCASTS is required' },
      { key: 'NOTION_DATA_SOURCE_ID_WRITING', message: 'NOTION_DATA_SOURCE_ID_WRITING is required' },
      { key: 'CLOUDINARY_CLOUD_NAME', message: 'CLOUDINARY_CLOUD_NAME is required' },
      { key: 'CLOUDINARY_API_KEY', message: 'CLOUDINARY_API_KEY is required' },
      { key: 'CLOUDINARY_API_SECRET', message: 'CLOUDINARY_API_SECRET is required' },
    ])('throws when $key is empty string', async ({ key, message }) => {
      // Stub all env vars, but set the tested one to empty string
      Object.entries(validEnv).forEach(([envKey, value]) => {
        vi.stubEnv(envKey, envKey === key ? '' : value)
      })

      await expect(import('./env')).rejects.toThrow(message)
    })
  })

  describe('error cases - validation behavior', () => {
    it('throws ZodError with helpful message structure', async () => {
      // Stub all env vars except one
      Object.entries(validEnv).forEach(([envKey, value]) => {
        if (envKey !== 'TMDB_TV_LIST_ID') {
          vi.stubEnv(envKey, value)
        }
      })

      try {
        await import('./env')
        expect.fail('Should have thrown')
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect((error as Error).message).toContain('TMDB_TV_LIST_ID')
        expect((error as Error).message).toContain('expected string, received undefined')
      }
    })

    it('reports all missing variables at once', async () => {
      // Stub only half of the required vars
      vi.stubEnv('TMDB_TV_LIST_ID', 'tv-list')
      vi.stubEnv('TMDB_MOVIE_LIST_ID', 'movie-list')
      vi.stubEnv('TMDB_READ_ACCESS_TOKEN', 'token')

      try {
        await import('./env')
        expect.fail('Should have thrown')
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        const message = (error as Error).message
        // Should report multiple missing vars
        expect(message).toContain('NOTION_ACCESS_TOKEN')
        expect(message).toContain('CLOUDINARY_CLOUD_NAME')
      }
    })
  })
})
