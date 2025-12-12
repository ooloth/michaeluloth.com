import { z } from 'zod'
import { type GroupedBlock } from './block'
import {
  createPropertiesSchema,
  RichTextPropertySchema,
  TitlePropertySchema,
  DatePropertySchema,
  FeaturedImagePropertySchema,
} from './properties'

/**
 * Schema for validating and transforming post properties from Notion API.
 * Validates structure and extracts values in one step.
 * Shared by both getPost and getPosts.
 */
export const PostPropertiesSchema = createPropertiesSchema({
  Slug: RichTextPropertySchema,
  Title: TitlePropertySchema,
  Description: RichTextPropertySchema,
  'First published': DatePropertySchema,
  'Featured image': FeaturedImagePropertySchema,
})

// Post list item (used by getPosts and for prev/next navigation)
export const PostListItemSchema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  title: z.string().min(1),
  description: z.string().nullish(),
  featuredImage: z.url().nullish(),
  firstPublished: z.string().regex(/^\d{4}-\d{2}-\d{2}/), // ISO 8601 date or datetime
})

// Infer TypeScript type from Zod schema (single source of truth)
export type PostListItem = z.infer<typeof PostListItemSchema>

// Full post (includes blocks and all metadata)
// Note: blocks are validated in getBlockChildren, not here
export type Post = PostListItem & {
  blocks: GroupedBlock[]
  lastEditedTime: string
  prevPost: PostListItem | null
  nextPost: PostListItem | null
}
