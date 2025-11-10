// TODO: backup: https://shiki.style/packages/next#react-server-component

import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'
import rehypePrettyCode from 'rehype-pretty-code'

type Props = Readonly<{
  code: string
  inline?: boolean
  lang?: string
  meta?: string
}>

/**
 * Renders syntax-highlighted code from a plain text string. Converts the string to a markdown code block or inline
 * code based on the `inline` prop and highlights it using `rehype-pretty-code`.
 *
 * @see https://rehype-pretty.pages.dev/#react-server-component
 */
export async function Code({ code, inline = false, lang = 'plaintext', meta = '' }: Props) {
  const markdownCode = convertToMarkdown({ code, lang, meta, inline })
  const highlightedCode = await highlightCode(markdownCode)

  const Tag = inline ? 'span' : 'div'

  // Rehype pretty code inserts figure, pre and code elements inside this div
  return <Tag dangerouslySetInnerHTML={{ __html: highlightedCode }} />
}

type ConvertToMarkdownOptions = {
  code: string
  lang: string
  meta: string
  inline: boolean
}

/**
 * Converts code to a markdown code block or inline code.
 */
function convertToMarkdown({ code, lang, meta, inline }: ConvertToMarkdownOptions): string {
  if (inline) {
    return `\`${code}\``
  }

  // Include Rype Pretty Code meta string if provided: https://rehype-pretty.pages.dev/#meta-strings
  const langWithMeta = meta ? `${lang} ${meta}` : lang

  return `\`\`\`${langWithMeta}\n${code}\n\`\`\``
}

async function highlightCode(code: string) {
  const file = await unified()
    .use(remarkParse)
    .use(remarkRehype)
    .use(rehypePrettyCode, {
      defaultLang: 'plaintext', // if no lang is specified
      keepBackground: false, // set to false to apply a custom bg color via CSS
      // See: https://rehype-pretty.pages.dev/#theme
      // See: https://shiki.style/themes#themes
      theme: 'catppuccin-mocha',
      // theme: 'kanagawa-dragon',
      // theme: 'nord',
      // ],
    })
    .use(rehypeStringify)
    .process(code)

  return String(file)
}
