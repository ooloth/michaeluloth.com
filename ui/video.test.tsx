/**
 * @vitest-environment happy-dom
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import Video from './video'

describe('Video', () => {
  describe('YouTube URL detection and ID extraction', () => {
    it.each([
      {
        format: 'youtube.com/watch?v=',
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        videoId: 'dQw4w9WgXcQ',
      },
      {
        format: 'youtu.be/',
        url: 'https://youtu.be/dQw4w9WgXcQ',
        videoId: 'dQw4w9WgXcQ',
      },
      {
        format: 'youtube.com/embed/',
        url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        videoId: 'dQw4w9WgXcQ',
      },
      {
        format: 'youtube.com/watch with params',
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=30s',
        videoId: 'dQw4w9WgXcQ',
      },
    ])('extracts video ID from $format', ({ url, videoId }) => {
      render(<Video url={url} caption={null} />)
      const iframe = screen.getByTitle('YouTube video')
      expect(iframe).toHaveAttribute('src', `https://www.youtube-nocookie.com/embed/${videoId}`)
    })

    it('throws error for malformed YouTube URL', () => {
      const invalidUrl = 'https://youtube.com/invalid'
      expect(() => render(<Video url={invalidUrl} caption={null} />)).toThrow(
        'Failed to extract YouTube video ID from URL: https://youtube.com/invalid'
      )
    })
  })

  describe('YouTube iframe rendering', () => {
    it('renders iframe with correct embed URL', () => {
      render(<Video url="https://www.youtube.com/watch?v=abc123" caption={null} />)
      const iframe = screen.getByTitle('YouTube video')
      expect(iframe.tagName).toBe('IFRAME')
      expect(iframe).toHaveAttribute('src', 'https://www.youtube-nocookie.com/embed/abc123')
    })

    it('applies security attributes to iframe', () => {
      render(<Video url="https://youtu.be/abc123" caption={null} />)
      const iframe = screen.getByTitle('YouTube video')
      expect(iframe).toHaveAttribute('sandbox', 'allow-scripts allow-same-origin allow-presentation')
      expect(iframe).toHaveAttribute(
        'allow',
        'accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share'
      )
    })

    it('applies lazy loading to iframe', () => {
      render(<Video url="https://youtu.be/abc123" caption={null} />)
      const iframe = screen.getByTitle('YouTube video')
      expect(iframe).toHaveAttribute('loading', 'lazy')
    })

    it('allows fullscreen', () => {
      render(<Video url="https://youtu.be/abc123" caption={null} />)
      const iframe = screen.getByTitle('YouTube video')
      expect(iframe).toHaveAttribute('allowfullscreen')
    })

    it('applies default iframe styles', () => {
      render(<Video url="https://youtu.be/abc123" caption={null} />)
      const iframe = screen.getByTitle('YouTube video')
      expect(iframe).toHaveClass('shadow-xl', 'rounded', 'bg-zinc-800', 'w-full', 'aspect-video')
    })

    it('merges custom videoStyles with defaults', () => {
      render(<Video url="https://youtu.be/abc123" caption={null} videoStyles="border-2" />)
      const iframe = screen.getByTitle('YouTube video')
      expect(iframe).toHaveClass('shadow-xl', 'rounded', 'bg-zinc-800', 'w-full', 'aspect-video', 'border-2')
    })
  })

  describe('HTML5 video rendering', () => {
    it('renders video element for non-YouTube URLs', () => {
      render(<Video url="https://example.com/video.mp4" caption={null} />)
      const video = document.querySelector('video')
      expect(video).toBeInTheDocument()
      expect(video).toHaveAttribute('controls')
      expect(video).toHaveAttribute('preload', 'metadata')
      expect(video).toHaveAttribute('playsinline')
    })

    it('sets video source correctly', () => {
      render(<Video url="https://example.com/video.mp4" caption={null} />)
      const source = document.querySelector('video source')
      expect(source).toHaveAttribute('src', 'https://example.com/video.mp4')
    })

    it('includes fallback message', () => {
      render(<Video url="https://example.com/video.mp4" caption={null} />)
      expect(screen.getByText('Your browser does not support the video tag.')).toBeInTheDocument()
    })

    it('applies default video styles', () => {
      render(<Video url="https://example.com/video.mp4" caption={null} />)
      const video = document.querySelector('video')
      expect(video).toHaveClass('shadow-xl', 'rounded', 'bg-zinc-800', 'w-full')
    })

    it('merges custom videoStyles with defaults', () => {
      render(<Video url="https://example.com/video.mp4" caption={null} videoStyles="opacity-90" />)
      const video = document.querySelector('video')
      expect(video).toHaveClass('shadow-xl', 'rounded', 'bg-zinc-800', 'w-full', 'opacity-90')
    })
  })

  describe('caption handling', () => {
    it('wraps YouTube video in figure when caption provided', () => {
      render(<Video url="https://youtu.be/abc123" caption="Tutorial video" />)
      const figure = document.querySelector('figure')
      expect(figure).toBeInTheDocument()
      expect(screen.getByText('Tutorial video')).toBeInTheDocument()
      expect(screen.getByTitle('Tutorial video')).toBeInTheDocument()
    })

    it('wraps HTML5 video in figure when caption provided', () => {
      render(<Video url="https://example.com/video.mp4" caption="Demo video" />)
      const figure = document.querySelector('figure')
      expect(figure).toBeInTheDocument()
      expect(screen.getByText('Demo video')).toBeInTheDocument()
    })

    it('wraps YouTube video in div when no caption', () => {
      render(<Video url="https://youtu.be/abc123" caption={null} />)
      const figure = document.querySelector('figure')
      const div = document.querySelector('div')
      expect(figure).not.toBeInTheDocument()
      expect(div).toBeInTheDocument()
    })

    it('wraps HTML5 video in div when no caption', () => {
      render(<Video url="https://example.com/video.mp4" caption={null} />)
      const figure = document.querySelector('figure')
      const div = document.querySelector('div')
      expect(figure).not.toBeInTheDocument()
      expect(div).toBeInTheDocument()
    })

    it('applies caption class to figcaption', () => {
      render(<Video url="https://youtu.be/abc123" caption="Test" />)
      const figcaption = document.querySelector('figcaption')
      expect(figcaption).toHaveClass('caption')
    })
  })

  describe('outer styles', () => {
    it('applies default outer styles', () => {
      const { container } = render(<Video url="https://youtu.be/abc123" caption={null} />)
      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).toHaveClass('my-6')
    })

    it('merges custom outerStyles with defaults', () => {
      const { container } = render(<Video url="https://youtu.be/abc123" caption={null} outerStyles="mx-auto" />)
      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).toHaveClass('my-6', 'mx-auto')
    })
  })
})
