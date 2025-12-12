// Mock getPropertyValue before any imports
const mockGetPropertyValue = vi.hoisted(() => vi.fn())

vi.mock('./getPropertyValue', () => ({
  default: mockGetPropertyValue,
}))

import { transformNotionPageToPost, INVALID_POST_DETAILS_ERROR } from './getPost'

describe('transformNotionPageToPost', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('transforms valid Notion page to post', () => {
    const page = {
      id: '123',
      last_edited_time: '2024-01-20T10:30:00.000Z',
      properties: {
        Slug: {},
        Title: {},
        Description: {},
        'First published': {},
        'Featured image': {},
      },
    }

    mockGetPropertyValue
      .mockReturnValueOnce('hello-world')
      .mockReturnValueOnce('Hello World')
      .mockReturnValueOnce('A great post')
      .mockReturnValueOnce('2024-01-15')
      .mockReturnValueOnce('https://example.com/image.jpg')

    const result = transformNotionPageToPost(page)

    expect(result).toEqual({
      id: '123',
      slug: 'hello-world',
      title: 'Hello World',
      description: 'A great post',
      firstPublished: '2024-01-15',
      featuredImage: 'https://example.com/image.jpg',
      lastEditedTime: '2024-01-20T10:30:00.000Z',
      blocks: [],
      prevPost: null,
      nextPost: null,
    })
  })

  it('transforms valid post with optional fields missing', () => {
    const page = {
      id: '456',
      last_edited_time: '2024-02-25T15:45:30.000Z',
      properties: {
        Slug: {},
        Title: {},
        Description: {},
        'First published': {},
        'Featured image': {},
      },
    }

    mockGetPropertyValue
      .mockReturnValueOnce('minimal-post')
      .mockReturnValueOnce('Minimal Post')
      .mockReturnValueOnce(null) // No description
      .mockReturnValueOnce('2024-02-20')
      .mockReturnValueOnce(null) // No featured image

    const result = transformNotionPageToPost(page)

    expect(result).toEqual({
      id: '456',
      slug: 'minimal-post',
      title: 'Minimal Post',
      description: null,
      firstPublished: '2024-02-20',
      featuredImage: null,
      lastEditedTime: '2024-02-25T15:45:30.000Z',
      blocks: [],
      prevPost: null,
      nextPost: null,
    })
  })

  it('throws on pages without properties', () => {
    const page = { id: '123', last_edited_time: '2024-01-01T00:00:00.000Z' }

    expect(() => transformNotionPageToPost(page)).toThrow(INVALID_POST_DETAILS_ERROR)
  })

  it('throws on pages without id', () => {
    const page = {
      last_edited_time: '2024-01-01T00:00:00.000Z',
      properties: { Slug: {}, Title: {} },
    }

    expect(() => transformNotionPageToPost(page)).toThrow(INVALID_POST_DETAILS_ERROR)
  })

  it('throws on pages without last_edited_time', () => {
    const page = {
      id: '123',
      properties: { Slug: {}, Title: {} },
    }

    expect(() => transformNotionPageToPost(page)).toThrow(INVALID_POST_DETAILS_ERROR)
  })

  it('throws on posts with missing slug', () => {
    const page = {
      id: '123',
      last_edited_time: '2024-01-01T00:00:00.000Z',
      properties: {
        Slug: {},
        Title: {},
        'First published': {},
      },
    }

    mockGetPropertyValue
      .mockReturnValueOnce(null) // Missing slug
      .mockReturnValueOnce('Valid Title')
      .mockReturnValueOnce(null)
      .mockReturnValueOnce('2024-01-15')
      .mockReturnValueOnce(null)

    expect(() => transformNotionPageToPost(page)).toThrow(INVALID_POST_DETAILS_ERROR)
  })

  it('throws on posts with missing title', () => {
    const page = {
      id: '123',
      last_edited_time: '2024-01-01T00:00:00.000Z',
      properties: {
        Slug: {},
        Title: {},
        'First published': {},
      },
    }

    mockGetPropertyValue
      .mockReturnValueOnce('valid-slug')
      .mockReturnValueOnce(null) // Missing title
      .mockReturnValueOnce(null)
      .mockReturnValueOnce('2024-01-15')
      .mockReturnValueOnce(null)

    expect(() => transformNotionPageToPost(page)).toThrow(INVALID_POST_DETAILS_ERROR)
  })

  it('throws on posts with missing firstPublished', () => {
    const page = {
      id: '123',
      last_edited_time: '2024-01-01T00:00:00.000Z',
      properties: {
        Slug: {},
        Title: {},
        'First published': {},
      },
    }

    mockGetPropertyValue
      .mockReturnValueOnce('valid-slug')
      .mockReturnValueOnce('Valid Title')
      .mockReturnValueOnce(null)
      .mockReturnValueOnce(null) // Missing firstPublished
      .mockReturnValueOnce(null)

    expect(() => transformNotionPageToPost(page)).toThrow(INVALID_POST_DETAILS_ERROR)
  })

  it('throws on posts with invalid date format', () => {
    const page = {
      id: '123',
      last_edited_time: '2024-01-01T00:00:00.000Z',
      properties: {
        Slug: {},
        Title: {},
        'First published': {},
      },
    }

    mockGetPropertyValue
      .mockReturnValueOnce('valid-slug')
      .mockReturnValueOnce('Valid Title')
      .mockReturnValueOnce(null)
      .mockReturnValueOnce('01/15/2024') // Invalid date format
      .mockReturnValueOnce(null)

    expect(() => transformNotionPageToPost(page)).toThrow(INVALID_POST_DETAILS_ERROR)
  })

  it('throws on posts with invalid featuredImage URL', () => {
    const page = {
      id: '123',
      last_edited_time: '2024-01-01T00:00:00.000Z',
      properties: {
        Slug: {},
        Title: {},
        'First published': {},
        'Featured image': {},
      },
    }

    mockGetPropertyValue
      .mockReturnValueOnce('valid-slug')
      .mockReturnValueOnce('Valid Title')
      .mockReturnValueOnce(null)
      .mockReturnValueOnce('2024-01-15')
      .mockReturnValueOnce('not-a-url') // Invalid URL

    expect(() => transformNotionPageToPost(page)).toThrow(INVALID_POST_DETAILS_ERROR)
  })
})
