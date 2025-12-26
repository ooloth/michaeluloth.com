import { type ReactElement } from 'react'
import PageLayout from '@/ui/layouts/page-layout'
import Summary from '@/ui/home/summary'
import RecentWriting from '@/ui/home/recent-writing'
import { generatePersonJsonLd } from '@/seo/json-ld/person'
import JsonLdScript from '@/seo/json-ld/script'

export default async function Home(): Promise<ReactElement> {
  const jsonLd = generatePersonJsonLd()

  return (
    <PageLayout>
      <Summary />
      <RecentWriting />
      <JsonLdScript data={jsonLd} />
    </PageLayout>
  )
}
