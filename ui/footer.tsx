import SecondaryNav from '@/ui/nav/secondary'
import SocialNav from '@/ui/nav/socials'

export default function Footer() {
  return (
    <footer className="flex flex-col sm:flex-row items-center justify-between gap-2 mt-24 pb-6">
      <SecondaryNav />
      <SocialNav />
    </footer>
  )
}
