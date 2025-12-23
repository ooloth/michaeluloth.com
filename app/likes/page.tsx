import { type Metadata } from 'next'
import { type ReactElement } from 'react'
import fetchTmdbList, { type TmdbItem } from '@/io/tmdb/fetchTmdbList'
import getMediaItems from '@/io/notion/getMediaItems'
import fetchItunesItems, { type iTunesItem } from '@/io/itunes/fetchItunesItems'
import { env } from '@/io/env/env'
import { type Result } from '@/utils/errors/result'
import { DEFAULT_OG_IMAGE, SITE_NAME, SITE_URL, TWITTER_HANDLE } from '@/utils/metadata'

export const metadata: Metadata = {
  title: 'Likes',
  description: 'My favorite TV shows, movies, books, albums, and podcasts',
  openGraph: {
    type: 'website',
    url: `${SITE_URL}likes/`,
    siteName: SITE_NAME,
    locale: 'en_CA',
    images: [DEFAULT_OG_IMAGE],
  },
  twitter: {
    card: 'summary_large_image',
    creator: TWITTER_HANDLE,
    title: 'Likes',
    description: 'My favorite TV shows, movies, books, albums, and podcasts',
    images: [DEFAULT_OG_IMAGE],
  },
}

const TMDB_TV_LIST_ID = env.TMDB_TV_LIST_ID
const TMDB_MOVIE_LIST_ID = env.TMDB_MOVIE_LIST_ID

type iTunesMedium = 'ebook' | 'music' | 'podcast'
type iTunesEntity = 'ebook' | 'album' | 'podcast'
type MediaCategory = 'books' | 'albums' | 'podcasts'

/**
 * Fetches media items from Notion and enriches with iTunes metadata.
 * Returns Result to enable explicit error propagation without intermediate unwraps.
 */
export async function fetchItunesMedia(
  category: MediaCategory,
  medium: iTunesMedium,
  entity: iTunesEntity,
): Promise<Result<iTunesItem[], Error>> {
  const itemsResult = await getMediaItems({ category })
  if (!itemsResult.ok) {
    return itemsResult
  }

  return fetchItunesItems(
    itemsResult.value.map(i => ({ id: i.appleId, name: i.name, date: i.date })),
    medium,
    entity,
  )
}

type MediaSectionProps = {
  title: string
  items: (TmdbItem | iTunesItem)[]
  height: 'h-72' | 'h-48'
  prioritizeFirstImage?: boolean
}

function MediaSection({ title, items, height, prioritizeFirstImage = false }: MediaSectionProps): ReactElement | null {
  if (items.length === 0) {
    return null
  }

  // Build srcset for responsive images at 1x, 2x, 3x DPR
  const buildSrcSet = (url: string) => {
    const widths = [192, 384, 576] // 1x, 2x, 3x for 192px display width
    return widths.map(w => `${url.replace('w_192,', `w_${w},`)} ${w}w`).join(', ')
  }

  return (
    <section>
      <h2 className="mt-8 text-3xl font-semibold text-bright">{title}</h2>

      <ul className="flex gap-10 overflow-x-auto mt-4 hide-scrollbar list-none" aria-label={`${title} list`}>
        {items.map((item, index) => {
          const isItunesItem = 'artist' in item
          const year = item.date.split('-')[0]
          const isFirstImage = index === 0 && prioritizeFirstImage

          return (
            <li
              key={item.id}
              className="flex-none w-48"
              style={{
                contentVisibility: 'auto',
                containIntrinsicSize: `192px ${height === 'h-72' ? '288px' : '192px'}`,
              }}
            >
              <a
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300 rounded-lg"
              >
                <figure>
                  <div className={`relative ${height} overflow-hidden rounded-lg bg-zinc-800`}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.imageUrl}
                      srcSet={buildSrcSet(item.imageUrl)}
                      sizes="192px"
                      alt={item.title}
                      loading={isFirstImage ? 'eager' : 'lazy'}
                      decoding="async"
                      className="absolute inset-0 object-cover rounded-lg w-full h-full"
                    />
                  </div>
                  <figcaption className="text-center">
                    <p className="mt-4 leading-tight text-[1.05rem] font-semibold text-zinc-200">{item.title}</p>
                    {isItunesItem && item.artist && <p className="mt-1 text-zinc-400 text-[1rem]">{item.artist}</p>}
                    <p className="mt-0.5 text-zinc-400 text-[0.95rem]">{year}</p>
                  </figcaption>
                </figure>
              </a>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

export default async function Likes(): Promise<ReactElement> {
  // Fetch all categories in parallel
  const [tv, movies, books, albums, podcasts] = await Promise.all([
    fetchTmdbList(TMDB_TV_LIST_ID, 'tv').then(r => r.unwrap()),
    fetchTmdbList(TMDB_MOVIE_LIST_ID, 'movie').then(r => r.unwrap()),
    fetchItunesMedia('books', 'ebook', 'ebook').then(r => r.unwrap()),
    fetchItunesMedia('albums', 'music', 'album').then(r => r.unwrap()),
    fetchItunesMedia('podcasts', 'podcast', 'podcast').then(r => r.unwrap()),
  ])

  return (
    <main className="flex-auto">
      <h1 className="sr-only">Likes</h1>

      <div className="-mt-8">
        <MediaSection title="TV Shows" items={tv} height="h-72" prioritizeFirstImage />
        <MediaSection title="Movies" items={movies} height="h-72" />
        <MediaSection title="Books" items={books} height="h-72" />
        <MediaSection title="Albums" items={albums} height="h-48" />
        <MediaSection title="Podcasts" items={podcasts} height="h-48" />
      </div>
    </main>
  )
}
