// TODO: replace mt-4 default with gap in parent container?

import { type ReactNode } from 'react'

type Props = Readonly<{
  children: ReactNode
  className?: string
}>

/**
 * Resolves the className for the Paragraph component.
 * If no competing margin-top classes (mt-*, my-*) are found in the provided className,
 * it adds a default margin-top of mt-4.
 */
function resolveClasses(className: string = ''): string {
  // Let competing mt-* or my-* classes from className win
  const mt = className.match(/(?:^|\s)(mt|my)-\S+/)

  // Let competing mt-* or my-* classes from className win
  return mt ? className : `mt-4 ${className}`
}

export default function Paragraph({ children, className }: Props) {
  return <p className={resolveClasses(className)}>{children}</p>
}
