# RSS Feed Implementation Plan

## Goal
Add an RSS feed at `/rss.xml/` with full post content rendered from Notion blocks.

## Approach
Use the `feed` npm package + a dedicated HTML renderer for blocks (can't use existing React components because `Code` and `CloudinaryImage` are async Server Components, which `renderToStaticMarkup` doesn't support).

## Files to Create/Modify

### 1. Create `io/notion/renderBlocksToHtml.ts` (new)

Renders Notion blocks to HTML strings for RSS. Simpler than React components:
- Code blocks: `<pre><code>` without syntax highlighting
- Images: Direct `<img>` tags with Cloudinary URLs
- Text: Handles bold, italic, code, links, strikethrough

```typescript
import { type GroupedBlock, type RichTextItem } from '@/io/notion/schemas/block'

export function renderBlocksToHtml(blocks: GroupedBlock[]): string {
  return blocks.map(renderBlock).join('\n')
}

function renderBlock(block: GroupedBlock): string {
  switch (block.type) {
    case 'paragraph':
      return `<p>${renderRichText(block.richText)}</p>`
    case 'heading_1':
      return `<h1>${renderRichText(block.richText)}</h1>`
    case 'heading_2':
      return `<h2>${renderRichText(block.richText)}</h2>`
    case 'heading_3':
      return `<h3>${renderRichText(block.richText)}</h3>`
    case 'bulleted_list':
      return `<ul>${block.items.map(item => `<li>${renderRichText(item.richText)}</li>`).join('')}</ul>`
    case 'numbered_list':
      return `<ol>${block.items.map(item => `<li>${renderRichText(item.richText)}</li>`).join('')}</ol>`
    case 'code':
      const code = block.richText.map(item => item.content).join('')
      return `<pre><code>${escapeHtml(code)}</code></pre>`
    case 'quote':
      return `<blockquote>${renderRichText(block.richText)}</blockquote>`
    case 'image':
      return `<img src="${block.url}" alt="" />`
    case 'video':
      return `<p><a href="${block.url}">[Video: ${block.caption || block.url}]</a></p>`
    default:
      return ''
  }
}

function renderRichText(items: RichTextItem[]): string {
  return items.map(item => {
    let text = escapeHtml(item.content)
    if (item.code) text = `<code>${text}</code>`
    if (item.bold) text = `<strong>${text}</strong>`
    if (item.italic) text = `<em>${text}</em>`
    if (item.strikethrough) text = `<del>${text}</del>`
    if (item.underline) text = `<u>${text}</u>`
    if (item.link) text = `<a href="${item.link}">${text}</a>`
    return text
  }).join('')
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
```

### 2. Create `app/rss.xml/route.ts` (new)

```typescript
import { Feed } from 'feed'
import { getPosts } from '@/io/notion/getPosts'
import getPost from '@/io/notion/getPost'
import { renderBlocksToHtml } from '@/io/notion/renderBlocksToHtml'

const SITE_URL = 'https://michaeluloth.com'

export async function GET() {
  const posts = (await getPosts({ sortDirection: 'descending' })).unwrap()

  const feed = new Feed({
    title: 'Michael Uloth',
    description: 'Software engineer helping scientists discover new medicines at Recursion.',
    id: SITE_URL,
    link: SITE_URL,
    language: 'en',
    favicon: `${SITE_URL}/favicon.ico`,
    copyright: `All rights reserved ${new Date().getFullYear()}, Michael Uloth`,
    author: {
      name: 'Michael Uloth',
      link: SITE_URL,
    },
  })

  // Fetch full content for each post
  for (const postItem of posts) {
    const post = (await getPost({ slug: postItem.slug, includeBlocks: true })).unwrap()
    if (!post) continue

    feed.addItem({
      title: post.title,
      id: `${SITE_URL}/${post.slug}/`,
      link: `${SITE_URL}/${post.slug}/`,
      description: post.description ?? undefined,
      content: renderBlocksToHtml(post.blocks),
      date: new Date(post.firstPublished),
      author: [{ name: 'Michael Uloth', link: SITE_URL }],
    })
  }

  return new Response(feed.rss2(), {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
```

### 3. Install dependency

```bash
npm install feed
```

## Key Files

| File | Purpose |
|------|---------|
| `app/rss.xml/route.ts` | Route handler serving RSS feed |
| `io/notion/renderBlocksToHtml.ts` | Converts Notion blocks to HTML strings |
| `io/notion/getPosts.ts` | Fetches post list (existing) |
| `io/notion/getPost.ts` | Fetches single post with blocks (existing) |
| `io/notion/schemas/block.ts` | Block types (existing) |

## Design Decisions

1. **Separate HTML renderer** vs reusing React components: Required because `Code` and `CloudinaryImage` are async Server Components that `renderToStaticMarkup` doesn't support.

2. **No syntax highlighting in RSS**: Code blocks render as plain `<pre><code>`. RSS readers have inconsistent styling support anyway.

3. **Direct Cloudinary URLs**: Images use the raw URL without fetching metadata. Simpler and faster.

4. **`feed` library**: Handles XML escaping, CDATA wrapping, and proper RSS 2.0 structure.

## Testing

1. `curl http://localhost:3000/rss.xml/` - verify XML output
2. Validate at https://validator.w3.org/feed/
3. Test in RSS reader (Feedly, NetNewsWire, etc.)
