// TODO: detect inline code and use <Code> to highlight it (as a span)
// TODO: https://github.com/makenotion/notion-sdk-js/blob/main/examples/parse-text-from-any-block-type/index.ts

import classNames from '@/styles/class-names'
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
  text: RichTextItemResponse[]
}>

export default function RichText({ text }: Props) {
  if (!text) return null

  return text.map(value => {
    const {
      annotations: { bold, code, italic, strikethrough, underline },
      text,
    } = value

    const Tag = code ? 'code' : italic ? 'em' : 'span'

    return (
      <Tag
        key={text.link?.url || text.content}
        className={classNames([bold && 'font-semibold', strikethrough && 'line-through', underline && 'underline'])}
      >
        {text.link ? <Anchor href={text.link.url}>{text.content}</Anchor> : text.content}
      </Tag>
    )
  })
}
