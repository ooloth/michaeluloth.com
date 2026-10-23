import { vi } from 'vitest'
import '@testing-library/jest-dom/vitest'

// Make vi globally available
;(global as unknown as { vi: typeof vi }).vi = vi

// Mock environment variables globally for all tests
vi.mock('@/io/env/tmdb', () => ({
  tmdbEnv: {
    TMDB_TV_LIST_ID: 'test-tv-list',
    TMDB_MOVIE_LIST_ID: 'test-movie-list',
    TMDB_READ_ACCESS_TOKEN: 'test-tmdb-token',
  },
}))

vi.mock('@/io/env/notion', () => ({
  notionEnv: {
    NOTION_ACCESS_TOKEN: 'test-notion-token',
    NOTION_DATA_SOURCE_ID_BOOKS: 'test-books-id',
    NOTION_DATA_SOURCE_ID_ALBUMS: 'test-albums-id',
    NOTION_DATA_SOURCE_ID_PODCASTS: 'test-podcasts-id',
    NOTION_DATA_SOURCE_ID_WRITING: 'test-writing-id',
  },
}))

vi.mock('@/io/env/cloudinary', () => ({
  cloudinaryEnv: {
    CLOUDINARY_CLOUD_NAME: 'test-cloud',
    CLOUDINARY_API_KEY: 'test-key',
    CLOUDINARY_API_SECRET: 'test-secret',
  },
}))

vi.mock('@/io/env/pushover', () => ({
  pushoverEnv: {
    PUSHOVER_API_TOKEN: 'test-pushover-token',
    PUSHOVER_USER_KEY: 'test-pushover-user',
  },
}))
