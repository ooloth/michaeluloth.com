import { z } from 'zod'
import { createHash } from 'node:crypto'
import transformCloudinaryImage from '@/io/cloudinary/transformCloudinaryImage'
import { formatValidationError } from '@/io/logging/zod'
import { type Result, Ok, toErr } from '@/utils/errors/result'
import { withRetry } from '@/io/retry'
import { filesystemCache, type CacheAdapter } from '@/io/cache/adapter'

interface iTunesListItem {
  date: string
  id: number
  name: string
}

// Schema for raw iTunes API response
const iTunesApiResultSchema = z
  .object({
    artistName: z.string().optional(),
    artworkUrl100: z.url(),
    collectionId: z.number().optional(),
    collectionViewUrl: z.url().optional(),
    trackId: z.number().optional(),
    trackViewUrl: z.url().optional(),
  })
  .refine(data => data.collectionId || data.trackId, {
    // Albums have collectionId, Books have trackId, Podcasts have both
    message: 'iTunes result must have either collectionId or trackId',
  })
  .refine(data => data.collectionViewUrl || data.trackViewUrl, {
    // Albums have collectionViewUrl, Books have trackViewUrl, Podcasts have both
    message: 'iTunes result must have either collectionViewUrl or trackViewUrl',
  })

// Schema for our internal iTunesItem type
const iTunesItemSchema = z.object({
  artist: z.string().optional(),
  title: z.string().min(1),
  id: z.string(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  link: z.url(),
  imageUrl: z.url(),
})

export type iTunesItem = z.infer<typeof iTunesItemSchema>

type iTunesMedium = 'ebook' | 'music' | 'podcast'
type iTunesEntity = 'album' | 'ebook' | 'podcast'
type MediaCategory = 'books' | 'albums' | 'podcasts'

type Options = {
  skipCache?: boolean
  cache?: CacheAdapter
}

export default async function fetchItunesItems(
  items: iTunesListItem[],
  category: MediaCategory,
  options: Options = {},
): Promise<Result<iTunesItem[], Error>> {
  const { skipCache = false, cache = filesystemCache } = options

  // Map category to iTunes API parameters
  const params = {
    books: { medium: 'ebook' as iTunesMedium, entity: 'ebook' as iTunesEntity },
    albums: { medium: 'music' as iTunesMedium, entity: 'album' as iTunesEntity },
    podcasts: { medium: 'podcast' as iTunesMedium, entity: 'podcast' as iTunesEntity },
  }[category]

  const stringOfItemIDs = items.map(item => item.id).join(',')

  // See: https://affiliate.itunes.apple.com/resources/documentation/itunes-store-web-service-search-api/#lookup
  try {
    // Check cache first
    // Hash the ID list to avoid ENAMETOOLONG errors with many items
    const idsHash = createHash('sha256').update(stringOfItemIDs).digest('hex').slice(0, 16)
    const cacheKey = `itunes-${category}-${idsHash}`
    if (!skipCache) {
      const cached = await cache.get<iTunesItem[]>(cacheKey, 'itunes')
      if (cached) {
        return Ok(cached)
      }
    }
    const response = await withRetry(
      () =>
        fetch(
          `https://itunes.apple.com/lookup?id=${stringOfItemIDs}&country=CA&media=${params.medium}&entity=${params.entity}&sort=recent`,
        ),
      {
        onRetry: (error, attempt, delay) => {
          console.log(`⚠️  iTunes API timeout - retrying (attempt ${attempt}/3 after ${delay}ms): ${error.message}`)
        },
      },
    )

    const data = await response.json()

    const formattedResults = await Promise.all(
      data.results.map(async (result: unknown) => {
        if (!result) {
          return null
        }

        // Validate raw iTunes API data at boundary
        const parsedResult = iTunesApiResultSchema.safeParse(result)
        if (!parsedResult.success) {
          console.log('Skipping invalid iTunes result:', formatValidationError(parsedResult.error))
          return null
        }

        const { artistName, artworkUrl100, collectionId, collectionViewUrl, trackId, trackViewUrl } = parsedResult.data

        const resultID = collectionId || trackId
        const matchingItem: iTunesListItem | undefined = items.find(item => item.id === resultID)

        if (!matchingItem) {
          console.log('No matching item for iTunes result:', resultID)
          return null
        }

        const link = collectionViewUrl || trackViewUrl

        // See image srcset URLs used on books.apple.com:
        const imageUrl = transformCloudinaryImage(
          `https://res.cloudinary.com/ooloth/image/fetch/${artworkUrl100.replace('100x100bb', '400x0w')}`,
          192,
        )

        // Validate final item before adding to results
        const parsedItem = iTunesItemSchema.safeParse({
          artist: artistName,
          title: matchingItem.name,
          id: String(resultID),
          date: matchingItem.date,
          link,
          imageUrl,
        })

        if (!parsedItem.success) {
          console.log('Skipping invalid iTunes item:', parsedItem.error.format())
          return null
        }

        return parsedItem.data
      }),
    )

    // Remove duplicates (keep first occurrence) and nulls
    const seenIds = new Set<string>()
    const uniqueResults: iTunesItem[] = []
    for (const item of formattedResults) {
      if (!item) continue
      if (seenIds.has(item.id)) {
        console.log('Duplicate iTunes result:', item.id)
        continue
      }
      seenIds.add(item.id)
      uniqueResults.push(item)
    }

    const sortedResults = uniqueResults.sort((a, b) => b.date.localeCompare(a.date))

    // Cache the result
    await cache.set(cacheKey, sortedResults, 'itunes')

    return Ok(sortedResults)
  } catch (error) {
    return toErr(error, 'fetchItunesItems')
  }
}
