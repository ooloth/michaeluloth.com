import type { Post } from '@/io/notion/schemas/post'
import { generatePersonJsonLd } from './person'
import { generateBlogJsonLd } from './blog'
import { generateArticleJsonLd } from './article'

type JsonLdScriptProps = Readonly<{ type: 'person' } | { type: 'blog' } | { type: 'article'; post: Post }>

/**
 * Renders a JSON-LD script tag with proper XSS escaping.
 * Automatically generates the appropriate JSON-LD data based on type.
 * Escapes < characters to prevent XSS if content contains </script>
 *
 * @example
 * <JsonLdScript type="person" />
 * <JsonLdScript type="blog" />
 * <JsonLdScript type="article" post={post} />
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script#embedding_data_in_html
 */
export default function JsonLdScript(props: JsonLdScriptProps) {
  let data: Record<string, unknown>

  switch (props.type) {
    case 'person':
      data = generatePersonJsonLd()
      break
    case 'blog':
      data = generateBlogJsonLd()
      break
    case 'article':
      data = generateArticleJsonLd(props.post)
      break
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, '\\u003c'),
      }}
    />
  )
}
