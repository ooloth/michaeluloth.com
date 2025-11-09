import { type JSX, type ReactNode } from 'react'

const baseClasses = 'mb-0 break-after-avoid leading-tight text-white'

const classesByLevel: Record<number, string> = {
  1: 'mt-8 text-[2.25rem] leading-[1.1] font-extrabold',
  2: 'mt-8 text-[1.6rem] font-semibold',
  3: 'mt-8 text-xl font-semibold',
  4: 'mt-6 text-lg font-semibold',
  5: 'mt-4 text-base font-semibold',
  6: 'mt-4 text-sm font-semibold',
}

function isValidHeadingLevel(level: number): level is 1 | 2 | 3 | 4 | 5 | 6 {
  return [1, 2, 3, 4, 5, 6].includes(level)
}

type Props = Readonly<{
  level: number
  children: ReactNode
}>

export default function Heading({ level, children }: Props) {
  if (!isValidHeadingLevel(level)) {
    throw new Error(`Unsupported heading level: ${level}`)
  }

  const Tag = `h${level}` as keyof JSX.IntrinsicElements

  return <Tag className={`${baseClasses} ${classesByLevel[level]}`}>{children}</Tag>
}
