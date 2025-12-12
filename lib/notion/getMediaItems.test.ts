// Mock getPropertyValue before any imports
const mockGetPropertyValue = vi.hoisted(() => vi.fn())

vi.mock('./getPropertyValue', () => ({
  default: mockGetPropertyValue,
}))

import { transformNotionPagesToMediaItems, INVALID_MEDIA_ITEM_ERROR, type NotionMediaItem } from './getMediaItems'

describe('transformNotionPagesToMediaItems', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('transforms valid Notion pages to media items', () => {
    const pages = [
      {
        id: '123',
        properties: { Title: {}, 'Apple ID': {}, Date: {} },
      },
    ]

    mockGetPropertyValue
      .mockReturnValueOnce('The Great Gatsby')
      .mockReturnValueOnce(12345)
      .mockReturnValueOnce('2024-01-15')

    const result = transformNotionPagesToMediaItems(pages, 'books')

    expect(result).toEqual([
      {
        id: '123',
        name: 'The Great Gatsby',
        appleId: 12345,
        date: '2024-01-15',
      },
    ])
  })

  it('throws on pages without properties', () => {
    const pages = [
      { id: '123' }, // No properties
    ]

    expect(() => transformNotionPagesToMediaItems(pages, 'books')).toThrow(INVALID_MEDIA_ITEM_ERROR.book)
  })

  it.each([
    { case: 'missing name', mocks: [null, 12345, '2024-01-15'] },
    { case: 'missing appleId', mocks: ['Valid Book', null, '2024-01-15'] },
    { case: 'missing date', mocks: ['Valid Book', 12345, null] },
    { case: 'invalid appleId (not a number)', mocks: ['Valid Book', 'not-a-number', '2024-01-15'] },
    { case: 'invalid date format', mocks: ['Valid Book', 12345, '01/15/2024'] },
    { case: 'negative appleId', mocks: ['Valid Book', -12345, '2024-01-15'] },
  ])('throws on items with $case', ({ mocks }) => {
    const pages = [
      {
        id: '123',
        properties: { Title: {}, 'Apple ID': {}, Date: {} },
      },
    ]

    mocks.forEach(val => mockGetPropertyValue.mockReturnValueOnce(val))

    expect(() => transformNotionPagesToMediaItems(pages, 'books')).toThrow(INVALID_MEDIA_ITEM_ERROR.book)
  })

  it('processes multiple valid items', () => {
    const pages = [
      {
        id: '123',
        properties: { Title: {}, 'Apple ID': {}, Date: {} },
      },
      {
        id: '456',
        properties: { Title: {}, 'Apple ID': {}, Date: {} },
      },
    ]

    mockGetPropertyValue
      .mockReturnValueOnce('Book 1')
      .mockReturnValueOnce(111)
      .mockReturnValueOnce('2024-01-01')
      .mockReturnValueOnce('Book 2')
      .mockReturnValueOnce(222)
      .mockReturnValueOnce('2024-02-02')

    const result = transformNotionPagesToMediaItems(pages, 'books')

    expect(result).toHaveLength(2)
    expect(result[0].name).toBe('Book 1')
    expect(result[1].name).toBe('Book 2')
  })
})
