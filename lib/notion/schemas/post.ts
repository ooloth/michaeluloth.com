import { z } from 'zod'
import { BlockSchema } from './block'

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
export const PostSchema = PostListItemSchema.extend({
  blocks: z.array(BlockSchema),
  lastEditedTime: z.string(), // ISO 8601 datetime from Notion
  prevPost: PostListItemSchema.nullable(),
  nextPost: PostListItemSchema.nullable(),
})

// Infer TypeScript type from Zod schema (single source of truth)
export type Post = z.infer<typeof PostSchema>
