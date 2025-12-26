import { type ReactElement } from 'react'
import PageLayout from '@/ui/layouts/page-layout'
import Summary from '@/ui/home/summary'
import RecentWriting from '@/ui/home/recent-writing'
import JsonLdScript from '@/seo/json-ld/script'

export default async function Home(): Promise<ReactElement> {
  return (
    <PageLayout>
      <Summary />
      <RecentWriting />
      <JsonLdScript type="person" />
    </PageLayout>
  )
}
