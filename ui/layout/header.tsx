import getPosts from '@/io/notion/getPosts'
import PrimaryNav from '@/ui/layout/nav-primary'

export default async function Header() {
  const posts = (await getPosts({ sortDirection: 'descending' })).unwrap()

  return (
    <header className="flex items-center justify-between mb-12 pt-7">
      <PrimaryNav posts={posts} />
    </header>
  )
}
