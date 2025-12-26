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
}>

export default function PageLayout({ children, width = 'prose' }: PageLayoutProps) {
  const widthClasses = width === 'prose' ? 'mx-auto max-w-[45rem] w-full' : ''

  const skipLinkId = 'main'
  const skipLinkClasses =
    'sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-accent focus:text-black focus:rounded'

  return (
    <div className={`flex flex-col min-h-screen ${widthClasses}`}>
      <a href={`#${skipLinkId}`} className={skipLinkClasses}>
        Skip to main content
      </a>

      <Header />

      {/* Main content element is the skip-link target and grows to fill the available vertical space */}
      <main id={skipLinkId} className="flex-auto flex flex-col">
        {children}
      </main>

      <Footer />
    </div>
  )
}
