'use client'

import { useState, useEffect } from 'react'
import Giscus from '@giscus/react'

export default function PostFooter() {
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const checkForGiscus = () => {
      const giscusContainer = document.querySelector('.giscus')
      if (giscusContainer?.querySelector('iframe')) {
        setIsLoaded(true)
        return true
      }
      return false
    }

    if (checkForGiscus()) return

    const observer = new MutationObserver(checkForGiscus)
    observer.observe(document.body, { childList: true, subtree: true })

    const timeout = setTimeout(() => setIsLoaded(true), 3000)

    return () => {
      observer.disconnect()
      clearTimeout(timeout)
    }
  }, [])

  return (
    <footer className="my-10">
      <div className="relative">
        {/* Loading skeleton matching actual Giscus layout */}
        {!isLoaded && (
          <div className="absolute inset-0 animate-pulse" aria-hidden="true">
            {/* Centered reaction count */}
            <div className="flex justify-center mb-3">
              <div className="h-5 bg-zinc-800 rounded w-16"></div>
            </div>

            {/* Centered emoji row */}
            <div className="flex justify-center gap-2 mb-4">
              <div className="h-8 w-8 bg-zinc-800 rounded-full"></div>
              <div className="h-8 w-8 bg-zinc-800 rounded-full"></div>
              <div className="h-8 w-8 bg-zinc-800 rounded-full"></div>
              <div className="h-8 w-8 bg-zinc-800 rounded-full"></div>
              <div className="h-8 w-8 bg-zinc-800 rounded-full"></div>
            </div>

            {/* Left-aligned comment count */}
            <div className="h-6 bg-zinc-800 rounded w-24 mb-3"></div>

            {/* Input box */}
            <div className="h-40 bg-zinc-800 rounded"></div>
          </div>
        )}

        <div className={isLoaded ? '' : 'invisible'}>
          <Giscus
            repo="ooloth/comments"
            repoId="R_kgDOJo8JPg"
            category="Announcements"
            categoryId="DIC_kwDOJo8JPs4CXtJE"
            mapping="pathname"
            strict="1"
            reactionsEnabled="1"
            emitMetadata="0"
            inputPosition="bottom"
            theme="dark"
            lang="en"
            loading="lazy"
          />
        </div>
      </div>
    </footer>
  )

  // return (
  //   <a href={discussUrl(frontMatter.slug)} target="_blank" rel="noreferrer">
  //     Discuss on Twitter
  //   </a>
  // )
}

// const discussUrl = slug =>
//   `https://mobile.twitter.com/search?q=${encodeURIComponent(
//     `https://michaeluloth.com/${slug}`,
//   )}`
