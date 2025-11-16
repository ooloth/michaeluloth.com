import { getCached, setCached } from '@/lib/cache/filesystem'
import notion, { collectPaginatedAPI } from './client'

type SortDirection = 'ascending' | 'descending'

type Options = {
  sortDirection?: SortDirection
  skipCache?: boolean
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
export default async function getPosts(options: Options = {}): Promise<any[]> {
  const { sortDirection = 'ascending', skipCache = false } = options

  // Check cache first (cache utility handles dev mode check)
  const cacheKey = `posts-list-${sortDirection}`
  if (!skipCache) {
    const cached = await getCached<any[]>(cacheKey, 'notion')
    if (cached) {
      return cached
    }
  }

  console.log(`📥 Fetching posts from Notion API`)

  const posts = await collectPaginatedAPI(notion.dataSources.query, {
    data_source_id: process.env.NOTION_DATA_SOURCE_ID_WRITING ?? '',
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

  // TODO: parse with zod

  // Cache the result (always caches, even when skipCache=true)
  // This ensures ?nocache=true refreshes the cache with latest data
  await setCached(cacheKey, posts, 'notion')

  return posts
}
