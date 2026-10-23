import { z } from 'zod'

const tmdbEnvSchema = z.object({
  TMDB_TV_LIST_ID: z.string().min(1, 'TMDB_TV_LIST_ID is required'),
  TMDB_MOVIE_LIST_ID: z.string().min(1, 'TMDB_MOVIE_LIST_ID is required'),
  TMDB_READ_ACCESS_TOKEN: z.string().min(1, 'TMDB_READ_ACCESS_TOKEN is required'),
})

export const tmdbEnv = tmdbEnvSchema.parse(process.env)
