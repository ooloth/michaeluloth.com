import { z } from 'zod'
import { filesystemCache, type CacheAdapter } from '@/io/cache/adapter'
import notion, { collectPaginatedAPI, type Client } from './client'
import {
  createPropertiesSchema,
  TitlePropertySchema,
  NumberPropertySchema,
  DatePropertySchema,
} from './schemas/properties'
import { PageMetadataSchema } from './schemas/page'
import { logValidationError } from '@/utils/logging/zod'
import { env } from '@/io/env/env'
import { type Result, Ok, toErr } from '@/utils/errors/result'
import { withRetry } from '@/utils/retry'

type MediaCategory = 'books' | 'albums' | 'podcasts'

// Zod schema for runtime validation at API boundary
const NotionMediaItemSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  appleId: z.number().int().positive(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
})

// Infer TypeScript type from Zod schema (single source of truth)
export type NotionMediaItem = z.infer<typeof NotionMediaItemSchema>

export const INVALID_MEDIA_ITEM_ERROR = {
  books: 'Invalid book data - build aborted',
  albums: 'Invalid album data - build aborted',
  podcasts: 'Invalid podcast data - build aborted',
} satisfies Record<MediaCategory, string>

export const INVALID_MEDIA_PROPERTIES_ERROR = {
  books: 'Invalid book properties - build aborted',
  albums: 'Invalid album properties - build aborted',
  podcasts: 'Invalid podcast properties - build aborted',
} satisfies Record<MediaCategory, string>

/**
 * Schema for validating and transforming media item properties from Notion API.
 * Validates structure and extracts values in one step.
 */
const MediaPropertiesSchema = createPropertiesSchema({
  Title: TitlePropertySchema,
  'Apple ID': NumberPropertySchema,
  Date: DatePropertySchema,
})

type Options = {
  category: MediaCategory
  skipCache?: boolean
  cache?: CacheAdapter
  notionClient?: Client
}

/**
 * Pure function: transforms Notion API pages to validated media items.
 * Validates data at the API boundary using Zod schema.
 * Can be tested without mocking I/O.
 */
export function transformNotionPagesToMediaItems(pages: unknown[], category: MediaCategory): NotionMediaItem[] {
  return pages.map(page => {
    // Validate page metadata structure
    const pageMetadata = PageMetadataSchema.safeParse(page)
    if (!pageMetadata.success) {
      logValidationError(pageMetadata.error, 'page metadata')
      throw new Error(INVALID_MEDIA_ITEM_ERROR[category])
    }

    // Validate and extract property values at I/O boundary
    const propertiesParsed = MediaPropertiesSchema.safeParse(pageMetadata.data.properties)
    if (!propertiesParsed.success) {
      logValidationError(propertiesParsed.error, `${category} item`)
      throw new Error(INVALID_MEDIA_PROPERTIES_ERROR[category])
    }

    const properties = propertiesParsed.data

    // Parse and validate using Zod schema
    const parsed = NotionMediaItemSchema.safeParse({
      id: pageMetadata.data.id,
      name: properties.Title,
      appleId: properties['Apple ID'],
      date: properties.Date,
    })

    if (!parsed.success) {
      logValidationError(parsed.error, `${category} item`)
      throw new Error(INVALID_MEDIA_ITEM_ERROR[category])
    }

    return parsed.data
  })
}

const DATA_SOURCE_IDS: Record<MediaCategory, string> = {
  books: env.NOTION_DATA_SOURCE_ID_BOOKS,
  albums: env.NOTION_DATA_SOURCE_ID_ALBUMS,
  podcasts: env.NOTION_DATA_SOURCE_ID_PODCASTS,
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
export default async function getMediaItems(options: Options): Promise<Result<NotionMediaItem[], Error>> {
  const { category, skipCache = false, cache = filesystemCache, notionClient = notion } = options

  try {
    // Check cache first (cache utility handles dev mode check)
    const cacheKey = `media-${category}`
    if (!skipCache) {
      const cached = await cache.get<NotionMediaItem[]>(cacheKey, 'notion')
      if (cached) {
        return Ok(cached)
      }
    }

    console.log(`📥 Fetching ${category} from Notion API`)

    const pages = await withRetry(
      () =>
        collectPaginatedAPI(notionClient.dataSources.query, {
          data_source_id: DATA_SOURCE_IDS[category],
          filter: {
            and: [
              { property: 'Title', title: { is_not_empty: true } },
              { property: 'Apple ID', number: { is_not_empty: true } },
              { property: 'Date', date: { on_or_before: new Date().toISOString() } },
            ],
          },
          sorts: [{ property: 'Date', direction: 'descending' }],
        }),
      {
        onRetry: (error, attempt, delay) => {
          console.log(
            `⚠️  Notion API timeout fetching ${category} - retrying (attempt ${attempt}/3 after ${delay}ms): ${error.message}`,
          )
        },
      },
    )

    // Transform and validate external data at boundary
    const items = transformNotionPagesToMediaItems(pages, category)

    // Cache the result (always caches, even when skipCache=true)
    // This ensures ?nocache=true refreshes the cache with latest data
    await cache.set(cacheKey, items, 'notion')

    return Ok(items)
  } catch (error) {
    return toErr(error, `getMediaItems (${category})`)
  }
}
