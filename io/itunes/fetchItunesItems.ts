import { z } from 'zod'
import transformCloudinaryImage from '@/io/cloudinary/transformCloudinaryImage'
import getImagePlaceholderForEnv from '@/utils/getImagePlaceholderForEnv'
import { formatValidationError } from '@/utils/logging/zod'
import { type Result, Ok, toErr } from '@/utils/errors/result'

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
  imagePlaceholder: z.string(),
})

export type iTunesItem = z.infer<typeof iTunesItemSchema>

type iTunesMedium = 'ebook' | 'music' | 'podcast'
type iTunesEntity = 'album' | 'ebook' | 'podcast'

export default async function fetchItunesItems(
  items: iTunesListItem[],
  medium: iTunesMedium,
  entity: iTunesEntity,
): Promise<Result<iTunesItem[], Error>> {
  const stringOfItemIDs = items.map(item => item.id).join(',')

  // See: https://affiliate.itunes.apple.com/resources/documentation/itunes-store-web-service-search-api/#lookup
  try {
    const response = await fetch(
      `https://itunes.apple.com/lookup?id=${stringOfItemIDs}&country=CA&media=${medium}&entity=${entity}&sort=recent`,
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
        const imagePlaceholder = await getImagePlaceholderForEnv(imageUrl, 4)

        // Validate final item before adding to results
        const parsedItem = iTunesItemSchema.safeParse({
          artist: artistName,
          title: matchingItem.name,
          id: String(resultID),
          date: matchingItem.date,
          link,
          imageUrl,
          imagePlaceholder,
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
    return Ok(sortedResults)
  } catch (error) {
    return toErr(error, 'fetchItunesItems')
  }
}
