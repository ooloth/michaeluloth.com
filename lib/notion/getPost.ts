import notion from './client'
import getBlockChildren from './getBlockChildren'

type Options = {
  slug: string
  includeBlocks: boolean
}

type PostProperties = {}

type PostBlocks = {}

type PostWithBlocks = {
  properties: PostProperties
  blocks: PostBlocks
}

/**
 * Fetches a specific blog post from a Notion data source by its "Slug" property.
 * Optionally includes the post's block children.
 *
 * @see https://github.com/makenotion/notion-sdk-js?tab=readme-ov-file#collectpaginatedapilistfn-firstpageargs
 * @see https://developers.notion.com/reference/query-a-data-source
 * @see https://developers.notion.com/reference/filter-data-source-entries
 */
export default async function getPost(options: Options): Promise<any> {
  const { slug, includeBlocks } = options

  const response = await notion.dataSources.query({
    data_source_id: process.env.NOTION_DATA_SOURCE_ID_WRITING ?? '',
    filter: {
      and: [{ property: 'Slug', rich_text: { equals: slug } }],
    },
  })

  if (response.results.length === 0) {
    throw Error(`No post found for slug: ${slug}`)
  }

  if (response.results.length > 1) {
    throw Error(`Multiple posts found for slug: ${slug}\n${JSON.stringify(response.results)}`)
  }

  const post = response.results[0]
  // TODO: parse with zod

  if (includeBlocks) {
    const blocks = await getBlockChildren(post.id)
    // TODO: parse with zod
    return { ...post, blocks }
  }

  return post
}
