import { type ReactElement } from 'react'

import { env } from '@/io/env/env'
import fetchItunesItems from '@/io/itunes/fetchItunesItems'
import getMediaItems from '@/io/notion/getMediaItems'
import fetchTmdbList from '@/io/tmdb/fetchTmdbList'
import { metadata } from '@/seo/pages/likes'
import PageLayout from '@/ui/layout/page-layout'
import MediaSection from '@/ui/sections/likes-row'

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
      'books',
    ).then(r => r.unwrap()),
    fetchItunesItems(
      albumsNotion.map(i => ({ id: i.appleId, name: i.name, date: i.date })),
      'albums',
    ).then(r => r.unwrap()),
    fetchItunesItems(
      podcastsNotion.map(i => ({ id: i.appleId, name: i.name, date: i.date })),
      'podcasts',
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

export { metadata }
