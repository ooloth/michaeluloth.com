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

/**
 * Schema for Notion post page metadata.
 * Extends base PageMetadataSchema with required last_edited_time for posts.
 */
export const PostPageMetadataSchema = z.object({
  id: z.string(),
  properties: z.unknown(),
  last_edited_time: z.string(),
})

export type PostPageMetadata = z.infer<typeof PostPageMetadataSchema>
