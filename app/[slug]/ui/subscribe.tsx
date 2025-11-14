import Link from '@/ui/link'

export default function Subscribe() {
  return (
    <aside role="note" className="mt-12">
      <p className="text-center italic">
        <span className="block text-bright">Want to be notified about new posts?</span>
        <Link href="/rss.xml">Subscribe to my RSS feed</Link>
      </p>
    </aside>
  )
}
