import Link from '@/ui/link'
import { Code } from '@/ui/code'
import { type RichTextItem } from '@/io/notion/schemas/block'

type RichTextTag = 'code' | 'em' | 'span'

function resolveTag(item: RichTextItem): RichTextTag {
  if (item.code) return 'code'
  if (item.italic) return 'em'
  return 'span'
}

function resolveClasses(item: RichTextItem): string {
  const classes: string[] = []

  if (item.bold) classes.push('font-semibold text-200')
  if (item.italic) classes.push('italic text-zinc-200')
  if (item.strikethrough) classes.push('line-through')
  if (item.underline) classes.push('underline text-200')

  return classes.join(' ')
}

type Props = Readonly<{
  richTextItems: RichTextItem[]
}>

export default function RichText({ richTextItems: text }: Props) {
  if (!text) return null

  return text.map((richTextItem, index) => {
    if (richTextItem.code) {
      return <Code key={index} code={richTextItem.content} inline />
    }

    const Tag = resolveTag(richTextItem)

    return (
      <Tag key={index} className={resolveClasses(richTextItem)}>
        {richTextItem.link ? <Link href={richTextItem.link}>{richTextItem.content}</Link> : richTextItem.content}
      </Tag>
    )
  })
}
