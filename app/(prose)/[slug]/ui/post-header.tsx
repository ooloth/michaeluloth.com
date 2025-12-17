import Heading from '@/ui/typography/heading'
import Paragraph from '@/ui/typography/paragraph'
import { getHumanReadableDate } from '@/utils/dates'

type HeaderProps = Readonly<{
  title: string
  datePublished: string
}>

export default function PostHeader({ title, datePublished }: HeaderProps) {
  return (
    <header className="mb-6">
      <Paragraph className="my-0 text-[0.9rem] uppercase text-zinc-400">
        {getHumanReadableDate(datePublished)}
      </Paragraph>

      <Heading level={1} className="mt-0">
        {title}
      </Heading>
    </header>
  )
}
