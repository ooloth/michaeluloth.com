import { type ReactElement } from 'react'
import NotionRichText from '@/io/notion/ui/NotionRichText'
import { type BulletedListBlock, type NumberedListBlock } from '@/io/notion/schemas/block'

type Props = Readonly<{
  items: BulletedListBlock['items'] | NumberedListBlock['items']
  type: 'bulleted' | 'numbered'
}>

export default function List({ items, type }: Props): ReactElement {
  const Tag = type === 'bulleted' ? 'ul' : 'ol'
  const listStyles = type === 'bulleted' ? 'list-disc' : 'list-decimal'

  return (
    <Tag className={`${listStyles} list-outside marker:text-accent flex flex-col gap-2 mt-4 ml-7 leading-[1.55]`}>
      {items.map((item, index) => (
        <li key={index}>
          <NotionRichText richTextItems={item.richText} />
        </li>
      ))}
    </Tag>
  )
}
