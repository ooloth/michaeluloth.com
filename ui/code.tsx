import fs from 'fs'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'
import rehypePrettyCode from 'rehype-pretty-code'

// See: https://github.com/atomiks/rehype-pretty-code/blob/master/website/assets/moonlight-ii.json
const moonlightV2 = JSON.parse(fs.readFileSync('./lib/rehype-pretty-code/themes/moonlight-ii.json', 'utf-8'))

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
  const markdown = convertToMarkdown({ code, lang, meta, inline })
  const html = await highlightCode(markdown)
  const htmlNoItalics = html.replaceAll('font-style:italic', '') // remove italics added by a theme

  if (inline) {
    // Remove surrounding <p> tags added by remark-parse for inline code
    const htmlNoParagraphWrapper = htmlNoItalics.replace(/^<p>/, '').replace(/<\/p>\s*$/, '')
    return <span className="text-[0.9em]" dangerouslySetInnerHTML={{ __html: htmlNoParagraphWrapper }} />
  }

  // Rehype pretty code inserts figure, pre and code elements inside this div
  return <div dangerouslySetInnerHTML={{ __html: htmlNoItalics }} />
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
      // see: https://rehype-pretty.pages.dev/#options
      defaultLang: 'plaintext', // if no lang is specified
      keepBackground: false, // set to false to apply a custom bg color via CSS
      // See: https://rehype-pretty.pages.dev/#theme
      theme: moonlightV2,
      tokensMap: {
        fn: 'entity.name.function',
        kw: 'keyword',
        key: 'meta.object-literal.key',
        pm: 'variable.parameter',
        obj: 'variable.other.object',
        str: 'string',
      },
    })
    .use(rehypeStringify)
    .process(code)

  return String(file)
}
