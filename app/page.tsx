import { type ReactElement } from 'react'
import PageLayout from '@/ui/layout/page-layout'
import Summary from '@/ui/sections/home-summary'
import RecentWriting from '@/ui/sections/home-recent-writing'
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
