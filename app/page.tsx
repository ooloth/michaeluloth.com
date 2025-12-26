import { type ReactElement } from 'react'
import PageLayout from '@/ui/layouts/page-layout'
import Summary from '@/ui/home/summary'
import RecentWriting from '@/ui/home/recent-writing'
import { generatePersonJsonLd } from '@/seo/json-ld/person'

export default async function Home(): Promise<ReactElement> {
  const jsonLd = generatePersonJsonLd()

  return (
    <PageLayout>
      <main id="main" className="flex-auto">
        <Summary />
        <RecentWriting />
      </main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          // Escape < to prevent XSS if content contains </script>
          __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c'),
        }}
      />
    </PageLayout>
  )
}
