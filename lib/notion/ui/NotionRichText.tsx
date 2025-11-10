// TODO: detect inline code and use <Code> to highlight it (as a span)
// TODO: https://github.com/makenotion/notion-sdk-js/blob/main/examples/parse-text-from-any-block-type/index.ts

import Anchor from '@/ui/anchor'
import { type NotionAPIRichTextItem } from '@/lib/notion/types'

type RichTextTag = 'code' | 'em' | 'span'

function resolveTag(annotations: NotionAPIRichTextItem['annotations']): RichTextTag {
  if (annotations.code) return 'code'
  if (annotations.italic) return 'em'
  return 'span'
}

function resolveClasses(annotations: NotionAPIRichTextItem['annotations']): string {
  const classes = []

  if (annotations.bold) classes.push('font-semibold')
  if (annotations.italic) classes.push('italic')
  if (annotations.strikethrough) classes.push('line-through')
  if (annotations.underline) classes.push('underline')

  return classes
}

type Props = Readonly<{
  richTextItems: NotionAPIRichTextItem[]
}>

export default function RichText({ richTextItems: text }: Props) {
  if (!text) return null

  return text.map(richTextItem => {
    const content = richTextItem.type === 'text' ? richTextItem.text.content : ''
    const link = richTextItem.type === 'text' ? richTextItem.text.link : null
    const annotations = richTextItem.annotations

    const Tag = resolveTag(annotations)

    return (
      <Tag key={link?.url ?? content} className={resolveClasses(annotations)}>
        {link ? <Anchor href={link.url}>{content}</Anchor> : content}
      </Tag>
    )
  })
}
