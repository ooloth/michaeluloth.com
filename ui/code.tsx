// TODO: preferred: https://rehype-pretty.pages.dev/#react-server-component
// TODO: backup: https://shiki.style/guide/install
// TODO: backup: https://shiki.style/packages/next#react-server-component

import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'
import rehypePrettyCode from 'rehype-pretty-code'
import { transformerCopyButton } from '@rehype-pretty/transformers'

type Props = Readonly<{
  code: string
}>

export async function Code({ code }: Props) {
  const highlightedCode = await highlightCode(code)

  return <figure dangerouslySetInnerHTML={{ __html: highlightedCode }} />
}

async function highlightCode(code: string) {
  const file = await unified()
    .use(remarkParse)
    .use(remarkRehype)
    .use(rehypePrettyCode, {
      defaultLang: 'plaintext',
      keepBackground: false,
      transformers: [
        transformerCopyButton({
          visibility: 'always',
          feedbackDuration: 3_000, // milliseconds
        }),
      ],
    })
    .use(rehypeStringify)
    .process(code)

  return String(file)
}
