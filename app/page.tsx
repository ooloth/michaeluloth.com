import { type ReactElement } from 'react'
import PageLayout from '@/ui/layouts/page-layout'
import Summary from '@/ui/home/summary'
import RecentWriting from '@/ui/home/recent-writing'

export default async function Home(): Promise<ReactElement> {
  return (
    <PageLayout>
      <main id="main" className="flex-auto">
        <Summary />
        <RecentWriting />
      </main>
    </PageLayout>
  )
}
