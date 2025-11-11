// TODO: detect inline code and use <Code> to highlight it (as a span)
// TODO: https://github.com/makenotion/notion-sdk-js/blob/main/examples/parse-text-from-any-block-type/index.ts

import Link from '@/ui/link'
import { Code } from '@/ui/code'
import { type NotionAPIRichTextItem } from '@/lib/notion/types'

type RichTextTag = 'code' | 'em' | 'span'

function resolveTag(annotations: NotionAPIRichTextItem['annotations']): RichTextTag {
  if (annotations.code) return 'code'
  if (annotations.italic) return 'em'
  return 'span'
}

function resolveClasses(annotations: NotionAPIRichTextItem['annotations']): string {
  const classes: string[] = []

  if (annotations.bold) classes.push('font-semibold text-white')
  if (annotations.italic) classes.push('italic')
  if (annotations.strikethrough) classes.push('line-through')
  if (annotations.underline) classes.push('underline')

  return classes.join(' ')
}

type Props = Readonly<{
  richTextItems: NotionAPIRichTextItem[]
}>

export default function RichText({ richTextItems: text }: Props) {
  if (!text) return null

  return text.map(richTextItem => {
    const annotations = richTextItem.annotations
    const content = richTextItem.type === 'text' ? richTextItem.text.content : ''
    const link = richTextItem.type === 'text' ? richTextItem.text.link : null

    if (annotations.code) {
      return <Code key={content} code={content} inline />
    }

    const Tag = resolveTag(annotations)

    return (
      <Tag key={link?.url ?? content} className={resolveClasses(annotations)}>
        {link ? <Link href={link.url}>{content}</Link> : content}
      </Tag>
    )
  })
}
