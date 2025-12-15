import { type ReactElement } from 'react'

import Heading from '@/ui/typography/heading'
import PostList from '@/ui/post-list'

type Props = Readonly<{
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}>

export default async function Blog({ searchParams }: Props): Promise<ReactElement> {
  const params = await searchParams
  const skipCache = params.nocache === 'true'

  return (
    <main className="flex-auto">
      {/* <Heading level={1}>Blog</Heading> */}
      <h1 className="sr-only">Blog</h1>
      <PostList skipCache={skipCache} />
    </main>
  )
}
