import { type Metadata } from 'next'
import { notFound } from 'next/navigation'

import getPost from '@/io/notion/getPost'
import getPosts from '@/io/notion/getPosts'
import JsonLdScript from '@/seo/json-ld/script'
import metadata from '@/seo/pages/post'

import NotionBlocks from '@/io/notion/ui/NotionBlocks'
import PaginationLinks from '@/ui/sections/post-pagination'

import PageLayout from '@/ui/layout/page-layout'
import PostHeader from '@/ui/sections/post-header'
import PostFooter from '@/ui/sections/post-footer'

type Params = {
  slug: string
}

export async function generateStaticParams(): Promise<Params[]> {
  const posts = (await getPosts({ sortDirection: 'ascending' })).unwrap()

  return posts.map(post => ({ slug: post.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const slug = (await params).slug
  const post = (await getPost({ slug })).unwrap()

  if (!post) {
    notFound()
  }

  return metadata(post)
}

type Props = Readonly<{
  params: Promise<Params>
}>

export default async function BlogPost({ params }: Props) {
  const slug = (await params).slug
  const post = (await getPost({ slug, includeBlocks: true, includePrevAndNext: true })).unwrap()

  if (!post) {
    notFound()
  }

  return (
    <PageLayout>
      <div className="flex-auto flex flex-col">
        <article>
          <PostHeader title={post.title} datePublished={post.firstPublished} />
          <NotionBlocks blocks={post.blocks} />
          <PostFooter /> {/* needs to be a client component */}
        </article>

        {/* Pagination is site navigation, not post content, so it lives outside <article> */}
        <PaginationLinks className="mt-auto" prevPost={post.prevPost} nextPost={post.nextPost} />
      </div>

      <JsonLdScript type="article" post={post} />
    </PageLayout>
  )
}
