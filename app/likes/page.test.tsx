/**
 * @vitest-environment happy-dom
 */

import { render, screen } from '@testing-library/react'
import { metadata } from './page'
import Likes from './page'
import getMediaItems, { type NotionMediaItem } from '@/io/notion/getMediaItems'
import fetchItunesItems, { type iTunesItem } from '@/io/itunes/fetchItunesItems'
import fetchTmdbList from '@/io/tmdb/fetchTmdbList'
import { Ok, Err } from '@/utils/errors/result'
import { SITE_LOCALE } from '@/seo/constants'

// Mock dependencies
vi.mock('@/io/notion/getMediaItems')
vi.mock('@/io/itunes/fetchItunesItems')
vi.mock('@/io/tmdb/fetchTmdbList')
// Mock PageLayout to avoid rendering Header/Footer in tests
// But preserve the main wrapper that PageLayout now provides
vi.mock('@/ui/layout/main', () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <main id="main" className="flex-auto flex flex-col">
      {children}
    </main>
  ),
}))

describe('Likes page metadata', () => {
  it('exports metadata with simplified title using template', () => {
    expect(metadata).toEqual({
      title: 'Likes',
      description: 'My favorite TV shows, movies, books, albums, and podcasts',
      openGraph: {
        type: 'website',
        url: 'https://michaeluloth.com/likes/',
        siteName: 'Michael Uloth',
        locale: SITE_LOCALE,
        images: ['/og-image.png'],
      },
      twitter: {
        card: 'summary_large_image',
        creator: '@ooloth',
        title: 'Likes',
        description: 'My favorite TV shows, movies, books, albums, and podcasts',
        images: ['/og-image.png'],
      },
    })
  })
})

