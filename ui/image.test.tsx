/**
 * @vitest-environment happy-dom
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import Image from './image'
import { Ok } from '@/utils/errors/result'
import type { CloudinaryImageMetadata } from '@/io/cloudinary/fetchCloudinaryImageMetadata'

// Mock the entire module
vi.mock('@/io/cloudinary/fetchCloudinaryImageMetadata')

// Import after mocking
import fetchCloudinaryImageMetadata from '@/io/cloudinary/fetchCloudinaryImageMetadata'

const mockMetadata: CloudinaryImageMetadata = {
  alt: 'Test image',
  caption: '',
  height: 800,
  width: 1200,
  sizes: '(min-width: 768px) 768px, 100vw',
  src: 'https://res.cloudinary.com/test/image/upload/c_scale,f_auto,q_auto,w_1440/test-image',
  srcSet: 'https://res.cloudinary.com/test/image/upload/c_scale,f_auto,q_auto,w_350/test-image 350w, ...',
}

describe('Image', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(fetchCloudinaryImageMetadata).mockResolvedValue(Ok(mockMetadata))
  })

  describe('URL validation', () => {
    it.each([
      { url: 'https://example.com/image.jpg', description: 'non-Cloudinary URL' },
      { url: '/local/image.png', description: 'local path' },
      { url: 'https://imgur.com/abc123', description: 'different CDN' },
    ])('throws error for $description', async ({ url }) => {
      await expect(async () => {
        const jsx = await Image({ url })
        render(jsx)
      }).rejects.toThrow(`🚨 Image URL is not a Cloudinary URL: "${url}"`)
    })

    it.each([
      { url: 'https://res.cloudinary.com/demo/image/upload/sample.jpg' },
      { url: 'https://cloudinary.com/console/media_library/asset/image/upload/v123/sample' },
    ])('accepts Cloudinary URL: $url', async ({ url }) => {
      const jsx = await Image({ url })
      render(jsx)
      const img = screen.getByRole('img')
      expect(img).toBeInTheDocument()
    })
  })

  describe('metadata fetching', () => {
    it('calls fetchCloudinaryImageMetadata with URL', async () => {
      const url = 'https://res.cloudinary.com/test/image/upload/sample.jpg'
      await Image({ url })
      expect(fetchCloudinaryImageMetadata).toHaveBeenCalledWith({
        url,
        effect: undefined,
      })
    })

    it('passes effect parameter to metadata fetch', async () => {
      const url = 'https://res.cloudinary.com/test/image/upload/sample.jpg'
      await Image({ url, effect: 'blur:300' })
      expect(fetchCloudinaryImageMetadata).toHaveBeenCalledWith({
        url,
        effect: 'blur:300',
      })
    })

    it('unwraps and uses fetched metadata', async () => {
      const customMetadata: CloudinaryImageMetadata = {
        alt: 'Custom alt text',
        caption: '',
        height: 600,
        width: 900,
        sizes: 'custom sizes',
        src: 'custom-src.jpg',
        srcSet: 'custom-srcset.jpg 1x',
      }
      vi.mocked(fetchCloudinaryImageMetadata).mockResolvedValue(Ok(customMetadata))

      const jsx = await Image({ url: 'https://res.cloudinary.com/test/sample.jpg' })
      render(jsx)

      const img = screen.getByRole('img')
      expect(img).toHaveAttribute('alt', 'Custom alt text')
      expect(img).toHaveAttribute('height', '600')
      expect(img).toHaveAttribute('width', '900')
      expect(img).toHaveAttribute('sizes', 'custom sizes')
      expect(img).toHaveAttribute('src', 'custom-src.jpg')
      expect(img).toHaveAttribute('srcset', 'custom-srcset.jpg 1x')
    })
  })

  describe('image attributes', () => {
    it.each([
      { loading: 'lazy' as const, expected: 'lazy' },
      { loading: 'eager' as const, expected: 'eager' },
    ])('sets loading="$expected" when loading=$loading', async ({ loading, expected }) => {
      const jsx = await Image({ url: 'https://res.cloudinary.com/test/sample.jpg', loading })
      render(jsx)
      const img = screen.getByRole('img')
      expect(img).toHaveAttribute('loading', expected)
    })

    it('defaults to lazy loading', async () => {
      const jsx = await Image({ url: 'https://res.cloudinary.com/test/sample.jpg' })
      render(jsx)
      const img = screen.getByRole('img')
      expect(img).toHaveAttribute('loading', 'lazy')
    })

    it.each([
      { fetchPriority: 'high' as const },
      { fetchPriority: 'low' as const },
      { fetchPriority: 'auto' as const },
    ])('sets fetchpriority="$fetchPriority"', async ({ fetchPriority }) => {
      const jsx = await Image({
        url: 'https://res.cloudinary.com/test/sample.jpg',
        fetchPriority,
      })
      render(jsx)
      const img = screen.getByRole('img')
      expect(img).toHaveAttribute('fetchpriority', fetchPriority)
    })
  })

  describe('caption handling', () => {
    it('wraps image in figure when caption provided', async () => {
      vi.mocked(fetchCloudinaryImageMetadata).mockResolvedValue(Ok({ ...mockMetadata, caption: 'Test caption' }))

      const jsx = await Image({ url: 'https://res.cloudinary.com/test/sample.jpg' })
      render(jsx)

      const figure = document.querySelector('figure')
      expect(figure).toBeInTheDocument()
      expect(screen.getByText('Test caption')).toBeInTheDocument()
    })

    it('wraps image in div when no caption', async () => {
      const jsx = await Image({ url: 'https://res.cloudinary.com/test/sample.jpg' })
      render(jsx)

      const figure = document.querySelector('figure')
      const div = document.querySelector('div')
      expect(figure).not.toBeInTheDocument()
      expect(div).toBeInTheDocument()
    })

    it('applies caption class to figcaption', async () => {
      vi.mocked(fetchCloudinaryImageMetadata).mockResolvedValue(Ok({ ...mockMetadata, caption: 'Test' }))

      const jsx = await Image({ url: 'https://res.cloudinary.com/test/sample.jpg' })
      render(jsx)

      const figcaption = document.querySelector('figcaption')
      expect(figcaption).toHaveClass('caption')
    })
  })

  describe('style customization', () => {
    it('applies default image styles', async () => {
      const jsx = await Image({ url: 'https://res.cloudinary.com/test/sample.jpg' })
      render(jsx)
      const img = screen.getByRole('img')
      expect(img).toHaveClass('shadow-xl', 'rounded', 'bg-zinc-800')
    })

    it('merges custom imageStyles with defaults', async () => {
      const jsx = await Image({
        url: 'https://res.cloudinary.com/test/sample.jpg',
        imageStyles: 'border-2',
      })
      render(jsx)
      const img = screen.getByRole('img')
      expect(img).toHaveClass('shadow-xl', 'rounded', 'bg-zinc-800', 'border-2')
    })

    it('applies default outer styles', async () => {
      const { container } = render(await Image({ url: 'https://res.cloudinary.com/test/sample.jpg' }))
      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).toHaveClass('my-6')
    })

    it('merges custom outerStyles with defaults', async () => {
      const { container } = render(
        await Image({
          url: 'https://res.cloudinary.com/test/sample.jpg',
          outerStyles: 'mx-auto',
        }),
      )
      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).toHaveClass('my-6', 'mx-auto')
    })
  })
})
