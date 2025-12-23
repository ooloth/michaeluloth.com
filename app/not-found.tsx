import Dot from '@/ui/dot'
import Link from '@/ui/link'
import Header from '@/ui/header'
import Footer from '@/ui/footer'

export default async function NotFound() {
  return (
    <div className="flex flex-col mx-auto max-w-prose w-full min-h-screen">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-accent focus:text-black focus:rounded"
      >
        Skip to main content
      </a>
      <Header />
      <main id="main" className="flex-auto pt-8 sm:pt-16 md:pt-20 text-center">
        <h1 className="text-xl md:text-2xl">Oops! There&apos;s no page here.</h1>

        <p className="mt-4 text-9xl sm:text-[10rem] md:text-[11rem] lg:text-[12rem] xl:text-[13rem] font-black text-white">
          404
        </p>

        <div className="mt-8 flex gap-4 justify-center items-center text-xl md:text-2xl">
          <Link href="/blog/">Browse Blog</Link>
          <Dot color="muted" />
          <Link href="/">Go Home</Link>
        </div>
      </main>
      <Footer />
    </div>
  )
}
