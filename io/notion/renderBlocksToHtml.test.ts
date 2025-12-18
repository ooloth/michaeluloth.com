import { describe, it, expect } from 'vitest'
import { renderBlocksToHtml } from './renderBlocksToHtml'
import type { GroupedBlock } from './schemas/block'

// Test helper: creates rich text items
function createRichText(
  content: string,
  options?: {
    bold?: boolean
    italic?: boolean
    code?: boolean
    strikethrough?: boolean
    underline?: boolean
    link?: string | null
  },
) {
  return [
    {
      content,
      link: options?.link ?? null,
      bold: options?.bold ?? false,
      italic: options?.italic ?? false,
      strikethrough: options?.strikethrough ?? false,
      underline: options?.underline ?? false,
      code: options?.code ?? false,
    },
  ]
}

describe('renderBlocksToHtml', () => {
  describe('block types', () => {
    it('renders paragraph blocks', () => {
      const blocks: GroupedBlock[] = [
        {
          type: 'paragraph',
          richText: createRichText('This is a paragraph.'),
        },
      ]

      const result = renderBlocksToHtml(blocks)

      expect(result).toBe('<p>This is a paragraph.</p>')
    })

    it('renders heading blocks', () => {
      const blocks: GroupedBlock[] = [
        {
          type: 'heading_1',
          richText: createRichText('Heading 1'),
        },
        {
          type: 'heading_2',
          richText: createRichText('Heading 2'),
        },
        {
          type: 'heading_3',
          richText: createRichText('Heading 3'),
        },
      ]

      const result = renderBlocksToHtml(blocks)

      expect(result).toBe('<h1>Heading 1</h1>\n<h2>Heading 2</h2>\n<h3>Heading 3</h3>')
    })

    it('renders quote blocks', () => {
      const blocks: GroupedBlock[] = [
        {
          type: 'quote',
          richText: createRichText('A wise quote'),
        },
      ]

      const result = renderBlocksToHtml(blocks)

      expect(result).toBe('<blockquote>A wise quote</blockquote>')
    })

    it('renders code blocks', () => {
      const blocks: GroupedBlock[] = [
        {
          type: 'code',
          richText: [{ content: 'const x = 5;', link: null, bold: false, italic: false, strikethrough: false, underline: false, code: false }],
          language: 'javascript',
          caption: null,
        },
      ]

      const result = renderBlocksToHtml(blocks)

      expect(result).toBe('<pre><code>const x = 5;</code></pre>')
    })

    it('renders bulleted lists', () => {
      const blocks: GroupedBlock[] = [
        {
          type: 'bulleted_list',
          items: [
            { richText: createRichText('First item') },
            { richText: createRichText('Second item') },
            { richText: createRichText('Third item') },
          ],
        },
      ]

      const result = renderBlocksToHtml(blocks)

      expect(result).toBe('<ul><li>First item</li><li>Second item</li><li>Third item</li></ul>')
    })

    it('renders numbered lists', () => {
      const blocks: GroupedBlock[] = [
        {
          type: 'numbered_list',
          items: [
            { richText: createRichText('Step 1') },
            { richText: createRichText('Step 2') },
          ],
        },
      ]

      const result = renderBlocksToHtml(blocks)

      expect(result).toBe('<ol><li>Step 1</li><li>Step 2</li></ol>')
    })

    it('renders image blocks', () => {
      const blocks: GroupedBlock[] = [
        {
          type: 'image',
          url: 'https://res.cloudinary.com/ooloth/image/upload/mu/test.png',
        },
      ]

      const result = renderBlocksToHtml(blocks)

      expect(result).toBe('<img src="https://res.cloudinary.com/ooloth/image/upload/mu/test.png" alt="" />')
    })

    it('renders video blocks with caption', () => {
      const blocks: GroupedBlock[] = [
        {
          type: 'video',
          url: 'https://youtube.com/watch?v=abc',
          caption: 'Demo video',
        },
      ]

      const result = renderBlocksToHtml(blocks)

      expect(result).toBe('<p><a href="https://youtube.com/watch?v=abc">[Video: Demo video]</a></p>')
    })

    it('renders video blocks without caption', () => {
      const blocks: GroupedBlock[] = [
        {
          type: 'video',
          url: 'https://youtube.com/watch?v=abc',
          caption: null,
        },
      ]

      const result = renderBlocksToHtml(blocks)

      expect(result).toBe('<p><a href="https://youtube.com/watch?v=abc">[Video: https://youtube.com/watch?v=abc]</a></p>')
    })
  })

  describe('rich text formatting', () => {
    it('renders bold text', () => {
      const blocks: GroupedBlock[] = [
        {
          type: 'paragraph',
          richText: createRichText('Bold text', { bold: true }),
        },
      ]

      const result = renderBlocksToHtml(blocks)

      expect(result).toBe('<p><strong>Bold text</strong></p>')
    })

    it('renders italic text', () => {
      const blocks: GroupedBlock[] = [
        {
          type: 'paragraph',
          richText: createRichText('Italic text', { italic: true }),
        },
      ]

      const result = renderBlocksToHtml(blocks)

      expect(result).toBe('<p><em>Italic text</em></p>')
    })

    it('renders strikethrough text', () => {
      const blocks: GroupedBlock[] = [
        {
          type: 'paragraph',
          richText: createRichText('Strikethrough text', { strikethrough: true }),
        },
      ]

      const result = renderBlocksToHtml(blocks)

      expect(result).toBe('<p><del>Strikethrough text</del></p>')
    })

    it('renders underlined text', () => {
      const blocks: GroupedBlock[] = [
        {
          type: 'paragraph',
          richText: createRichText('Underlined text', { underline: true }),
        },
      ]

      const result = renderBlocksToHtml(blocks)

      expect(result).toBe('<p><u>Underlined text</u></p>')
    })

    it('renders inline code', () => {
      const blocks: GroupedBlock[] = [
        {
          type: 'paragraph',
          richText: createRichText('const x = 5', { code: true }),
        },
      ]

      const result = renderBlocksToHtml(blocks)

      expect(result).toBe('<p><code>const x = 5</code></p>')
    })

    it('renders links', () => {
      const blocks: GroupedBlock[] = [
        {
          type: 'paragraph',
          richText: createRichText('Click here', { link: 'https://example.com' }),
        },
      ]

      const result = renderBlocksToHtml(blocks)

      expect(result).toBe('<p><a href="https://example.com">Click here</a></p>')
    })

    it('renders multiple formatting styles together', () => {
      const blocks: GroupedBlock[] = [
        {
          type: 'paragraph',
          richText: createRichText('Bold italic text', { bold: true, italic: true }),
        },
      ]

      const result = renderBlocksToHtml(blocks)

      expect(result).toBe('<p><em><strong>Bold italic text</strong></em></p>')
    })

    it('renders multiple rich text items in sequence', () => {
      const blocks: GroupedBlock[] = [
        {
          type: 'paragraph',
          richText: [
            ...createRichText('Normal text '),
            ...createRichText('bold text', { bold: true }),
            ...createRichText(' and '),
            ...createRichText('italic text', { italic: true }),
          ],
        },
      ]

      const result = renderBlocksToHtml(blocks)

      expect(result).toBe('<p>Normal text <strong>bold text</strong> and <em>italic text</em></p>')
    })
  })

  describe('HTML escaping', () => {
    it('escapes HTML special characters in text', () => {
      const blocks: GroupedBlock[] = [
        {
          type: 'paragraph',
          richText: createRichText('<script>alert("XSS")</script>'),
        },
      ]

      const result = renderBlocksToHtml(blocks)

      expect(result).toBe('<p>&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;</p>')
    })

    it('escapes ampersands', () => {
      const blocks: GroupedBlock[] = [
        {
          type: 'paragraph',
          richText: createRichText('Tom & Jerry'),
        },
      ]

      const result = renderBlocksToHtml(blocks)

      expect(result).toBe('<p>Tom &amp; Jerry</p>')
    })

    it('escapes code block content', () => {
      const blocks: GroupedBlock[] = [
        {
          type: 'code',
          richText: [{ content: 'if (x < 5 && y > 3) { alert("hi"); }', link: null, bold: false, italic: false, strikethrough: false, underline: false, code: false }],
          language: 'javascript',
          caption: null,
        },
      ]

      const result = renderBlocksToHtml(blocks)

      expect(result).toBe('<pre><code>if (x &lt; 5 &amp;&amp; y &gt; 3) { alert(&quot;hi&quot;); }</code></pre>')
    })
  })

  describe('multiple blocks', () => {
    it('joins blocks with newlines', () => {
      const blocks: GroupedBlock[] = [
        {
          type: 'heading_1',
          richText: createRichText('Title'),
        },
        {
          type: 'paragraph',
          richText: createRichText('First paragraph'),
        },
        {
          type: 'paragraph',
          richText: createRichText('Second paragraph'),
        },
      ]

      const result = renderBlocksToHtml(blocks)

      expect(result).toBe('<h1>Title</h1>\n<p>First paragraph</p>\n<p>Second paragraph</p>')
    })

    it('handles complex document structure', () => {
      const blocks: GroupedBlock[] = [
        {
          type: 'heading_1',
          richText: createRichText('Introduction'),
        },
        {
          type: 'paragraph',
          richText: createRichText('This is an introduction.'),
        },
        {
          type: 'bulleted_list',
          items: [
            { richText: createRichText('Point 1') },
            { richText: createRichText('Point 2') },
          ],
        },
        {
          type: 'code',
          richText: [{ content: 'console.log("hello")', link: null, bold: false, italic: false, strikethrough: false, underline: false, code: false }],
          language: 'javascript',
          caption: null,
        },
        {
          type: 'quote',
          richText: createRichText('A memorable quote'),
        },
      ]

      const result = renderBlocksToHtml(blocks)

      expect(result).toBe(
        '<h1>Introduction</h1>\n' +
        '<p>This is an introduction.</p>\n' +
        '<ul><li>Point 1</li><li>Point 2</li></ul>\n' +
        '<pre><code>console.log(&quot;hello&quot;)</code></pre>\n' +
        '<blockquote>A memorable quote</blockquote>'
      )
    })
  })

  describe('edge cases', () => {
    it('handles empty blocks array', () => {
      const blocks: GroupedBlock[] = []

      const result = renderBlocksToHtml(blocks)

      expect(result).toBe('')
    })

    it('handles empty rich text arrays', () => {
      const blocks: GroupedBlock[] = [
        {
          type: 'paragraph',
          richText: [],
        },
      ]

      const result = renderBlocksToHtml(blocks)

      expect(result).toBe('<p></p>')
    })

    it('handles empty list items', () => {
      const blocks: GroupedBlock[] = [
        {
          type: 'bulleted_list',
          items: [],
        },
      ]

      const result = renderBlocksToHtml(blocks)

      expect(result).toBe('<ul></ul>')
    })

    it('handles multiline code', () => {
      const blocks: GroupedBlock[] = [
        {
          type: 'code',
          richText: [
            { content: 'function test() {', link: null, bold: false, italic: false, strikethrough: false, underline: false, code: false },
            { content: '  return true;', link: null, bold: false, italic: false, strikethrough: false, underline: false, code: false },
            { content: '}', link: null, bold: false, italic: false, strikethrough: false, underline: false, code: false },
          ],
          language: 'javascript',
          caption: null,
        },
      ]

      const result = renderBlocksToHtml(blocks)

      expect(result).toBe('<pre><code>function test() {  return true;}</code></pre>')
    })
  })
})
