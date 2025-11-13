import SecondaryNav from '@/ui/nav/secondary'
import SocialNav from '@/ui/nav/socials'

export default function Footer() {
  return (
    <footer className="flex items-center justify-between mt-24 pb-6">
      <SecondaryNav />
      <SocialNav />
    </footer>
  )
}
