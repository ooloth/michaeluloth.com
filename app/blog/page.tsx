import { type ReactElement } from 'react'

import getPosts from '@/lib/notion/getPosts'
import getPropertyValue from '@/lib/notion/getPropertyValue'
import Card from '@/ui/card'
import Emoji from '@/ui/emoji'
import Image from '@/ui/image'
import Heading from '@/ui/heading'
import { getHumanReadableDate, getMachineReadableDate } from '@/utils/dates'

type Props = Readonly<{
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}>

export default async function Blog({ searchParams }: Props): Promise<ReactElement> {
  const params = await searchParams
  const skipCache = params.nocache === 'true'

  const posts = await getPosts({ sortDirection: 'descending', skipCache })

  return (
    <main className="flex-auto">
      <Heading level={1}>Blog</Heading>

      <ul className="mt-6 grid gap-10">
        {/* <ul className="mt-6 grid md:grid-cols-2 gap-4"> */}
        {posts.map(post => {
          const slug = getPropertyValue(post.properties, 'Slug')
          const title = getPropertyValue(post.properties, 'Title')
          const description = getPropertyValue(post.properties, 'Description')
          const image = getPropertyValue(post.properties, 'Featured image')
          const date = getPropertyValue(post.properties, 'First published')

          return (
            <li key={post.id} className="grid">
              <article>
                <header>
                  <time datetime={getMachineReadableDate(date)} class="timestamp block mb-0.5 md:min-w-[7rem]">
                    {getHumanReadableDate(date)}
                  </time>

                  <a href={`/${slug}/`} className="link-heading heading text-xl">
                    {title || slug}
                  </a>
                </header>

                {/* <div className="pt-2">{description}</div> */}
              </article>

              {/* <Card href={`/${slug}/`}> */}
              {/*   {image ? ( */}
              {/*     <Image */}
              {/*       url={image} */}
              {/*       showCaption={false} */}
              {/*       outerStyles="my-0!" */}
              {/*       imageStyles="rounded-t-xl rounded-b-none" */}
              {/*     /> */}
              {/*   ) : null} */}
              {/**/}
              {/*   <div className="py-3 px-4"> */}
              {/*     <p className="text-xl font-medium md:text-lg text-bright">{title}</p> */}
              {/*     <p className="font-medium md:text-md">{description}</p> */}
              {/*   </div> */}
              {/* </Card> */}
            </li>
          )
        })}
      </ul>
    </main>
  )
}
