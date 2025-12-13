import { fetchItunesMedia } from './page'
import getMediaItems from '@/lib/notion/getMediaItems'
import fetchItunesItems from '@/lib/itunes/fetchItunesItems'
import { Ok, Err, isOk, isErr } from '@/utils/result'

// Mock dependencies
vi.mock('@/lib/notion/getMediaItems')
vi.mock('@/lib/itunes/fetchItunesItems')

describe('fetchItunesMedia', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('success cases', () => {
    it('fetches books and enriches with iTunes metadata', async () => {
      const mockMediaItems = [
        { appleId: 1, name: 'Book 1', date: '2024-01-15' },
        { appleId: 2, name: 'Book 2', date: '2024-02-20' },
      ]

      const mockItunesItems = [
        { id: '1', title: 'Book 1', date: '2024-01-15', imageUrl: 'https://example.com/1.jpg', imagePlaceholder: 'base64', link: 'https://books.apple.com/1' },
        { id: '2', title: 'Book 2', date: '2024-02-20', imageUrl: 'https://example.com/2.jpg', imagePlaceholder: 'base64', link: 'https://books.apple.com/2' },
      ]

      vi.mocked(getMediaItems).mockResolvedValue(Ok(mockMediaItems as any))
      vi.mocked(fetchItunesItems).mockResolvedValue(Ok(mockItunesItems as any))

      const result = await fetchItunesMedia('books', 'ebook', 'ebook', false)

      expect(isOk(result)).toBe(true)
      if (isOk(result)) {
        expect(result.value).toEqual(mockItunesItems)
      }

      expect(getMediaItems).toHaveBeenCalledWith({ category: 'books', skipCache: false })
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
      const mockMediaItems = [
        { appleId: 123, name: 'Album 1', date: '2024-03-10' },
      ]

      const mockItunesItems = [
        { id: '123', title: 'Album 1', artist: 'Artist 1', date: '2024-03-10', imageUrl: 'https://example.com/1.jpg', imagePlaceholder: 'base64', link: 'https://music.apple.com/123' },
      ]

      vi.mocked(getMediaItems).mockResolvedValue(Ok(mockMediaItems as any))
      vi.mocked(fetchItunesItems).mockResolvedValue(Ok(mockItunesItems as any))

      const result = await fetchItunesMedia('albums', 'music', 'album', true)

      expect(isOk(result)).toBe(true)
      expect(getMediaItems).toHaveBeenCalledWith({ category: 'albums', skipCache: true })
      expect(fetchItunesItems).toHaveBeenCalledWith(
        [{ id: 123, name: 'Album 1', date: '2024-03-10' }],
        'music',
        'album',
      )
    })

    it('fetches podcasts with correct iTunes parameters', async () => {
      const mockMediaItems = [
        { appleId: 456, name: 'Podcast 1', date: '2024-04-01' },
      ]

      const mockItunesItems = [
        { id: '456', title: 'Podcast 1', date: '2024-04-01', imageUrl: 'https://example.com/1.jpg', imagePlaceholder: 'base64', link: 'https://podcasts.apple.com/456' },
      ]

      vi.mocked(getMediaItems).mockResolvedValue(Ok(mockMediaItems as any))
      vi.mocked(fetchItunesItems).mockResolvedValue(Ok(mockItunesItems as any))

      const result = await fetchItunesMedia('podcasts', 'podcast', 'podcast', false)

      expect(isOk(result)).toBe(true)
      expect(getMediaItems).toHaveBeenCalledWith({ category: 'podcasts', skipCache: false })
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

      const result = await fetchItunesMedia('books', 'ebook', 'ebook', false)

      expect(isErr(result)).toBe(true)
      if (isErr(result)) {
        expect(result.error).toBe(mediaError)
      }

      // Should not call fetchItunesItems if getMediaItems fails
      expect(fetchItunesItems).not.toHaveBeenCalled()
    })

    it('returns Err when fetchItunesItems fails', async () => {
      const mockMediaItems = [
        { appleId: 1, name: 'Book 1', date: '2024-01-15' },
      ]

      const itunesError = new Error('iTunes API error')
      vi.mocked(getMediaItems).mockResolvedValue(Ok(mockMediaItems as any))
      vi.mocked(fetchItunesItems).mockResolvedValue(Err(itunesError))

      const result = await fetchItunesMedia('books', 'ebook', 'ebook', false)

      expect(isErr(result)).toBe(true)
      if (isErr(result)) {
        expect(result.error).toBe(itunesError)
      }
    })
  })

  describe('data transformation', () => {
    it('correctly maps media items to iTunes lookup format', async () => {
      const mockMediaItems = [
        { appleId: 111, name: 'Item 1', date: '2024-01-01', otherField: 'ignored' },
        { appleId: 222, name: 'Item 2', date: '2024-02-02', otherField: 'ignored' },
        { appleId: 333, name: 'Item 3', date: '2024-03-03', otherField: 'ignored' },
      ]

      vi.mocked(getMediaItems).mockResolvedValue(Ok(mockMediaItems as any))
      vi.mocked(fetchItunesItems).mockResolvedValue(Ok([] as any))

      await fetchItunesMedia('books', 'ebook', 'ebook', false)

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
