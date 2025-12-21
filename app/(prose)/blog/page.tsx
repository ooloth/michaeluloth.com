import { type Metadata } from 'next'
import { type ReactElement } from 'react'

import PostList from '@/ui/post-list'

export const metadata: Metadata = {
  title: 'Blog',
  description: 'Technical writing about web development, TypeScript, React, and software engineering.',
}

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
