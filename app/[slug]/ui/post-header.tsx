import { format } from 'timeago.js'

import Heading from '@/ui/heading'
import Paragraph from '@/ui/paragraph'
import { getHumanReadableDate } from '@/utils/dates'

type HeaderProps = Readonly<{
  title: string
  datePublished: string
  dateUpdated: string
}>

export default function PostHeader({ title, datePublished, dateUpdated }: HeaderProps) {
  return (
    <header className="mb-6">
      <Paragraph className="mt-0 text-[0.85em] text-zinc-400">
        <span>{getHumanReadableDate(datePublished)}</span>
        <span className="px-1.5 font-extrabold text-accent">•</span>
        <span>Updated {format(dateUpdated)}</span>
      </Paragraph>

      <Heading level={1} className="mt-0">
        {title}
      </Heading>
    </header>
  )
}
