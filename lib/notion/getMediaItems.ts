import { getCached, setCached } from '@/lib/cache/filesystem'
import notion, { collectPaginatedAPI } from './client'
import getPropertyValue from './getPropertyValue'

type MediaCategory = 'books' | 'albums' | 'podcasts'

export type NotionMediaItem = {
  id: string
  name: string
  appleId: number
  date: string
}

type Options = {
  category: MediaCategory
  skipCache?: boolean
}

const DATA_SOURCE_IDS: Record<MediaCategory, string> = {
  books: process.env.NOTION_DATA_SOURCE_ID_BOOKS ?? '',
  albums: process.env.NOTION_DATA_SOURCE_ID_ALBUMS ?? '',
  podcasts: process.env.NOTION_DATA_SOURCE_ID_PODCASTS ?? '',
}

/**
 * Fetches media items (books, albums, or podcasts) from Notion data sources.
 * Returns simplified format ready for iTunes API enrichment.
 * Filters items by: Title exists, Apple ID exists, Date is today or earlier.
 * Caches results in development mode.
 *
 * @see https://github.com/makenotion/notion-sdk-js?tab=readme-ov-file#collectpaginatedapilistfn-firstpageargs
 * @see https://developers.notion.com/reference/query-a-data-source
 * @see https://developers.notion.com/reference/filter-data-source-entries
 */
export default async function getMediaItems(options: Options): Promise<NotionMediaItem[]> {
  const { category, skipCache = false } = options

  // Check cache first (cache utility handles dev mode check)
  const cacheKey = `media-${category}`
  if (!skipCache) {
    const cached = await getCached<NotionMediaItem[]>(cacheKey, 'notion')
    if (cached) {
      return cached
    }
  }

  console.log(`📥 Fetching ${category} from Notion API`)

  const pages = await collectPaginatedAPI(notion.dataSources.query, {
    data_source_id: DATA_SOURCE_IDS[category],
    filter: {
      and: [
        { property: 'Title', title: { is_not_empty: true } },
        { property: 'Apple ID', number: { is_not_empty: true } },
        { property: 'Date', date: { on_or_before: new Date().toISOString() } },
      ],
    },
    sorts: [{ property: 'Date', direction: 'descending' }],
  })

  // Transform to format expected by iTunes API
  const items: NotionMediaItem[] = pages
    .map(page => {
      // Type guard for pages with properties
      if (!('properties' in page)) {
        return null
      }

      const name = getPropertyValue(page.properties as any, 'Title')
      const appleId = getPropertyValue(page.properties as any, 'Apple ID')
      const date = getPropertyValue(page.properties as any, 'Date')

      // Validate required fields
      if (!name || !appleId || !date) {
        console.log(`Skipping ${category} item with missing data:`, { name, appleId, date })
        return null
      }

      return {
        id: page.id,
        name,
        appleId,
        date,
      }
    })
    .filter((item): item is NotionMediaItem => item !== null)

  // Cache the result (always caches, even when skipCache=true)
  // This ensures ?nocache=true refreshes the cache with latest data
  await setCached(cacheKey, items, 'notion')

  return items
}
