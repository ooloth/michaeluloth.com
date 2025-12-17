import { filesystemCache, type CacheAdapter } from '@/io/cache/adapter'
import notion, { collectPaginatedAPI, type Client } from './client'
import { PostListItemSchema, PostPropertiesSchema, type PostListItem } from './schemas/post'
import { PageMetadataSchema } from './schemas/page'
import { logValidationError } from '@/utils/logging/zod'
import { env } from '@/io/env/env'
import { type Result, Ok, toErr } from '@/utils/errors/result'
import { z } from 'zod'

type Options = {
  cache?: CacheAdapter
  notionClient?: Client
  skipCache?: boolean
  sortDirection?: 'ascending' | 'descending'
}

export const INVALID_POST_ERROR = 'Invalid post data - build aborted'
export const INVALID_POST_PROPERTIES_ERROR = 'Invalid post properties - build aborted'

/**
 * Pure function: transforms Notion API pages to validated post list items.
 * Validates data at the API boundary using Zod schema.
 * Can be tested without mocking I/O.
 */
export function transformNotionPagesToPostListItems(pages: unknown[]): PostListItem[] {
  return pages.map(page => {
    // Validate page metadata structure
    const pageMetadata = PageMetadataSchema.safeParse(page)
    if (!pageMetadata.success) {
      logValidationError(pageMetadata.error, 'page metadata')
      throw new Error(INVALID_POST_ERROR)
    }

    // Validate and extract property values at I/O boundary
    const propertiesParsed = PostPropertiesSchema.safeParse(pageMetadata.data.properties)
    if (!propertiesParsed.success) {
      logValidationError(propertiesParsed.error, 'post properties')
      throw new Error(INVALID_POST_PROPERTIES_ERROR)
    }

    const properties = propertiesParsed.data

    // Parse and validate the final post object
    const parsed = PostListItemSchema.safeParse({
      id: pageMetadata.data.id,
      slug: properties.Slug,
      title: properties.Title,
      description: properties.Description,
      firstPublished: properties['First published'],
      featuredImage: properties['Featured image'],
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
export default async function getPosts(options: Options = {}): Promise<Result<PostListItem[], Error>> {
  const { sortDirection = 'ascending', skipCache = false, cache = filesystemCache, notionClient = notion } = options

  try {
    // Check cache first (cache utility handles dev mode check)
    const cacheKey = `posts-list-${sortDirection}`
    if (!skipCache) {
      const cached = await cache.get<PostListItem[]>(cacheKey, 'notion')
      if (cached) {
        return Ok(cached)
      }
    }

    console.log(`📥 Fetching posts from Notion API`)

    const pages = await collectPaginatedAPI(notionClient.dataSources.query, {
      data_source_id: env.NOTION_DATA_SOURCE_ID_WRITING,
      filter: {
        and: [
          { property: 'Destination', multi_select: { contains: 'blog' } },
          { property: 'Status', status: { equals: 'Published' } }, // redundant if "First published" also used?
          { property: 'Title', title: { is_not_empty: true } },
          { property: 'Slug', rich_text: { is_not_empty: true } },
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
    await cache.set(cacheKey, posts, 'notion')

    return Ok(posts)
  } catch (error) {
    return toErr(error, 'getPosts')
  }
}
