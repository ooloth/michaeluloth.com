import { type JSX, type ReactNode } from 'react'

const baseClasses = 'mb-0 break-after-avoid leading-tight text-bright'

const verticalSpaceByLevel: Record<number, string> = {
  1: 'mt-8',
  2: 'mt-8',
  3: 'mt-8',
  4: 'mt-6',
  5: 'mt-4',
  6: 'mt-4',
}

const typographyByLevel: Record<number, string> = {
  1: 'text-[2.25rem] leading-[1.1] font-extrabold',
  2: 'text-[1.6rem] font-semibold',
  3: 'text-xl font-semibold',
  4: 'text-lg font-semibold',
  5: 'text-base font-semibold',
  6: 'text-sm font-semibold',
}

function isValidHeadingLevel(level: number): level is 1 | 2 | 3 | 4 | 5 | 6 {
  return [1, 2, 3, 4, 5, 6].includes(level)
}

type Props = Readonly<{
  level: number
  children: ReactNode
  className?: string
}>

export default function Heading({ level, children, className }: Props) {
  if (!isValidHeadingLevel(level)) {
    throw new Error(`Unsupported heading level: ${level}`)
  }

  const Tag = `h${level}` as keyof JSX.IntrinsicElements

  let classes = baseClasses + ' ' + typographyByLevel[level]
  const classNameIncludesTopMargin = className && (className.includes('mt-') || className.includes('my-'))

  if (!classNameIncludesTopMargin) {
    // Omit verticalSpaceByLevel if className already includes mt- or my-
    classes += ' ' + verticalSpaceByLevel[level]
  }

  return <Tag className={classes}>{children}</Tag>
}
