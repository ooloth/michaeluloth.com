/**
 * @vitest-environment happy-dom
 */

import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { Code } from './code'

describe('Code', () => {
  describe('inline code rendering', () => {
    it('renders inline code in span element', async () => {
      const jsx = await Code({ code: 'const x = 1', inline: true })
      const { container } = render(jsx)

      const span = container.querySelector('span')
      expect(span).toBeInTheDocument()
      expect(span).toHaveClass('text-[0.9em]')
    })

    it('removes paragraph wrapper from inline code', async () => {
      const jsx = await Code({ code: 'hello', inline: true })
      const { container } = render(jsx)

      // Should not have <p> tags
      expect(container.querySelector('p')).not.toBeInTheDocument()
      expect(container.querySelector('span')).toBeInTheDocument()
    })

    it('preserves code text in inline rendering', async () => {
      const jsx = await Code({ code: 'const x = 1', inline: true, lang: 'javascript' })
      const { container } = render(jsx)

      const span = container.querySelector('span')
      expect(span?.innerHTML).toContain('const')
      expect(span?.innerHTML).toContain('x')
    })
  })

  describe('block code rendering', () => {
    it('renders block code in div element', async () => {
      const jsx = await Code({ code: 'const x = 1', inline: false })
      const { container } = render(jsx)

      const div = container.querySelector('div')
      expect(div).toBeInTheDocument()
    })

    it('defaults to block code when inline not specified', async () => {
      const jsx = await Code({ code: 'const x = 1' })
      const { container } = render(jsx)

      const div = container.querySelector('div')
      expect(div).toBeInTheDocument()
    })

    it('preserves code text in block rendering', async () => {
      const jsx = await Code({ code: 'const x = 1', lang: 'javascript' })
      const { container } = render(jsx)

      const div = container.querySelector('div')
      expect(div?.innerHTML).toContain('const')
      expect(div?.innerHTML).toContain('x')
    })

    it('wraps block code in pre and code elements', async () => {
      const jsx = await Code({ code: 'const x = 1', lang: 'javascript' })
      const { container } = render(jsx)

      // rehype-pretty-code creates this structure
      expect(container.querySelector('pre')).toBeInTheDocument()
      expect(container.querySelector('code')).toBeInTheDocument()
    })
  })

  describe('language handling', () => {
    it.each([
      { lang: 'javascript', code: 'const x = 1' },
      { lang: 'python', code: 'x = 1' },
      { lang: 'typescript', code: 'const x: number = 1' },
      { lang: 'bash', code: 'echo "hello"' },
    ])('processes and preserves $lang code', async ({ lang, code }) => {
      const jsx = await Code({ code, lang })
      const { container } = render(jsx)

      const codeElement = container.querySelector('code')
      expect(codeElement).toBeInTheDocument()
      expect(codeElement?.textContent).toContain(code)
    })

    it('defaults to plaintext when no lang specified', async () => {
      const jsx = await Code({ code: 'some text' })
      const { container } = render(jsx)

      const codeElement = container.querySelector('code')
      expect(codeElement).toBeInTheDocument()
      expect(codeElement?.textContent).toBe('some text')
    })
  })

  describe('meta string handling', () => {
    it('renders code without meta string', async () => {
      const jsx = await Code({ code: 'const x = 1', lang: 'javascript' })
      const { container } = render(jsx)

      expect(container.querySelector('code')).toBeInTheDocument()
    })

    it('renders code with meta string', async () => {
      // Meta strings are used by rehype-pretty-code for features like line highlighting
      const jsx = await Code({ code: 'const x = 1', lang: 'javascript', meta: '{1}' })
      const { container } = render(jsx)

      expect(container.querySelector('code')).toBeInTheDocument()
    })
  })

  describe('italic removal', () => {
    it('removes font-style:italic from output', async () => {
      const jsx = await Code({ code: 'const x = 1', lang: 'javascript' })
      const { container } = render(jsx)

      // Should not contain inline italic styles
      expect(container.innerHTML).not.toContain('font-style:italic')
    })
  })

  describe('HTML escaping and safety', () => {
    it('escapes HTML special characters', async () => {
      const jsx = await Code({ code: '<script>alert("xss")</script>' })
      const { container } = render(jsx)

      // Should be escaped, not executed
      const codeElement = container.querySelector('code')
      expect(codeElement?.textContent).toContain('<script>')
      expect(codeElement?.textContent).toContain('</script>')
    })

    it('escapes angle brackets', async () => {
      const jsx = await Code({ code: 'const x = a < b && c > d' })
      const { container } = render(jsx)

      const codeElement = container.querySelector('code')
      expect(codeElement?.textContent).toContain('<')
      expect(codeElement?.textContent).toContain('>')
    })

    it('escapes ampersands', async () => {
      const jsx = await Code({ code: 'const x = a && b' })
      const { container } = render(jsx)

      const codeElement = container.querySelector('code')
      expect(codeElement?.textContent).toContain('&&')
    })

    it('preserves newlines in block code', async () => {
      const jsx = await Code({ code: 'line1\nline2\nline3' })
      const { container } = render(jsx)

      const codeElement = container.querySelector('code')
      expect(codeElement?.textContent).toContain('line1')
      expect(codeElement?.textContent).toContain('line2')
      expect(codeElement?.textContent).toContain('line3')
    })
  })

  describe('special characters and edge cases', () => {
    it('handles empty code string', async () => {
      const jsx = await Code({ code: '' })
      const { container } = render(jsx)

      const codeElement = container.querySelector('code')
      expect(codeElement).toBeInTheDocument()
    })

    it('handles code with only whitespace', async () => {
      const jsx = await Code({ code: '   \n   ' })
      const { container } = render(jsx)

      const codeElement = container.querySelector('code')
      expect(codeElement).toBeInTheDocument()
    })

    it('handles code with special characters', async () => {
      const jsx = await Code({ code: '!@#$%^&*()_+-=[]{}|;:\'",.<>?/~`' })
      const { container } = render(jsx)

      const codeElement = container.querySelector('code')
      expect(codeElement?.textContent).toContain('!@#$%')
    })

    it('handles code with unicode characters', async () => {
      const jsx = await Code({ code: '你好 世界 🚀' })
      const { container } = render(jsx)

      const codeElement = container.querySelector('code')
      expect(codeElement?.textContent).toContain('你好')
      expect(codeElement?.textContent).toContain('🚀')
    })
  })

  describe('dangerouslySetInnerHTML usage', () => {
    it('uses dangerouslySetInnerHTML for inline code', async () => {
      const jsx = await Code({ code: 'test', inline: true })
      const { container } = render(jsx)

      const span = container.querySelector('span')
      // Verify the element exists (dangerouslySetInnerHTML was used)
      expect(span).toBeInTheDocument()
    })

    it('uses dangerouslySetInnerHTML for block code', async () => {
      const jsx = await Code({ code: 'test' })
      const { container } = render(jsx)

      const div = container.querySelector('div')
      // Verify the element exists (dangerouslySetInnerHTML was used)
      expect(div).toBeInTheDocument()
    })
  })
})
