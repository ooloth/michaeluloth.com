import { type ReactElement } from 'react'
import getPosts from '@/io/notion/getPosts'
import { partitionPostsByFeatured } from '@/io/notion/partitionPostsByFeatured'
import PageLayout from '@/ui/layout/page-layout'
import Summary from '@/ui/sections/home-summary'
import FeaturedWriting from '@/ui/sections/home-featured-writing'
import RecentWriting from '@/ui/sections/home-recent-writing'
import JsonLdScript from '@/seo/json-ld/script'

const RECENT_WRITING_LIMIT = 5

export default async function Home(): Promise<ReactElement> {
  const posts = (await getPosts({ sortDirection: 'descending' })).unwrap()
  const { featured, unfeatured } = partitionPostsByFeatured(posts)

  return (
    <PageLayout>
      <Summary />
      <FeaturedWriting posts={featured} />
      <RecentWriting posts={unfeatured.slice(0, RECENT_WRITING_LIMIT)} />
      <JsonLdScript type="person" />
    </PageLayout>
  )
}
