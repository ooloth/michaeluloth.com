import { z } from 'zod'
import transformCloudinaryImage from '@/io/cloudinary/transformCloudinaryImage'
import { formatValidationError } from '@/utils/logging/zod'
import { env } from '@/io/env/env'
import { type Result, Ok, Err, toErr } from '@/utils/errors/result'
import { withRetry } from '@/io/retry'
import { filesystemCache, type CacheAdapter } from '@/io/cache/adapter'

// Schema for raw TMDB API response item
const TmdbApiResultSchema = z.object({
  id: z.number(),
  title: z.string().optional(),
  name: z.string().optional(),
  release_date: z.string().optional(),
  first_air_date: z.string().optional(),
  poster_path: z.string().min(1),
})

// Schema for our internal TmdbItem type
const TmdbItemSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  imageUrl: z.url(),
  link: z.url(),
})

export type TmdbItem = z.infer<typeof TmdbItemSchema>

type Options = {
  skipCache?: boolean
  cache?: CacheAdapter
}

export default async function fetchTmdbList(
  listId: string,
  api: 'tv' | 'movie',
  options: Options = {},
): Promise<Result<TmdbItem[], Error>> {
  const { skipCache = false, cache = filesystemCache } = options

  if (!listId) {
    const error = new Error('fetchTmdbList: listId is required')
    console.error(error.message)
    return Err(error)
  }

  const items = []
  const seenIds = new Set<number>()
  let page = 1
  let totalPages = 999 // will be updated after the first API response

  const fetch20Items = async () =>
    await fetch(
      // See: https://www.themoviedb.org/talk/55aa2a76c3a3682d63002fb1?language=en
      // See: https://developers.themoviedb.org/4/list/get-list
      `https://api.themoviedb.org/4/list/${listId}?sort_by=primary_release_date.desc&page=${page}`,
      {
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${env.TMDB_READ_ACCESS_TOKEN}`,
        },
      },
    )

  try {
    // Check cache first
    const cacheKey = `tmdb-${api}-${listId}`
    if (!skipCache) {
      const cached = await cache.get<TmdbItem[]>(cacheKey, 'tmdb')
      if (cached) {
        return Ok(cached)
      }
    }

    do {
      const response = await withRetry(fetch20Items, {
        onRetry: (error, attempt, delay) => {
          console.log(
            `⚠️  TMDB API timeout (page ${page}/${totalPages}) - retrying (attempt ${attempt}/3 after ${delay}ms): ${error.message}`,
          )
        },
      })
      const data = await response.json()
      totalPages = data.total_pages

      if (data.results && data.results.length > 0) {
        for (const result of data.results) {
          // Validate raw TMDB data at API boundary
          const parsedResult = TmdbApiResultSchema.safeParse(result)
          if (!parsedResult.success) {
            console.log('Skipping invalid TMDB result:', formatValidationError(parsedResult.error))
            continue
          }

          const { id, title, name, release_date, first_air_date, poster_path } = parsedResult.data

          // Skip duplicates
          if (seenIds.has(id)) {
            console.log('Duplicate TMDB result:', id)
            continue
          }

          // Extract required fields (TV shows use 'name' and 'first_air_date', movies use 'title' and 'release_date')
          const itemTitle = title || name
          const itemDate = release_date || first_air_date

          if (!itemTitle || !itemDate) {
            console.log(`Skipping TMDB result with missing title or date:`, parsedResult.data)
            continue
          }

          const imageUrl = transformCloudinaryImage(
            `https://res.cloudinary.com/ooloth/image/fetch/https://image.tmdb.org/t/p/original${poster_path}`,
            192,
          )
          const link = `https://www.themoviedb.org/${api}/${id}`

          // Validate final item before adding to results
          const parsedItem = TmdbItemSchema.safeParse({
            id: String(id),
            title: itemTitle,
            date: itemDate,
            imageUrl,
            link,
          })

          if (!parsedItem.success) {
            console.log('Skipping invalid TMDB item:', parsedItem.error.format())
            continue
          }

          seenIds.add(id)
          items.push(parsedItem.data)
        }
      }

      page++
    } while (page <= totalPages)

    // Cache the result
    await cache.set(cacheKey, items, 'tmdb')

    return Ok(items)
  } catch (error) {
    return toErr(error, 'fetchTmdbList')
  }
}
