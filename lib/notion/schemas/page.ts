import { z } from 'zod'

/**
 * Schema for Notion page metadata (fields outside of properties object).
 * Validates the basic structure of a Notion page before accessing properties.
 */
export const PageMetadataSchema = z.object({
  id: z.string(),
  properties: z.unknown(),
  last_edited_time: z.string().optional(),
})

export type PageMetadata = z.infer<typeof PageMetadataSchema>
