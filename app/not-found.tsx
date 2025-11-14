import Link from '@/ui/link'

export default function NotFound() {
  return (
    <main className="flex-auto pt-8 sm:pt-16 md:pt-20 text-center">
      <h1 className="text-xl md:text-2xl">Oops! There&apos;s no page here.</h1>

      <p className="mt-4 text-9xl sm:text-[10rem] md:text-[11rem] lg:text-[12rem] xl:text-[13rem] font-black text-white">
        404
      </p>

      <Link href="/" className="mt-6 link text-xl md:text-2xl">
        Go Home
      </Link>
    </main>
  )
}