describe('Likes page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('success cases', () => {
    it('fetches all media types in two steps during build', async () => {
      // Mock all API responses
      const mockTvShows = [
        {
          id: 1,
          title: 'TV Show 1',
          date: '2024-01-01',
          imageUrl: 'https://image.tmdb.org/tv1.jpg',
          link: 'https://tmdb.org/tv/1',
        },
      ]

      const mockMovies = [
        {
          id: 2,
          title: 'Movie 1',
          date: '2024-02-01',
          imageUrl: 'https://image.tmdb.org/movie1.jpg',
          link: 'https://tmdb.org/movie/2',
        },
      ]

      const mockBooks = [
        {
          id: '3',
          title: 'Book 1',
          date: '2024-03-01',
          imageUrl: 'https://itunes.apple.com/book1.jpg',
          link: 'https://books.apple.com/3',
        },
      ]

      const mockAlbums = [
        {
          id: '4',
          title: 'Album 1',
          artist: 'Artist 1',
          date: '2024-04-01',
          imageUrl: 'https://itunes.apple.com/album1.jpg',
          link: 'https://music.apple.com/4',
        },
      ]

      const mockPodcasts = [
        {
          id: '5',
          title: 'Podcast 1',
          date: '2024-05-01',
          imageUrl: 'https://itunes.apple.com/podcast1.jpg',
          link: 'https://podcasts.apple.com/5',
        },
      ]

      // Mock Notion items (Step 1)
      const mockMediaItem: NotionMediaItem = { id: '999', appleId: 999, name: 'Test', date: '2024-01-01' }
      vi.mocked(getMediaItems).mockResolvedValue(Ok([mockMediaItem]))

      // Mock TMDB (Step 2)
      vi.mocked(fetchTmdbList).mockImplementation(async (_listId: string, mediaType: 'tv' | 'movie') => {
        if (mediaType === 'tv') return Ok(mockTvShows)
        if (mediaType === 'movie') return Ok(mockMovies)
        return Ok([])
      })

      // Mock iTunes (Step 2)
      vi.mocked(fetchItunesItems).mockImplementation(
        async (_items: Array<{ id: number; name: string; date: string }>, category: string) => {
          if (category === 'books') return Ok(mockBooks as iTunesItem[])
          if (category === 'albums') return Ok(mockAlbums as iTunesItem[])
          if (category === 'podcasts') return Ok(mockPodcasts as iTunesItem[])
          return Ok([])
        },
      )

      const jsx = await Likes()
      render(jsx)

      // Verify Step 1: Notion items fetched
      expect(getMediaItems).toHaveBeenCalledTimes(3) // books, albums, podcasts
      expect(getMediaItems).toHaveBeenCalledWith({ category: 'books' })
      expect(getMediaItems).toHaveBeenCalledWith({ category: 'albums' })
      expect(getMediaItems).toHaveBeenCalledWith({ category: 'podcasts' })

      // Verify Step 2: TMDB and iTunes fetched
      expect(fetchTmdbList).toHaveBeenCalledWith(expect.any(String), 'tv')
      expect(fetchTmdbList).toHaveBeenCalledWith(expect.any(String), 'movie')
      expect(fetchItunesItems).toHaveBeenCalledTimes(3)

      // Verify page structure
      expect(screen.getByRole('main')).toBeInTheDocument()
      expect(screen.getByRole('main')).toHaveClass('flex-auto')

      // Verify heading
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Likes')

      // Verify section headings exist
      expect(screen.getByRole('heading', { level: 2, name: /tv/i })).toBeInTheDocument()
      expect(screen.getByRole('heading', { level: 2, name: /movies/i })).toBeInTheDocument()
      expect(screen.getByRole('heading', { level: 2, name: /books/i })).toBeInTheDocument()
      expect(screen.getByRole('heading', { level: 2, name: /albums/i })).toBeInTheDocument()
      expect(screen.getByRole('heading', { level: 2, name: /podcasts/i })).toBeInTheDocument()
    })

    it('handles empty responses from all APIs', async () => {
      vi.mocked(fetchTmdbList).mockResolvedValue(Ok([]))
      vi.mocked(getMediaItems).mockResolvedValue(Ok([]))
      vi.mocked(fetchItunesItems).mockResolvedValue(Ok([]))

      const jsx = await Likes()
      render(jsx)

      expect(screen.getByRole('main')).toBeInTheDocument()
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Likes')
    })
  })

  describe('error cases', () => {
    it('throws when TMDB TV fetch fails', async () => {
      const error = new Error('TMDB TV API error')
      vi.mocked(fetchTmdbList).mockImplementation(async (_listId: string, mediaType: 'tv' | 'movie') => {
        if (mediaType === 'tv') return Err(error)
        return Ok([])
      })
      vi.mocked(getMediaItems).mockResolvedValue(Ok([]))
      vi.mocked(fetchItunesItems).mockResolvedValue(Ok([]))

      // Promise.all with .unwrap() should throw on first failure
      await expect(Likes()).rejects.toThrow('TMDB TV API error')
    })

    it('throws when TMDB movies fetch fails', async () => {
      const error = new Error('TMDB movies API error')
      vi.mocked(fetchTmdbList).mockImplementation(async (_listId: string, mediaType: 'tv' | 'movie') => {
        if (mediaType === 'tv') return Ok([])
        if (mediaType === 'movie') return Err(error)
        return Ok([])
      })
      vi.mocked(getMediaItems).mockResolvedValue(Ok([]))
      vi.mocked(fetchItunesItems).mockResolvedValue(Ok([]))

      await expect(Likes()).rejects.toThrow('TMDB movies API error')
    })

    it('throws when books fetch fails', async () => {
      const error = new Error('Books fetch failed')
      vi.mocked(fetchTmdbList).mockResolvedValue(Ok([]))
      vi.mocked(getMediaItems).mockImplementation(async ({ category }: { category: string }) => {
        if (category === 'books') return Err(error)
        return Ok([])
      })
      vi.mocked(fetchItunesItems).mockResolvedValue(Ok([]))

      await expect(Likes()).rejects.toThrow('Books fetch failed')
    })

    it('throws when albums fetch fails', async () => {
      const error = new Error('Albums fetch failed')
      vi.mocked(fetchTmdbList).mockResolvedValue(Ok([]))
      vi.mocked(getMediaItems).mockImplementation(async ({ category }: { category: string }) => {
        if (category === 'albums') return Err(error)
        return Ok([])
      })
      vi.mocked(fetchItunesItems).mockResolvedValue(Ok([]))

      await expect(Likes()).rejects.toThrow('Albums fetch failed')
    })

    it('throws when podcasts fetch fails', async () => {
      const error = new Error('Podcasts fetch failed')
      vi.mocked(fetchTmdbList).mockResolvedValue(Ok([]))
      vi.mocked(getMediaItems).mockImplementation(async ({ category }: { category: string }) => {
        if (category === 'podcasts') return Err(error)
        return Ok([])
      })
      vi.mocked(fetchItunesItems).mockResolvedValue(Ok([]))

      await expect(Likes()).rejects.toThrow('Podcasts fetch failed')
    })

    it('throws when iTunes API fails for any category', async () => {
      const error = new Error('iTunes API error')
      const mockMediaItem: NotionMediaItem = { id: '1', appleId: 1, name: 'Test', date: '2024-01-01' }
      vi.mocked(fetchTmdbList).mockResolvedValue(Ok([]))
      vi.mocked(getMediaItems).mockResolvedValue(Ok([mockMediaItem]))
      vi.mocked(fetchItunesItems).mockResolvedValue(Err(error))

      await expect(Likes()).rejects.toThrow('iTunes API error')
    })
  })
})
