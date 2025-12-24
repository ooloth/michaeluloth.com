import { z } from 'zod'

const envSchema = z.object({
  // TMDB API
  TMDB_TV_LIST_ID: z.string().min(1, 'TMDB_TV_LIST_ID is required'),
  TMDB_MOVIE_LIST_ID: z.string().min(1, 'TMDB_MOVIE_LIST_ID is required'),
  TMDB_READ_ACCESS_TOKEN: z.string().min(1, 'TMDB_READ_ACCESS_TOKEN is required'),

  // Notion API
  NOTION_ACCESS_TOKEN: z.string().min(1, 'NOTION_ACCESS_TOKEN is required'),
  NOTION_DATA_SOURCE_ID_BOOKS: z.string().min(1, 'NOTION_DATA_SOURCE_ID_BOOKS is required'),
  NOTION_DATA_SOURCE_ID_ALBUMS: z.string().min(1, 'NOTION_DATA_SOURCE_ID_ALBUMS is required'),
  NOTION_DATA_SOURCE_ID_PODCASTS: z.string().min(1, 'NOTION_DATA_SOURCE_ID_PODCASTS is required'),
  NOTION_DATA_SOURCE_ID_WRITING: z.string().min(1, 'NOTION_DATA_SOURCE_ID_WRITING is required'),

  // Cloudinary API
  CLOUDINARY_CLOUD_NAME: z.string().min(1, 'CLOUDINARY_CLOUD_NAME is required'),
  CLOUDINARY_API_KEY: z.string().min(1, 'CLOUDINARY_API_KEY is required'),
  CLOUDINARY_API_SECRET: z.string().min(1, 'CLOUDINARY_API_SECRET is required'),

  // Pushover API
  PUSHOVER_API_TOKEN: z.string().min(1, 'PUSHOVER_API_TOKEN is required'),
  PUSHOVER_USER_KEY: z.string().min(1, 'PUSHOVER_USER_KEY is required'),
})

export const env = envSchema.parse(process.env)
