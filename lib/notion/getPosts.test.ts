// Mock getPropertyValue before any imports
const mockGetPropertyValue = vi.hoisted(() => vi.fn())

vi.mock('./getPropertyValue', () => ({
  default: mockGetPropertyValue,
}))

import { transformNotionPagesToPostListItems, INVALID_POST_ERROR } from './getPosts'

describe('transformNotionPagesToPostListItems', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('transforms valid Notion pages to post list items', () => {
    const pages = [
      {
        id: '123',
        properties: {
          Slug: {},
          Title: {},
          Description: {},
          'First published': {},
          'Featured image': {},
        },
      },
    ]

    mockGetPropertyValue
      .mockReturnValueOnce('hello-world')
      .mockReturnValueOnce('Hello World')
      .mockReturnValueOnce('A great post')
      .mockReturnValueOnce('2024-01-15')
      .mockReturnValueOnce('https://example.com/image.jpg')

    const result = transformNotionPagesToPostListItems(pages)

    expect(result).toEqual([
      {
        id: '123',
        slug: 'hello-world',
        title: 'Hello World',
        description: 'A great post',
        firstPublished: '2024-01-15',
        featuredImage: 'https://example.com/image.jpg',
      },
    ])
  })

  it('transforms valid posts with optional fields missing', () => {
    const pages = [
      {
        id: '456',
        properties: {
          Slug: {},
          Title: {},
          Description: {},
          'First published': {},
          'Featured image': {},
        },
      },
    ]

    mockGetPropertyValue
      .mockReturnValueOnce('minimal-post')
      .mockReturnValueOnce('Minimal Post')
      .mockReturnValueOnce(null) // No description
      .mockReturnValueOnce('2024-02-20')
      .mockReturnValueOnce(null) // No featured image

    const result = transformNotionPagesToPostListItems(pages)

    expect(result).toEqual([
      {
        id: '456',
        slug: 'minimal-post',
        title: 'Minimal Post',
        description: null,
        firstPublished: '2024-02-20',
        featuredImage: null,
      },
    ])
  })

  it('throws on pages without properties', () => {
    const pages = [
      { id: '123' }, // No properties
    ]

    expect(() => transformNotionPagesToPostListItems(pages)).toThrow(INVALID_POST_ERROR)
  })

  it('throws on posts with missing slug', () => {
    const pages = [
      {
        id: '123',
        properties: {
          Slug: {},
          Title: {},
          'First published': {},
        },
      },
    ]

    mockGetPropertyValue
      .mockReturnValueOnce(null) // Missing slug
      .mockReturnValueOnce('Valid Title')
      .mockReturnValueOnce(null)
      .mockReturnValueOnce('2024-01-15')
      .mockReturnValueOnce(null)

    expect(() => transformNotionPagesToPostListItems(pages)).toThrow(INVALID_POST_ERROR)
  })

  it('throws on posts with empty slug', () => {
    const pages = [
      {
        id: '123',
        properties: {
          Slug: {},
          Title: {},
          'First published': {},
        },
      },
    ]

    mockGetPropertyValue
      .mockReturnValueOnce('') // Empty slug
      .mockReturnValueOnce('Valid Title')
      .mockReturnValueOnce(null)
      .mockReturnValueOnce('2024-01-15')
      .mockReturnValueOnce(null)

    expect(() => transformNotionPagesToPostListItems(pages)).toThrow(INVALID_POST_ERROR)
  })

  it('throws on posts with missing title', () => {
    const pages = [
      {
        id: '123',
        properties: {
          Slug: {},
          Title: {},
          'First published': {},
        },
      },
    ]

    mockGetPropertyValue
      .mockReturnValueOnce('valid-slug')
      .mockReturnValueOnce(null) // Missing title
      .mockReturnValueOnce(null)
      .mockReturnValueOnce('2024-01-15')
      .mockReturnValueOnce(null)

    expect(() => transformNotionPagesToPostListItems(pages)).toThrow(INVALID_POST_ERROR)
  })

  it('throws on posts with missing firstPublished', () => {
    const pages = [
      {
        id: '123',
        properties: {
          Slug: {},
          Title: {},
          'First published': {},
        },
      },
    ]

    mockGetPropertyValue
      .mockReturnValueOnce('valid-slug')
      .mockReturnValueOnce('Valid Title')
      .mockReturnValueOnce(null)
      .mockReturnValueOnce(null) // Missing firstPublished
      .mockReturnValueOnce(null)

    expect(() => transformNotionPagesToPostListItems(pages)).toThrow(INVALID_POST_ERROR)
  })

  it('throws on posts with invalid date format', () => {
    const pages = [
      {
        id: '123',
        properties: {
          Slug: {},
          Title: {},
          'First published': {},
        },
      },
    ]

    mockGetPropertyValue
      .mockReturnValueOnce('valid-slug')
      .mockReturnValueOnce('Valid Title')
      .mockReturnValueOnce(null)
      .mockReturnValueOnce('01/15/2024') // Invalid date format
      .mockReturnValueOnce(null)

    expect(() => transformNotionPagesToPostListItems(pages)).toThrow(INVALID_POST_ERROR)
  })

  it('throws on posts with invalid featuredImage URL', () => {
    const pages = [
      {
        id: '123',
        properties: {
          Slug: {},
          Title: {},
          'First published': {},
          'Featured image': {},
        },
      },
    ]

    mockGetPropertyValue
      .mockReturnValueOnce('valid-slug')
      .mockReturnValueOnce('Valid Title')
      .mockReturnValueOnce(null)
      .mockReturnValueOnce('2024-01-15')
      .mockReturnValueOnce('not-a-url') // Invalid URL

    expect(() => transformNotionPagesToPostListItems(pages)).toThrow(INVALID_POST_ERROR)
  })

  it('processes multiple valid posts', () => {
    const pages = [
      {
        id: '123',
        properties: {
          Slug: {},
          Title: {},
          'First published': {},
        },
      },
      {
        id: '456',
        properties: {
          Slug: {},
          Title: {},
          'First published': {},
        },
      },
    ]

    mockGetPropertyValue
      .mockReturnValueOnce('post-1')
      .mockReturnValueOnce('Post 1')
      .mockReturnValueOnce(null)
      .mockReturnValueOnce('2024-01-01')
      .mockReturnValueOnce(null)
      .mockReturnValueOnce('post-2')
      .mockReturnValueOnce('Post 2')
      .mockReturnValueOnce(null)
      .mockReturnValueOnce('2024-02-02')
      .mockReturnValueOnce(null)

    const result = transformNotionPagesToPostListItems(pages)

    expect(result).toHaveLength(2)
    expect(result[0].slug).toBe('post-1')
    expect(result[1].slug).toBe('post-2')
  })

  it('throws on first invalid post in mixed list', () => {
    const pages = [
      {
        id: '123',
        properties: {
          Slug: {},
          Title: {},
          'First published': {},
        },
      },
      {
        id: '456',
        properties: {
          Slug: {},
          Title: {},
          'First published': {},
        },
      },
    ]

    mockGetPropertyValue
      .mockReturnValueOnce('post-1')
      .mockReturnValueOnce('Post 1')
      .mockReturnValueOnce(null)
      .mockReturnValueOnce('2024-01-01')
      .mockReturnValueOnce(null)
      .mockReturnValueOnce('post-2')
      .mockReturnValueOnce(null) // Invalid - missing title
      .mockReturnValueOnce(null)
      .mockReturnValueOnce('2024-02-02')
      .mockReturnValueOnce(null)

    expect(() => transformNotionPagesToPostListItems(pages)).toThrow(INVALID_POST_ERROR)
  })
})
