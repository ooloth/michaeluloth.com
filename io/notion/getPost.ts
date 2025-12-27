import { filesystemCache, type CacheAdapter } from '@/io/cache/adapter'
import notion, { type Client } from './client'
import getBlockChildren from '@/io/notion/getBlockChildren'
import getPosts from '@/io/notion/getPosts'
import { PostListItemSchema, PostPropertiesSchema, type Post } from './schemas/post'
import { PostPageMetadataSchema } from './schemas/page'
import { logValidationError } from '@/utils/logging/zod'
import { env } from '@/io/env/env'
import { Ok, Err, toErr, type Result } from '@/utils/errors/result'
import { withRetry } from '@/io/utils/retry'

type Options = {
  slug: string | null
  includeBlocks?: boolean
  includePrevAndNext?: boolean
  skipCache?: boolean
  cache?: CacheAdapter
  notionClient?: Client
}

export const INVALID_POST_DETAILS_ERROR = 'Invalid post details data - build aborted'
export const INVALID_POST_PROPERTIES_ERROR = 'Invalid post properties - build aborted'

/**
 * Pure function: transforms a Notion API page to a validated Post.
 * Validates data at the API boundary using Zod schema.
 * Can be tested without mocking I/O.
 */
export function transformNotionPageToPost(page: unknown): Post {
  // Validate page metadata structure (includes required last_edited_time for posts)
  const pageMetadata = PostPageMetadataSchema.safeParse(page)
  if (!pageMetadata.success) {
    logValidationError(pageMetadata.error, 'page metadata')
    throw new Error(INVALID_POST_DETAILS_ERROR)
  }

  // Validate and extract property values at I/O boundary
  const propertiesParsed = PostPropertiesSchema.safeParse(pageMetadata.data.properties)
  if (!propertiesParsed.success) {
    logValidationError(propertiesParsed.error, 'post properties')
    throw new Error(INVALID_POST_PROPERTIES_ERROR)
  }

  const properties = propertiesParsed.data

  // Parse and validate post list item fields using Zod schema
  const parsed = PostListItemSchema.safeParse({
    id: pageMetadata.data.id,
    slug: properties.Slug,
    title: properties.Title,
    description: properties.Description,
    firstPublished: properties['First published'],
    featuredImage: properties['Featured image'],
    feedId: properties['Feed ID'],
  })

  if (!parsed.success) {
    logValidationError(parsed.error, 'post details')
    throw new Error(INVALID_POST_DETAILS_ERROR)
  }

  // Return full Post with additional fields
  // Blocks are validated separately in getBlockChildren
  return {
    ...parsed.data,
    lastEditedTime: pageMetadata.data.lastEditedTime,
    blocks: [],
    prevPost: null,
    nextPost: null,
  }
}

/**
 * Fetches a specific blog post from a Notion data source by its "Slug" property.
 * Optionally includes the post's block children and prev/next navigation.
 *
 * @see https://github.com/makenotion/notion-sdk-js?tab=readme-ov-file#collectpaginatedapilistfn-firstpageargs
 * @see https://developers.notion.com/reference/query-a-data-source
 * @see https://developers.notion.com/reference/filter-data-source-entries
 */
export default async function getPost({
  slug,
  includeBlocks = false,
  includePrevAndNext = false,
  skipCache = false,
  cache = filesystemCache,
  notionClient = notion,
}: Options): Promise<Result<Post | null, Error>> {
  try {
    if (!slug) {
      return Ok(null)
    }

    // Check cache first (cache utility handles dev mode check)
    const cacheKey = `post-${slug}-blocks-${includeBlocks}-nav-${includePrevAndNext}`
    if (!skipCache) {
      const cached = await cache.get<Post>(cacheKey, 'notion')
      if (cached) {
        return Ok(cached)
      }
    }

    console.info(`📥 Fetching post from Notion API: ${slug}`)

    const response = await withRetry(
      () =>
        notionClient.dataSources.query({
          data_source_id: env.NOTION_DATA_SOURCE_ID_WRITING,
          filter: {
            and: [{ property: 'Slug', rich_text: { equals: slug } }],
          },
        }),
      {
        onRetry: (error, attempt, delay) => {
          console.log(
            `⚠️  Notion API timeout fetching post "${slug}" - retrying (attempt ${attempt}/3 after ${delay}ms): ${error.message}`,
          )
        },
      },
    )

    if (response.results.length === 0) {
      // Treat missing posts as a successful "not found" result so callers can render a 404
      // (or similar) without this being surfaced as an application error.
      console.warn(`No post found for slug: ${slug}`)
      return Ok(null)
    }

    if (response.results.length > 1) {
      throw Error(`Multiple posts found for slug: ${slug}\n${JSON.stringify(response.results)}`)
    }

    // Transform and validate external data at boundary
    let post = transformNotionPageToPost(response.results[0])

    if (includePrevAndNext) {
      const postsResult = await getPosts({ sortDirection: 'ascending', skipCache, cache, notionClient })
      if (!postsResult.ok) {
        return Err(postsResult.error)
      }

      const posts = postsResult.value
      const postSlugs = posts.map(post => post.slug)
      const index = postSlugs.indexOf(slug)

      post = {
        ...post,
        prevPost: index > 0 ? posts[index - 1] : null,
        nextPost: index < postSlugs.length - 1 ? posts[index + 1] : null,
      }
    }

    if (includeBlocks) {
      const blocksResult = await getBlockChildren(post.id)
      if (!blocksResult.ok) {
        return Err(blocksResult.error)
      }

      post = { ...post, blocks: blocksResult.value }
    }

    // Cache the result (always caches, even when skipCache=true)
    // This ensures ?nocache=true refreshes the cache with latest data
    await cache.set(cacheKey, post, 'notion')

    return Ok(post)
  } catch (error) {
    return toErr(error, 'getPost')
  }
}
