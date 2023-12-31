import cloudinary from '../cloudinary/client'

export interface TmdbItem {
  id: string
  imageUrl: string
  date: string
  link: string
  title: string
}

export default async function fetchTmdbList(listId: string, api: 'tv' | 'movie'): Promise<TmdbItem[]> {
  if (!listId) {
    console.log('fetchTmdbList error: listId is undefined')
    return []
  }

  const items = []
  let page = 1
  let totalPages = 999 // will be updated after the first API response

  // FIXME: specify variable and return types from here down...
  const fetch20Items = async () =>
    await fetch(
      // See: https://www.themoviedb.org/talk/55aa2a76c3a3682d63002fb1?language=en
      // See: https://developers.themoviedb.org/4/list/get-list
      `https://api.themoviedb.org/4/list/${listId}?sort_by=primary_release_date.desc&page=${page}`,
      {
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${import.meta.env.TMDB_READ_ACCESS_TOKEN}`,
        },
      },
    )

  do {
    try {
      const response = await fetch20Items()
      const data = await response.json()
      totalPages = data.total_pages

      if (data.results && data.results.length > 0) {
        for (const result of data.results) {
          const title = result.title || result.name
          const id = result.id
          const date = result.release_date || result.first_air_date

          const imageUrl = cloudinary.url(`https://image.tmdb.org/t/p/original${result.poster_path}`, {
            type: 'fetch',
            crop: 'scale',
            fetch_format: 'auto',
            quality: 'auto',
            width: 192 * 2,
            height: 288 * 2,
          })

          if (!title || !id || !date || !result.poster_path) {
            console.log(`Removed TMDB result:`, title || result)
            continue
          }

          const link = `https://www.themoviedb.org/${api}/${id}`

          items.push({ title, id, date, imageUrl, link })
        }
      }
    } catch (error) {
      console.log('fetchTmdbList error:', error)
    }

    page++
  } while (page <= totalPages)

  return await Promise.all(items)
}
