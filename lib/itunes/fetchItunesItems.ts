import { z } from 'zod'
import transformCloudinaryImage from '@/lib/cloudinary/transformCloudinaryImage'
import getImagePlaceholderForEnv from '@/utils/getImagePlaceholderForEnv'

interface iTunesListItem {
  date: string
  id: number
  name: string
}

// Schema for raw iTunes API response
const iTunesApiResultSchema = z.object({
  artistName: z.string().optional(),
  artworkUrl100: z.string().url(),
  collectionId: z.number().optional(),
  collectionViewUrl: z.string().url().optional(),
  trackId: z.number(),
  trackViewUrl: z.string().url().optional(),
})

// Schema for our internal iTunesItem type
const iTunesItemSchema = z.object({
  artist: z.string().optional(),
  title: z.string().min(1),
  id: z.string(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  link: z.string().url(),
  imageUrl: z.string().url(),
  imagePlaceholder: z.string(),
})

export type iTunesItem = z.infer<typeof iTunesItemSchema>

type iTunesMedium = 'ebook' | 'music' | 'podcast'
type iTunesEntity = 'album' | 'ebook' | 'podcast'

export default async function fetchItunesItems(
  items: iTunesListItem[],
  medium: iTunesMedium,
  entity: iTunesEntity,
): Promise<iTunesItem[]> {
  const stringOfItemIDs = items.map(item => item.id).join(',')

  let formattedResults: iTunesItem[]
  const includedIds = new Set()

  // See: https://affiliate.itunes.apple.com/resources/documentation/itunes-store-web-service-search-api/#lookup
  try {
    const response = await fetch(
      `https://itunes.apple.com/lookup?id=${stringOfItemIDs}&country=CA&media=${medium}&entity=${entity}&sort=recent`,
    )

    const data = await response.json()

    formattedResults = await Promise.all(
      data.results.map(async (result: unknown) => {
        if (!result) {
          return null
        }

        // Validate raw iTunes API data at boundary
        const parsedResult = iTunesApiResultSchema.safeParse(result)
        if (!parsedResult.success) {
          console.log('Skipping invalid iTunes result:', parsedResult.error.format())
          return null
        }

        const { artistName, artworkUrl100, collectionId, trackId, collectionViewUrl, trackViewUrl } =
          parsedResult.data

        const resultID = collectionId || trackId
        const matchingItem: iTunesListItem | undefined = items.find(item => item.id === resultID)

        if (!matchingItem) {
          console.log('No matching item for iTunes result:', resultID)
          return null
        }

        if (includedIds.has(resultID)) {
          console.log('Duplicate iTunes result:', resultID)
          return null
        }

        const link = collectionViewUrl || trackViewUrl
        if (!link) {
          console.log('iTunes result missing link:', resultID)
          return null
        }

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

        includedIds.add(resultID)

        return parsedItem.data
      }),
    )

    return formattedResults.filter(Boolean).sort((a, b) => b.date.localeCompare(a.date))
  } catch (error) {
    console.log('fetchItunesItems error:', error)
    return []
  }
}
