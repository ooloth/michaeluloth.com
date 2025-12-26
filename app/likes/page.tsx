import { type Metadata } from 'next'
import { type ReactElement } from 'react'
import fetchTmdbList from '@/io/tmdb/fetchTmdbList'
import getMediaItems from '@/io/notion/getMediaItems'
import fetchItunesItems from '@/io/itunes/fetchItunesItems'
import { env } from '@/io/env/env'
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

export default async function Likes(): Promise<ReactElement> {
  // Step 1: Fetch Notion items in parallel
  const [booksNotion, albumsNotion, podcastsNotion] = await Promise.all([
    getMediaItems({ category: 'books' }).then(r => r.unwrap()),
    getMediaItems({ category: 'albums' }).then(r => r.unwrap()),
    getMediaItems({ category: 'podcasts' }).then(r => r.unwrap()),
  ])

  // Step 2: Fetch TMDB and iTunes items in parallel
  const [tv, movies, books, albums, podcasts] = await Promise.all([
    fetchTmdbList(env.TMDB_TV_LIST_ID, 'tv').then(r => r.unwrap()),
    fetchTmdbList(env.TMDB_MOVIE_LIST_ID, 'movie').then(r => r.unwrap()),
    fetchItunesItems(
      booksNotion.map(i => ({ id: i.appleId, name: i.name, date: i.date })),
      'ebook',
      'ebook',
    ).then(r => r.unwrap()),
    fetchItunesItems(
      albumsNotion.map(i => ({ id: i.appleId, name: i.name, date: i.date })),
      'music',
      'album',
    ).then(r => r.unwrap()),
    fetchItunesItems(
      podcastsNotion.map(i => ({ id: i.appleId, name: i.name, date: i.date })),
      'podcast',
      'podcast',
    ).then(r => r.unwrap()),
  ])

  return (
    <PageLayout width="full">
      <h1 className="sr-only">Likes</h1>

      <div className="-mt-8">
        <MediaSection title="TV Shows" items={tv} height="h-72" prioritizeFirstImage />
        <MediaSection title="Movies" items={movies} height="h-72" />
        <MediaSection title="Books" items={books} height="h-72" />
        <MediaSection title="Albums" items={albums} height="h-48" />
        <MediaSection title="Podcasts" items={podcasts} height="h-48" />
      </div>
    </PageLayout>
  )
}
