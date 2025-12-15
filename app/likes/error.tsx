'use client'

import { type ReactElement } from 'react'
import Heading from '@/ui/typography/heading'

type Props = {
  error: Error & { digest?: string }
  reset: () => void
}

export default function Error({ error, reset }: Props): ReactElement {
  return (
    <main className="flex-auto">
      <Heading level={1}>Likes</Heading>
      <div className="mt-8">
        <p className="text-zinc-300">Failed to load media. Please try again later.</p>
        {error.digest && <p className="mt-2 text-sm text-zinc-500">Error ID: {error.digest}</p>}
        <button
          onClick={reset}
          className="mt-4 px-4 py-2 bg-accent text-black rounded hover:bg-accent/90 transition-colors"
        >
          Try again
        </button>
      </div>
    </main>
  )
}
