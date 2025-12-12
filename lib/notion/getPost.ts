import { getCached, setCached } from '@/lib/cache/filesystem'
import notion from './client'
import getBlockChildren from '@/lib/notion/getBlockChildren'
import getPosts from '@/lib/notion/getPosts'
import { PostListItemSchema, PostPropertiesSchema, type Post, type PostListItem } from './schemas/post'
import { logValidationError } from '@/utils/zod'
import { env } from '@/lib/env'

type Options = {
  slug: string | null
  includeBlocks?: boolean
  includePrevAndNext?: boolean
  skipCache?: boolean
}

export const INVALID_POST_DETAILS_ERROR = 'Invalid post details data - build aborted'
export const INVALID_POST_PROPERTIES_ERROR = 'Invalid post properties - build aborted'

/**
 * Pure function: transforms a Notion API page to a validated Post.
 * Validates data at the API boundary using Zod schema.
 * Can be tested without mocking I/O.
 */
export function transformNotionPageToPost(page: unknown): Post {
  // Type guard for pages with properties
  if (!page || typeof page !== 'object' || !('properties' in page) || !('id' in page) || !('last_edited_time' in page)) {
    throw new Error(INVALID_POST_DETAILS_ERROR)
  }

  // Validate and extract property values at I/O boundary
  const propertiesParsed = PostPropertiesSchema.safeParse(page.properties)
  if (!propertiesParsed.success) {
    logValidationError(propertiesParsed.error, 'post properties')
    throw new Error(INVALID_POST_PROPERTIES_ERROR)
  }

  const properties = propertiesParsed.data

  // Parse and validate post list item fields using Zod schema
  const parsed = PostListItemSchema.safeParse({
    id: page.id,
    slug: properties.Slug,
    title: properties.Title,
    description: properties.Description,
    firstPublished: properties['First published'],
    featuredImage: properties['Featured image'],
  })

  if (!parsed.success) {
    logValidationError(parsed.error, 'post details')
    throw new Error(INVALID_POST_DETAILS_ERROR)
  }

  // Return full Post with additional fields
  // Blocks are validated separately in getBlockChildren
  return {
    ...parsed.data,
    lastEditedTime: (page as any).last_edited_time,
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
}: Options): Promise<Post | null> {
  if (!slug) {
    return null
  }

  // Check cache first (cache utility handles dev mode check)
  const cacheKey = `post-${slug}-blocks-${includeBlocks}-nav-${includePrevAndNext}`
  if (!skipCache) {
    const cached = await getCached<Post>(cacheKey, 'notion')
    if (cached) {
      return cached
    }
  }

  console.info(`📥 Fetching post from Notion API: ${slug}`)

  const response = await notion.dataSources.query({
    data_source_id: env.NOTION_DATA_SOURCE_ID_WRITING,
    filter: {
      and: [{ property: 'Slug', rich_text: { equals: slug } }],
    },
  })

  if (response.results.length === 0) {
    console.error(`No post found for slug: ${slug}`)
    return null
  }

  if (response.results.length > 1) {
    throw Error(`Multiple posts found for slug: ${slug}\n${JSON.stringify(response.results)}`)
  }

  // Transform and validate external data at boundary
  let post = transformNotionPageToPost(response.results[0])

  if (includePrevAndNext) {
    const posts = await getPosts({ sortDirection: 'ascending', skipCache })

    const postSlugs = posts.map(post => post.slug)
    const index = postSlugs.indexOf(slug)

    post = {
      ...post,
      prevPost: index > 0 ? posts[index - 1] : null,
      nextPost: index < postSlugs.length - 1 ? posts[index + 1] : null,
    }
  }

  if (includeBlocks) {
    const blocks = await getBlockChildren(post.id)

    post = { ...post, blocks }
  }

  // Cache the result (always caches, even when skipCache=true)
  // This ensures ?nocache=true refreshes the cache with latest data
  await setCached(cacheKey, post, 'notion')

  return post
}
