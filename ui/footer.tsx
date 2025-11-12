import SecondaryNav from '@/ui/nav/secondary'
import SocialNav from '@/ui/nav/socials'

export default function Footer() {
  return (
    <footer className="flex items-center justify-between pb-6">
      <SecondaryNav />
      <SocialNav />
    </footer>
  )
}
