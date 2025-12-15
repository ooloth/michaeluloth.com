import SocialNav from '@/ui/nav/socials'
import Paragraph from '@/ui/typography/paragraph'

export default function Footer() {
  return (
    <footer className="flex flex-col sm:flex-row items-center justify-between gap-2 mt-24 pb-6 text-zinc-300">
      <Paragraph className="my-0">&copy; {new Date().getFullYear()} Michael Uloth</Paragraph>
      <SocialNav />
    </footer>
  )
}
