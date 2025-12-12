import { getCached, setCached } from '@/lib/cache/filesystem'
import notion, { collectPaginatedAPI } from './client'
import { PostListItemSchema, type PostListItem } from './schemas/post'
import {
  createPropertiesSchema,
  RichTextPropertySchema,
  TitlePropertySchema,
  DatePropertySchema,
  FilesPropertySchema,
} from './schemas/properties'
import { logValidationError } from '@/utils/zod'
import { env } from '@/lib/env'

type Options = {
  sortDirection?: 'ascending' | 'descending'
  skipCache?: boolean
}

export const INVALID_POST_ERROR = 'Invalid post data - build aborted'
export const INVALID_POST_PROPERTIES_ERROR = 'Invalid post properties - build aborted'

/**
 * Schema for validating and transforming post properties from Notion API.
 * Validates structure and extracts values in one step.
 */
const PostPropertiesSchema = createPropertiesSchema({
  Slug: RichTextPropertySchema,
  Title: TitlePropertySchema,
  Description: RichTextPropertySchema,
  'First published': DatePropertySchema,
  'Featured image': FilesPropertySchema,
})

/**
 * Pure function: transforms Notion API pages to validated post list items.
 * Validates data at the API boundary using Zod schema.
 * Can be tested without mocking I/O.
 */
export function transformNotionPagesToPostListItems(pages: unknown[]): PostListItem[] {
  return pages.map(page => {
    // Type guard for pages with properties
    if (!page || typeof page !== 'object' || !('properties' in page) || !('id' in page)) {
      throw new Error(INVALID_POST_ERROR)
    }

    // Validate and extract property values at I/O boundary
    const propertiesParsed = PostPropertiesSchema.safeParse(page.properties)
    if (!propertiesParsed.success) {
      logValidationError(propertiesParsed.error, 'post properties')
      throw new Error(INVALID_POST_PROPERTIES_ERROR)
    }

    const properties = propertiesParsed.data

    // Parse and validate the final post object
    const parsed = PostListItemSchema.safeParse({
      id: page.id,
      slug: properties.Slug,
      title: properties.Title,
      description: properties.Description,
      firstPublished: properties['First published'],
      featuredImage: properties['Featured image'][0] ?? null,
    })

    if (!parsed.success) {
      logValidationError(parsed.error, 'post')
      throw new Error(INVALID_POST_ERROR)
    }

    return parsed.data
  })
}

/**
 * Fetches published blog posts from a Notion data source.
 * Filters posts by destination, status, title, slug, description, and publication date.
 * Sorts the posts by the first published date in descending order.
 *
 * @see https://github.com/makenotion/notion-sdk-js?tab=readme-ov-file#collectpaginatedapilistfn-firstpageargs
 * @see https://developers.notion.com/reference/query-a-data-source
 * @see https://developers.notion.com/reference/filter-data-source-entries
 */
export default async function getPosts(options: Options = {}): Promise<PostListItem[]> {
  const { sortDirection = 'ascending', skipCache = false } = options

  // Check cache first (cache utility handles dev mode check)
  const cacheKey = `posts-list-${sortDirection}`
  if (!skipCache) {
    const cached = await getCached<PostListItem[]>(cacheKey, 'notion')
    if (cached) {
      return cached
    }
  }

  console.log(`📥 Fetching posts from Notion API`)

  const pages = await collectPaginatedAPI(notion.dataSources.query, {
    data_source_id: env.NOTION_DATA_SOURCE_ID_WRITING,
    filter: {
      and: [
        { property: 'Destination', multi_select: { contains: 'blog' } },
        { property: 'Status', status: { equals: 'Published' } }, // redundant if "First published" also used?
        { property: 'Title', title: { is_not_empty: true } },
        { property: 'Slug', rich_text: { is_not_empty: true } },
        { property: 'Description', rich_text: { is_not_empty: true } },
        // NOTE: link posts don't have featured images atm
        // { property: 'Featured image', url: { is_not_empty: true } },
        { property: 'First published', date: { on_or_before: new Date().toISOString() } },
      ],
    },
    sorts: [{ property: 'First published', direction: sortDirection }],
  })

  // Transform and validate external data at boundary
  const posts = transformNotionPagesToPostListItems(pages)

  // Cache the result (always caches, even when skipCache=true)
  // This ensures ?nocache=true refreshes the cache with latest data
  await setCached(cacheKey, posts, 'notion')

  return posts
}
