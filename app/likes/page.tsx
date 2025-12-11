import { type ReactElement } from 'react'
import Image from 'next/image'
import Heading from '@/ui/heading'
import fetchTmdbList, { type TmdbItem } from '@/lib/tmdb/fetchTmdbList'
import getMediaItems from '@/lib/notion/getMediaItems'
import fetchItunesItems, { type iTunesItem } from '@/lib/itunes/fetchItunesItems'
import { env } from '@/lib/env'

const TMDB_TV_LIST_ID = env.TMDB_TV_LIST_ID
const TMDB_MOVIE_LIST_ID = env.TMDB_MOVIE_LIST_ID

type MediaSectionProps = {
  title: string
  items: (TmdbItem | iTunesItem)[]
  height: 'h-72' | 'h-48'
}

function MediaSection({ title, items, height }: MediaSectionProps): ReactElement | null {
  if (items.length === 0) {
    return null
  }

  return (
    <section>
      <Heading level={2}>{title}</Heading>

      <ul className="flex gap-10 overflow-x-auto hide-scrollbar list-none mt-4">
        {items.map(item => {
          const isItunesItem = 'artist' in item
          const year = item.date.split('-')[0]

          return (
            <li key={item.id} className="flex-none w-48">
              <a href={item.link} target="_blank" rel="noopener noreferrer" className="block">
                <figure>
                  <div className={`relative ${height} overflow-hidden`}>
                    <Image
                      src={item.imageUrl}
                      alt={item.title}
                      fill
                      sizes="192px"
                      placeholder="blur"
                      blurDataURL={item.imagePlaceholder}
                      className="object-cover rounded-lg"
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

type PageProps = {
  searchParams: Promise<{ nocache?: string }>
}

export default async function Likes({ searchParams }: PageProps): Promise<ReactElement> {
  const params = await searchParams
  const skipCache = params.nocache === 'true'

  // Fetch all categories in parallel
  const [tv, movies, books, albums, podcasts] = await Promise.all([
    fetchTmdbList(TMDB_TV_LIST_ID, 'tv'),
    fetchTmdbList(TMDB_MOVIE_LIST_ID, 'movie'),
    getMediaItems({ category: 'books', skipCache }).then(items =>
      fetchItunesItems(
        items.map(i => ({ id: i.appleId, name: i.name, date: i.date })),
        'ebook',
        'ebook',
      ),
    ),
    getMediaItems({ category: 'albums', skipCache }).then(items =>
      fetchItunesItems(
        items.map(i => ({ id: i.appleId, name: i.name, date: i.date })),
        'music',
        'album',
      ),
    ),
    getMediaItems({ category: 'podcasts', skipCache }).then(items =>
      fetchItunesItems(
        items.map(i => ({ id: i.appleId, name: i.name, date: i.date })),
        'podcast',
        'podcast',
      ),
    ),
  ])

  return (
    <main className="flex-auto">
      <Heading level={1}>Likes</Heading>

      <div className="pt-8">
        <MediaSection title="TV Shows" items={tv} height="h-72" />
        <MediaSection title="Movies" items={movies} height="h-72" />
        <MediaSection title="Books" items={books} height="h-72" />
        <MediaSection title="Albums" items={albums} height="h-48" />
        <MediaSection title="Podcasts" items={podcasts} height="h-48" />
      </div>
    </main>
  )
}
