import { type Metadata } from 'next'
import { type ReactElement } from 'react'

import PostList from '@/ui/post-list'

export const metadata: Metadata = {
  title: 'Blog',
  description: 'Technical writing about web development, TypeScript, React, and software engineering.',
}

export default async function Blog(): Promise<ReactElement> {
  return (
    <main className="flex-auto">
      <h1 className="sr-only">Blog</h1>
      <PostList />
    </main>
  )
}
