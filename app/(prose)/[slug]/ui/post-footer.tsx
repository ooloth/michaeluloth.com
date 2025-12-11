'use client'

import Giscus from '@giscus/react'

export default function PostFooter() {
  return (
    <footer className="my-10">
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
