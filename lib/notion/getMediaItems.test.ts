import {
  transformNotionPagesToMediaItems,
  INVALID_MEDIA_ITEM_ERROR,
  INVALID_MEDIA_PROPERTIES_ERROR,
  type NotionMediaItem,
} from './getMediaItems'
import { createTitleProperty, createNumberProperty, createDateProperty } from './testing/property-factories'

describe('transformNotionPagesToMediaItems', () => {
  it('transforms valid Notion pages to media items', () => {
    const pages = [
      {
        id: '123',
        properties: {
          Title: createTitleProperty('The Great Gatsby'),
          'Apple ID': createNumberProperty(12345),
          Date: createDateProperty('2024-01-15'),
        },
      },
    ]

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

    expect(() => transformNotionPagesToMediaItems(pages, 'books')).toThrow(INVALID_MEDIA_ITEM_ERROR.books)
  })

  it.each([
    {
      case: 'missing name',
      properties: {
        Title: createTitleProperty(null),
        'Apple ID': createNumberProperty(12345),
        Date: createDateProperty('2024-01-15'),
      },
    },
    {
      case: 'missing appleId',
      properties: {
        Title: createTitleProperty('Valid Book'),
        'Apple ID': createNumberProperty(null),
        Date: createDateProperty('2024-01-15'),
      },
    },
    {
      case: 'missing date',
      properties: {
        Title: createTitleProperty('Valid Book'),
        'Apple ID': createNumberProperty(12345),
        Date: createDateProperty(null),
      },
    },
    {
      case: 'invalid appleId (not a number)',
      expectedError: INVALID_MEDIA_PROPERTIES_ERROR.books,
      properties: {
        Title: createTitleProperty('Valid Book'),
        'Apple ID': { type: 'number' as const, number: 'not-a-number' as any }, // Invalid type
        Date: createDateProperty('2024-01-15'),
      },
    },
    {
      case: 'invalid date format',
      properties: {
        Title: createTitleProperty('Valid Book'),
        'Apple ID': createNumberProperty(12345),
        Date: createDateProperty('01/15/2024'),
      },
    },
    {
      case: 'negative appleId',
      properties: {
        Title: createTitleProperty('Valid Book'),
        'Apple ID': createNumberProperty(-12345),
        Date: createDateProperty('2024-01-15'),
      },
    },
  ])('throws on items with $case', ({ properties, expectedError }) => {
    const pages = [
      {
        id: '123',
        properties,
      },
    ]

    expect(() => transformNotionPagesToMediaItems(pages, 'books')).toThrow(
      expectedError || INVALID_MEDIA_ITEM_ERROR.books
    )
  })

  it('processes multiple valid items', () => {
    const pages = [
      {
        id: '123',
        properties: {
          Title: createTitleProperty('Book 1'),
          'Apple ID': createNumberProperty(111),
          Date: createDateProperty('2024-01-01'),
        },
      },
      {
        id: '456',
        properties: {
          Title: createTitleProperty('Book 2'),
          'Apple ID': createNumberProperty(222),
          Date: createDateProperty('2024-02-02'),
        },
      },
    ]

    const result = transformNotionPagesToMediaItems(pages, 'books')

    expect(result).toHaveLength(2)
    expect(result[0].name).toBe('Book 1')
    expect(result[1].name).toBe('Book 2')
  })
})
