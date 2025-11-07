import notion, { collectPaginatedAPI } from './client'

/**
 * Fetches published blog posts from a Notion data source.
 * Filters posts by destination, status, title, slug, description, and publication date.
 * Sorts the posts by the first published date in descending order.
 *
 * @see https://github.com/makenotion/notion-sdk-js?tab=readme-ov-file#collectpaginatedapilistfn-firstpageargs
 */
export default async function getPosts(): Promise<any[]> {
  const posts = await collectPaginatedAPI(notion.dataSources.query, {
    data_source_id: process.env.NOTION_DATA_SOURCE_ID_WRITING ?? '',
    filter: {
      and: [
        { property: 'Destination', multi_select: { contains: 'blog' } },
        { property: 'Status', status: { equals: 'Published' } },
        { property: 'Title', title: { is_not_empty: true } },
        { property: 'Slug', rich_text: { is_not_empty: true } },
        { property: 'Description', rich_text: { is_not_empty: true } },
        // NOTE: link posts don't have featured images atm
        // { property: 'Featured image', url: { is_not_empty: true } },
        { property: 'First published', date: { on_or_before: new Date().toISOString() } },
      ],
    },
    sorts: [{ property: 'First published', direction: 'descending' }],
  })

  // TODO: parse with zod

  return posts
}
