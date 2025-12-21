/**
 * @vitest-environment happy-dom
 */

import { render, screen } from '@testing-library/react'
import { fetchItunesMedia, metadata } from './page'
import Likes from './page'
import getMediaItems, { type NotionMediaItem } from '@/io/notion/getMediaItems'
import fetchItunesItems, { type iTunesItem } from '@/io/itunes/fetchItunesItems'
import fetchTmdbList from '@/io/tmdb/fetchTmdbList'
import { Ok, Err, isOk, isErr } from '@/utils/errors/result'

// Mock dependencies
vi.mock('@/io/notion/getMediaItems')
vi.mock('@/io/itunes/fetchItunesItems')
vi.mock('@/io/tmdb/fetchTmdbList')

describe('Likes page metadata', () => {
  it('exports metadata with simplified title using template', () => {
    expect(metadata).toEqual({
      title: 'Likes',
      description: 'My favorite TV shows, movies, books, albums, and podcasts',
      openGraph: {
        type: 'website',
        url: 'https://michaeluloth.com/likes/',
        siteName: 'Michael Uloth',
        locale: 'en_CA',
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

describe('fetchItunesMedia', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('success cases', () => {
    it('fetches books and enriches with iTunes metadata', async () => {
      const mockMediaItems: NotionMediaItem[] = [
        { id: '1', appleId: 1, name: 'Book 1', date: '2024-01-15' },
        { id: '2', appleId: 2, name: 'Book 2', date: '2024-02-20' },
      ]

      const mockItunesItems = [
        {
          id: '1',
          title: 'Book 1',
          date: '2024-01-15',
          imageUrl: 'https://example.com/1.jpg',
          imagePlaceholder: 'base64',
          link: 'https://books.apple.com/1',
        },
        {
          id: '2',
          title: 'Book 2',
          date: '2024-02-20',
          imageUrl: 'https://example.com/2.jpg',
          imagePlaceholder: 'base64',
          link: 'https://books.apple.com/2',
        },
      ]

      vi.mocked(getMediaItems).mockResolvedValue(Ok(mockMediaItems))
      vi.mocked(fetchItunesItems).mockResolvedValue(Ok(mockItunesItems as iTunesItem[]))

      const result = await fetchItunesMedia('books', 'ebook', 'ebook')

      expect(isOk(result)).toBe(true)
      if (isOk(result)) {
        expect(result.value).toEqual(mockItunesItems)
      }

      expect(getMediaItems).toHaveBeenCalledWith({ category: 'books' })
      expect(fetchItunesItems).toHaveBeenCalledWith(
        [
          { id: 1, name: 'Book 1', date: '2024-01-15' },
          { id: 2, name: 'Book 2', date: '2024-02-20' },
        ],
        'ebook',
        'ebook',
      )
    })

    it('fetches albums with correct iTunes parameters', async () => {
      const mockMediaItems: NotionMediaItem[] = [{ id: '123', appleId: 123, name: 'Album 1', date: '2024-03-10' }]

      const mockItunesItems = [
        {
          id: '123',
          title: 'Album 1',
          artist: 'Artist 1',
          date: '2024-03-10',
          imageUrl: 'https://example.com/1.jpg',
          imagePlaceholder: 'base64',
          link: 'https://music.apple.com/123',
        },
      ]

      vi.mocked(getMediaItems).mockResolvedValue(Ok(mockMediaItems))
      vi.mocked(fetchItunesItems).mockResolvedValue(Ok(mockItunesItems as iTunesItem[]))

      const result = await fetchItunesMedia('albums', 'music', 'album')

      expect(isOk(result)).toBe(true)
      expect(getMediaItems).toHaveBeenCalledWith({ category: 'albums' })
      expect(fetchItunesItems).toHaveBeenCalledWith(
        [{ id: 123, name: 'Album 1', date: '2024-03-10' }],
        'music',
        'album',
      )
    })

    it('fetches podcasts with correct iTunes parameters', async () => {
      const mockMediaItems: NotionMediaItem[] = [{ id: '456', appleId: 456, name: 'Podcast 1', date: '2024-04-01' }]

      const mockItunesItems = [
        {
          id: '456',
          title: 'Podcast 1',
          date: '2024-04-01',
          imageUrl: 'https://example.com/1.jpg',
          imagePlaceholder: 'base64',
          link: 'https://podcasts.apple.com/456',
        },
      ]

      vi.mocked(getMediaItems).mockResolvedValue(Ok(mockMediaItems))
      vi.mocked(fetchItunesItems).mockResolvedValue(Ok(mockItunesItems as iTunesItem[]))

      const result = await fetchItunesMedia('podcasts', 'podcast', 'podcast')

      expect(isOk(result)).toBe(true)
      expect(getMediaItems).toHaveBeenCalledWith({ category: 'podcasts' })
      expect(fetchItunesItems).toHaveBeenCalledWith(
        [{ id: 456, name: 'Podcast 1', date: '2024-04-01' }],
        'podcast',
        'podcast',
      )
    })
  })

  describe('error propagation', () => {
    it('returns Err when getMediaItems fails', async () => {
      const mediaError = new Error('Failed to fetch media items from Notion')
      vi.mocked(getMediaItems).mockResolvedValue(Err(mediaError))

      const result = await fetchItunesMedia('books', 'ebook', 'ebook')

      expect(isErr(result)).toBe(true)
      if (isErr(result)) {
        expect(result.error).toBe(mediaError)
      }

      // Should not call fetchItunesItems if getMediaItems fails
      expect(fetchItunesItems).not.toHaveBeenCalled()
    })

    it('returns Err when fetchItunesItems fails', async () => {
      const mockMediaItems: NotionMediaItem[] = [{ id: '1', appleId: 1, name: 'Book 1', date: '2024-01-15' }]

      const itunesError = new Error('iTunes API error')
      vi.mocked(getMediaItems).mockResolvedValue(Ok(mockMediaItems))
      vi.mocked(fetchItunesItems).mockResolvedValue(Err(itunesError))

      const result = await fetchItunesMedia('books', 'ebook', 'ebook')

      expect(isErr(result)).toBe(true)
      if (isErr(result)) {
        expect(result.error).toBe(itunesError)
      }
    })
  })

  describe('data transformation', () => {
    it('correctly maps media items to iTunes lookup format', async () => {
      const mockMediaItems: NotionMediaItem[] = [
        { id: '111', appleId: 111, name: 'Item 1', date: '2024-01-01' },
        { id: '222', appleId: 222, name: 'Item 2', date: '2024-02-02' },
        { id: '333', appleId: 333, name: 'Item 3', date: '2024-03-03' },
      ]

      vi.mocked(getMediaItems).mockResolvedValue(Ok(mockMediaItems))
      vi.mocked(fetchItunesItems).mockResolvedValue(Ok([] as iTunesItem[]))

      await fetchItunesMedia('books', 'ebook', 'ebook')

      expect(fetchItunesItems).toHaveBeenCalledWith(
        [
          { id: 111, name: 'Item 1', date: '2024-01-01' },
          { id: 222, name: 'Item 2', date: '2024-02-02' },
          { id: 333, name: 'Item 3', date: '2024-03-03' },
        ],
        'ebook',
        'ebook',
      )
    })
  })
})

describe('Likes page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('success cases', () => {
    it('fetches all media types in parallel during build', async () => {
      // Mock all API responses
      const mockTvShows = [
        {
          id: 1,
          title: 'TV Show 1',
          date: '2024-01-01',
          imageUrl: 'https://image.tmdb.org/tv1.jpg',
          imagePlaceholder: 'base64-tv',
          link: 'https://tmdb.org/tv/1',
        },
      ]

      const mockMovies = [
        {
          id: 2,
          title: 'Movie 1',
          date: '2024-02-01',
          imageUrl: 'https://image.tmdb.org/movie1.jpg',
          imagePlaceholder: 'base64-movie',
          link: 'https://tmdb.org/movie/2',
        },
      ]

      const mockBooks = [
        {
          id: '3',
          title: 'Book 1',
          date: '2024-03-01',
          imageUrl: 'https://itunes.apple.com/book1.jpg',
          imagePlaceholder: 'base64-book',
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
          imagePlaceholder: 'base64-album',
          link: 'https://music.apple.com/4',
        },
      ]

      const mockPodcasts = [
        {
          id: '5',
          title: 'Podcast 1',
          date: '2024-05-01',
          imageUrl: 'https://itunes.apple.com/podcast1.jpg',
          imagePlaceholder: 'base64-podcast',
          link: 'https://podcasts.apple.com/5',
        },
      ]

      // Mock TMDB
      vi.mocked(fetchTmdbList).mockImplementation(async (_listId: string, mediaType: 'tv' | 'movie') => {
        if (mediaType === 'tv') return Ok(mockTvShows)
        if (mediaType === 'movie') return Ok(mockMovies)
        return Ok([])
      })

      // Mock Notion + iTunes (via fetchItunesMedia helper)
      vi.mocked(getMediaItems).mockImplementation(async () => {
        const mockMediaItem: NotionMediaItem = { id: '999', appleId: 999, name: 'Test', date: '2024-01-01' }
        return Ok([mockMediaItem])
      })

      vi.mocked(fetchItunesItems).mockImplementation(
        async (_items: Array<{ id: number; name: string; date: string }>, medium: string) => {
          if (medium === 'ebook') return Ok(mockBooks as iTunesItem[])
          if (medium === 'music') return Ok(mockAlbums as iTunesItem[])
          if (medium === 'podcast') return Ok(mockPodcasts as iTunesItem[])
          return Ok([])
        },
      )

      const jsx = await Likes()
      render(jsx)

      // Verify all fetchers were called
      expect(fetchTmdbList).toHaveBeenCalledWith(expect.any(String), 'tv')
      expect(fetchTmdbList).toHaveBeenCalledWith(expect.any(String), 'movie')
      expect(getMediaItems).toHaveBeenCalledTimes(3) // books, albums, podcasts
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
