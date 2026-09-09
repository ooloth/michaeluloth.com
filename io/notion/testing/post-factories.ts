import { type PostListItem } from '@/io/notion/schemas/post'

/**
 * Builds a valid PostListItem so a test states only the fields it cares about.
 * Shared by the component and page tests that render post lists.
 */
export function createPostListItem(overrides: Partial<PostListItem> = {}): PostListItem {
  return {
    id: '1',
    slug: 'test-post',
    title: 'Test Post',
    description: 'Test description',
    firstPublished: '2024-03-15',
    featuredImage: null,
    featuredOrder: null,
    ...overrides,
  }
}
