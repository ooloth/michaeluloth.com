import { type Metadata } from 'next'
import { type ReactElement } from 'react'
import fetchTmdbList from '@/io/tmdb/fetchTmdbList'
import getMediaItems from '@/io/notion/getMediaItems'
import fetchItunesItems, { type iTunesItem } from '@/io/itunes/fetchItunesItems'
import { env } from '@/io/env/env'
import { type Result } from '@/utils/errors/result'
import { DEFAULT_OG_IMAGE, SITE_NAME, SITE_URL, TWITTER_HANDLE } from '@/seo/constants'

import PageLayout from '@/ui/layouts/page-layout'
import MediaSection from '@/ui/likes/media-section'

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
    <PageLayout width="full">
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
    </PageLayout>
  )
}
