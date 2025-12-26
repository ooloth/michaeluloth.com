import { type ReactElement } from 'react'
import type { TmdbItem } from '@/io/tmdb/fetchTmdbList'
import type { iTunesItem } from '@/io/itunes/fetchItunesItems'

type MediaSectionProps = {
  title: string
  items: (TmdbItem | iTunesItem)[]
  height: 'h-72' | 'h-48'
  prioritizeFirstImage?: boolean
}

export default function MediaSection({
  title,
  items,
  height,
  prioritizeFirstImage = false,
}: MediaSectionProps): ReactElement | null {
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
                      loading="lazy"
                      fetchPriority={isFirstImage ? 'high' : 'auto'}
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
