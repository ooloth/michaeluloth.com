import { transformNotionPageToPost, INVALID_POST_DETAILS_ERROR, INVALID_POST_PROPERTIES_ERROR } from './getPost'
import {
  createRichTextProperty,
  createTitleProperty,
  createDateProperty,
  createFilesProperty,
} from './testing/property-factories'

describe('transformNotionPageToPost', () => {
  it('transforms valid Notion page to post', () => {
    const page = {
      id: '123',
      last_edited_time: '2024-01-20T10:30:00.000Z',
      properties: {
        Slug: createRichTextProperty('hello-world'),
        Title: createTitleProperty('Hello World'),
        Description: createRichTextProperty('A great post'),
        'First published': createDateProperty('2024-01-15'),
        'Featured image': createFilesProperty(['https://example.com/image.jpg']),
      },
    }

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
        Slug: createRichTextProperty('minimal-post'),
        Title: createTitleProperty('Minimal Post'),
        Description: createRichTextProperty(null),
        'First published': createDateProperty('2024-02-20'),
        'Featured image': createFilesProperty([]),
      },
    }

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
    const page = {
      id: '123',
      last_edited_time: '2024-01-01T00:00:00.000Z',
      properties,
    }

    expect(() => transformNotionPageToPost(page)).toThrow(expectedError || INVALID_POST_DETAILS_ERROR)
  })
})
