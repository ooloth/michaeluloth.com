import { transformNotionPagesToPostListItems, INVALID_POST_ERROR, INVALID_POST_PROPERTIES_ERROR } from './getPosts'
import {
  createRichTextProperty,
  createTitleProperty,
  createDateProperty,
  createFilesProperty,
} from './testing/property-factories'

describe('transformNotionPagesToPostListItems', () => {
  it('transforms valid Notion pages to post list items', () => {
    const pages = [
      {
        id: '123',
        properties: {
          Slug: createRichTextProperty('hello-world'),
          Title: createTitleProperty('Hello World'),
          Description: createRichTextProperty('A great post'),
          'First published': createDateProperty('2024-01-15'),
          'Featured image': createFilesProperty(['https://example.com/image.jpg']),
        },
      },
    ]

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
          Slug: createRichTextProperty('minimal-post'),
          Title: createTitleProperty('Minimal Post'),
          Description: createRichTextProperty(null),
          'First published': createDateProperty('2024-02-20'),
          'Featured image': createFilesProperty([]),
        },
      },
    ]

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

    expect(() => transformNotionPagesToPostListItems(pages)).toThrow(INVALID_POST_PROPERTIES_ERROR)
  })

  it.each([
    {
      case: 'missing slug',
      properties: {
        Slug: createRichTextProperty(null),
        Title: createTitleProperty('Valid Title'),
        Description: createRichTextProperty(null),
        'First published': createDateProperty('2024-01-15'),
        'Featured image': createFilesProperty([]),
      },
    },
    {
      case: 'empty slug',
      properties: {
        Slug: createRichTextProperty(''),
        Title: createTitleProperty('Valid Title'),
        Description: createRichTextProperty(null),
        'First published': createDateProperty('2024-01-15'),
        'Featured image': createFilesProperty([]),
      },
    },
    {
      case: 'missing title',
      properties: {
        Slug: createRichTextProperty('valid-slug'),
        Title: createTitleProperty(null),
        Description: createRichTextProperty(null),
        'First published': createDateProperty('2024-01-15'),
        'Featured image': createFilesProperty([]),
      },
    },
    {
      case: 'missing firstPublished',
      properties: {
        Slug: createRichTextProperty('valid-slug'),
        Title: createTitleProperty('Valid Title'),
        Description: createRichTextProperty(null),
        'First published': createDateProperty(null),
        'Featured image': createFilesProperty([]),
      },
    },
    {
      case: 'invalid date format',
      properties: {
        Slug: createRichTextProperty('valid-slug'),
        Title: createTitleProperty('Valid Title'),
        Description: createRichTextProperty(null),
        'First published': createDateProperty('01/15/2024'),
        'Featured image': createFilesProperty([]),
      },
    },
    {
      case: 'invalid featuredImage URL',
      expectedError: INVALID_POST_PROPERTIES_ERROR,
      properties: {
        Slug: createRichTextProperty('valid-slug'),
        Title: createTitleProperty('Valid Title'),
        Description: createRichTextProperty(null),
        'First published': createDateProperty('2024-01-15'),
        'Featured image': createFilesProperty(['not-a-url']),
      },
    },
  ])('throws on posts with $case', ({ properties, expectedError }) => {
    const pages = [
      {
        id: '123',
        properties,
      },
    ]

    expect(() => transformNotionPagesToPostListItems(pages)).toThrow(expectedError || INVALID_POST_ERROR)
  })

  it('processes multiple valid posts', () => {
    const pages = [
      {
        id: '123',
        properties: {
          Slug: createRichTextProperty('post-1'),
          Title: createTitleProperty('Post 1'),
          Description: createRichTextProperty(null),
          'First published': createDateProperty('2024-01-01'),
          'Featured image': createFilesProperty([]),
        },
      },
      {
        id: '456',
        properties: {
          Slug: createRichTextProperty('post-2'),
          Title: createTitleProperty('Post 2'),
          Description: createRichTextProperty(null),
          'First published': createDateProperty('2024-02-02'),
          'Featured image': createFilesProperty([]),
        },
      },
    ]

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
          Slug: createRichTextProperty('post-1'),
          Title: createTitleProperty('Post 1'),
          Description: createRichTextProperty(null),
          'First published': createDateProperty('2024-01-01'),
          'Featured image': createFilesProperty([]),
        },
      },
      {
        id: '456',
        properties: {
          Slug: createRichTextProperty('post-2'),
          Title: createTitleProperty(null), // Invalid - missing title
          Description: createRichTextProperty(null),
          'First published': createDateProperty('2024-02-02'),
          'Featured image': createFilesProperty([]),
        },
      },
    ]

    expect(() => transformNotionPagesToPostListItems(pages)).toThrow(INVALID_POST_ERROR)
  })
})
