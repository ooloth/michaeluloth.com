import { z } from 'zod'

const notionEnvSchema = z.object({
  NOTION_ACCESS_TOKEN: z.string().min(1, 'NOTION_ACCESS_TOKEN is required'),
  NOTION_DATA_SOURCE_ID_BOOKS: z.string().min(1, 'NOTION_DATA_SOURCE_ID_BOOKS is required'),
  NOTION_DATA_SOURCE_ID_ALBUMS: z.string().min(1, 'NOTION_DATA_SOURCE_ID_ALBUMS is required'),
  NOTION_DATA_SOURCE_ID_PODCASTS: z.string().min(1, 'NOTION_DATA_SOURCE_ID_PODCASTS is required'),
  NOTION_DATA_SOURCE_ID_WRITING: z.string().min(1, 'NOTION_DATA_SOURCE_ID_WRITING is required'),
})

export const notionEnv = notionEnvSchema.parse(process.env)
