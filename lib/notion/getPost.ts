import notion from './client'
import getBlockChildren from '@/lib/notion/getBlockChildren'
import getPosts from '@/lib/notion/getPosts'
import getPropertyValue from '@/lib/notion/getPropertyValue'

type Options = {
  slug: string | null
  includeBlocks?: boolean
  includePrevAndNext?: boolean
}

type PostProperties = {}

type PostBlocks = {}

type WithBlocks<T> = T & {
  blocks: PostBlocks
}

type WithPrevAndNext<T> = T & {
  prevSlug: PostProperties | null
  nextSlug: PostProperties | null
}

/**
 * Fetches a specific blog post from a Notion data source by its "Slug" property.
 * Optionally includes the post's block children.
 *
 * @see https://github.com/makenotion/notion-sdk-js?tab=readme-ov-file#collectpaginatedapilistfn-firstpageargs
 * @see https://developers.notion.com/reference/query-a-data-source
 * @see https://developers.notion.com/reference/filter-data-source-entries
 */
export default async function getPost({
  slug,
  includeBlocks = false,
  includePrevAndNext = false,
}: Options): Promise<any> {
  if (!slug) {
    return null
  }

  const response = await notion.dataSources.query({
    data_source_id: process.env.NOTION_DATA_SOURCE_ID_WRITING ?? '',
    filter: {
      and: [{ property: 'Slug', rich_text: { equals: slug } }],
    },
  })

  if (response.results.length === 0) {
    console.error(`No post found for slug: ${slug}`)
    return null
  }

  if (response.results.length > 1) {
    throw Error(`Multiple posts found for slug: ${slug}\n${JSON.stringify(response.results)}`)
  }

  let post: WithPrevAndNext<any> = response.results[0]
  // TODO: parse with zod

  if (includePrevAndNext) {
    const posts = await getPosts()
    // TODO: parse with zod

    const postSlugs: string[] = posts.map(post => getPropertyValue(post.properties, 'Slug'))
    const index = postSlugs.indexOf(slug)

    post = {
      ...post,
      prevPost: index > 0 ? posts[index - 1] : null,
      nextPost: index < postSlugs.length - 1 ? posts[index + 1] : null,
    }
  }

  if (includeBlocks) {
    const blocks = await getBlockChildren(post.id)
    // TODO: parse with zod

    post = { ...post, blocks }
  }

  return post
}
