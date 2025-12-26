import { type ReactNode } from 'react'
import Header from '@/ui/header'
import Footer from '@/ui/footer'

type PageLayoutProps = Readonly<{
  children: ReactNode
  /**
   * Controls the max width of the page content.
   * - 'prose': 45rem max width, centered (for reading content)
   * - 'full': No max width constraint
   */
  width?: 'prose' | 'full'
  /**
   * Whether to include a skip-to-main-content link.
   * Should be true for all pages except those with custom skip links.
   */
  skipLink?: boolean
}>

export default function PageLayout({ children, width = 'prose', skipLink = true }: PageLayoutProps) {
  return (
    <div className={`flex flex-col min-h-screen ${width === 'prose' ? 'mx-auto max-w-[45rem] w-full' : ''}`}>
      {skipLink && (
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-accent focus:text-black focus:rounded"
        >
          Skip to main content
        </a>
      )}
      <Header />
      {children}
      <Footer />
    </div>
  )
}
