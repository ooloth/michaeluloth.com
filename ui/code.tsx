// TODO: backup: https://shiki.style/packages/next#react-server-component

import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'
import rehypePrettyCode from 'rehype-pretty-code'

type Props = Readonly<{
  code: string
}>

/**
 * Renders syntax-highlighted code from a markdown code block.
 *
 * @see https://rehype-pretty.pages.dev/#react-server-component
 */
export async function Code({ code }: Props) {
  const highlightedCode = await highlightCode(code)

  return <figure dangerouslySetInnerHTML={{ __html: highlightedCode }} />
}

async function highlightCode(code: string) {
  const file = await unified()
    .use(remarkParse)
    .use(remarkRehype)
    .use(rehypePrettyCode, {
      defaultLang: 'plaintext', // if no lang is specified
      keepBackground: false, // set to false to apply a custom bg color
      // See: https://rehype-pretty.pages.dev/#theme
      // See: https://shiki.style/themes#themes
      // theme: 'catppuccin-mocha',
      theme: 'kanagawa-dragon',
      // theme: 'nord',
      // ],
    })
    .use(rehypeStringify)
    .process(code)

  return String(file)
}
