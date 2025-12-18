import { type GroupedBlock, type RichTextItem } from '@/io/notion/schemas/block'

/**
 * Strips rehype-pretty-code inline language indicators from HTML content.
 *
 * When using rehype-pretty-code for syntax highlighting in the main site,
 * inline code elements get language indicators appended like `{:js}` or `{:.fp}`.
 * These indicators are useful for styling but should not appear in RSS feeds
 * where they would be rendered literally.
 *
 * @example
 * // Removes language identifier
 * stripRehypePrettyCodeLanguageIndicators('<code>const{:js}</code>')
 * // => '<code>const</code>'
 *
 * @example
 * // Removes class identifier
 * stripRehypePrettyCodeLanguageIndicators('<code>function{:.keyword}</code>')
 * // => '<code>function</code>'
 *
 * @param html - HTML string potentially containing rehype-pretty-code indicators
 * @returns HTML string with all language indicators removed
 */
function stripRehypePrettyCodeLanguageIndicators(html: string): string {
  const rehypePrettyCodeInlineLangIndicator = /{:\\.?\\w+}<\/code>/g
  return html.replace(rehypePrettyCodeInlineLangIndicator, '</code>')
}

export function renderBlocksToHtml(blocks: GroupedBlock[]): string {
  const html = blocks.map(renderBlock).join('\n')
  return stripRehypePrettyCodeLanguageIndicators(html)
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
  return items
    .map(item => {
      let text = escapeHtml(item.content)
      if (item.code) text = `<code>${text}</code>`
      if (item.bold) text = `<strong>${text}</strong>`
      if (item.italic) text = `<em>${text}</em>`
      if (item.strikethrough) text = `<del>${text}</del>`
      if (item.underline) text = `<u>${text}</u>`
      if (item.link) text = `<a href="${item.link}">${text}</a>`
      return text
    })
    .join('')
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}
