import { type ReactElement } from 'react'

import PostList from '@/ui/post-list'

type Props = Readonly<{
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}>

export default async function Blog({ searchParams }: Props): Promise<ReactElement> {
  const params = await searchParams
  const skipCache = params.nocache === 'true'

  return (
    <main className="flex-auto">
      <h1 className="sr-only">Blog</h1>
      <PostList skipCache={skipCache} />
    </main>
  )
}
