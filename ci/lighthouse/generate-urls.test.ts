import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { extractPostSlugsFromRss, selectPostSlugs, generateLighthouseUrls } from './generate-urls'

describe('extractPostSlugsFromRss', () => {
  it('extracts post slugs from well-formed RSS', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss>
  <channel>
    <item>
      <link>https://michaeluloth.com/</link>
    </item>
    <item>
      <link>https://michaeluloth.com/newest-post/</link>
    </item>
    <item>
      <link>https://michaeluloth.com/second-post/</link>
    </item>
    <item>
      <link>https://michaeluloth.com/third-post/</link>
    </item>
    <item>
      <link>https://michaeluloth.com/fourth-post/</link>
    </item>
  </channel>
</rss>`

    const slugs = extractPostSlugsFromRss(xml, 3)

    expect(slugs).toEqual(['newest-post', 'second-post', 'third-post'])
  })

  it('returns empty array for RSS with no posts', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss>
  <channel>
    <title>My Blog</title>
  </channel>
</rss>`

    const slugs = extractPostSlugsFromRss(xml, 3)

    expect(slugs).toEqual([])
  })

  it('returns empty array for RSS with only homepage link', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss>
  <channel>
    <item>
      <link>https://michaeluloth.com/</link>
    </item>
  </channel>
</rss>`

    const slugs = extractPostSlugsFromRss(xml, 3)

    expect(slugs).toEqual([])
  })

  it('handles RSS with fewer posts than requested limit', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss>
  <channel>
    <item>
      <link>https://michaeluloth.com/only-post/</link>
    </item>
  </channel>
</rss>`

    const slugs = extractPostSlugsFromRss(xml, 3)

    expect(slugs).toEqual(['only-post'])
  })

  it('handles malformed XML gracefully', () => {
    const xml = 'not valid xml at all'

    const slugs = extractPostSlugsFromRss(xml, 3)

    expect(slugs).toEqual([])
  })

  it('filters out URLs with slashes (nested paths)', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss>
  <channel>
    <item>
      <link>https://michaeluloth.com/blog/nested-path/</link>
    </item>
    <item>
      <link>https://michaeluloth.com/good-post/</link>
    </item>
  </channel>
</rss>`

    const slugs = extractPostSlugsFromRss(xml, 3)

    expect(slugs).toEqual(['good-post'])
  })

  it('respects custom limit parameter', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss>
  <channel>
    <item>
      <link>https://michaeluloth.com/post-1/</link>
    </item>
    <item>
      <link>https://michaeluloth.com/post-2/</link>
    </item>
    <item>
      <link>https://michaeluloth.com/post-3/</link>
    </item>
  </channel>
</rss>`

    const slugs = extractPostSlugsFromRss(xml, 2)

    expect(slugs).toEqual(['post-1', 'post-2'])
  })

  it('handles slugs with hyphens and numbers', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss>
  <channel>
    <item>
      <link>https://michaeluloth.com/my-post-123/</link>
    </item>
    <item>
      <link>https://michaeluloth.com/another-post-with-many-hyphens/</link>
    </item>
  </channel>
</rss>`

    const slugs = extractPostSlugsFromRss(xml, 3)

    expect(slugs).toEqual(['my-post-123', 'another-post-with-many-hyphens'])
  })

  it('returns all slugs when no limit provided', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss>
  <channel>
    <item>
      <link>https://michaeluloth.com/post-1/</link>
    </item>
    <item>
      <link>https://michaeluloth.com/post-2/</link>
    </item>
    <item>
      <link>https://michaeluloth.com/post-3/</link>
    </item>
    <item>
      <link>https://michaeluloth.com/post-4/</link>
    </item>
  </channel>
</rss>`

    const slugs = extractPostSlugsFromRss(xml)

    expect(slugs).toEqual(['post-1', 'post-2', 'post-3', 'post-4'])
  })
})

describe('selectPostSlugs', () => {
  let randomSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    randomSpy = vi.spyOn(Math, 'random')
  })

  afterEach(() => {
    randomSpy.mockRestore()
  })

  it('returns empty array when no slugs provided', () => {
    const selected = selectPostSlugs([])

    expect(selected).toEqual([])
  })

  it('returns single slug when only one slug provided', () => {
    const selected = selectPostSlugs(['only-post'])

    expect(selected).toEqual(['only-post'])
  })

  it('returns latest post + random post from remaining posts', () => {
    // Mock Math.random to return 0 (selects first of remaining posts)
    randomSpy.mockReturnValue(0)

    const selected = selectPostSlugs(['newest', 'older-1', 'older-2', 'oldest'])

    expect(selected).toEqual(['newest', 'older-1'])
  })

  it('selects different random posts based on Math.random', () => {
    const allSlugs = ['newest', 'older-1', 'older-2', 'oldest']

    // Mock to select first remaining post (index 0)
    randomSpy.mockReturnValue(0)
    expect(selectPostSlugs(allSlugs)).toEqual(['newest', 'older-1'])

    // Mock to select middle remaining post (index 1)
    randomSpy.mockReturnValue(0.4)
    expect(selectPostSlugs(allSlugs)).toEqual(['newest', 'older-2'])

    // Mock to select last remaining post (index 2)
    randomSpy.mockReturnValue(0.99)
    expect(selectPostSlugs(allSlugs)).toEqual(['newest', 'oldest'])
  })

  it('always includes latest post as first element', () => {
    randomSpy.mockReturnValue(0.5)

    const selected = selectPostSlugs(['newest', 'older-1', 'older-2'])

    expect(selected[0]).toBe('newest')
    expect(selected).toHaveLength(2)
  })

  it('handles exactly 2 posts (returns both)', () => {
    randomSpy.mockReturnValue(0.5)

    const selected = selectPostSlugs(['newest', 'second-newest'])

    expect(selected).toEqual(['newest', 'second-newest'])
  })
})

describe('generateLighthouseUrls', () => {
  it('generates URLs with static pages and post pages', () => {
    const postSlugs = ['my-post', 'another-post']

    const urls = generateLighthouseUrls(postSlugs)

    expect(urls).toEqual([
      'http://localhost/index.html',
      'http://localhost/blog/index.html',
      'http://localhost/likes/index.html',
      'http://localhost/404/index.html',
      'http://localhost/my-post/index.html',
      'http://localhost/another-post/index.html',
    ])
  })

  it('generates only static URLs when no posts provided', () => {
    const urls = generateLighthouseUrls([])

    expect(urls).toEqual([
      'http://localhost/index.html',
      'http://localhost/blog/index.html',
      'http://localhost/likes/index.html',
      'http://localhost/404/index.html',
    ])
  })

  it('handles slugs with special characters', () => {
    const postSlugs = ['post-with-123-numbers', 'post-with-many-hyphens']

    const urls = generateLighthouseUrls(postSlugs)

    expect(urls).toContain('http://localhost/post-with-123-numbers/index.html')
    expect(urls).toContain('http://localhost/post-with-many-hyphens/index.html')
  })

  it('maintains order of static URLs followed by post URLs', () => {
    const postSlugs = ['post-a', 'post-b']

    const urls = generateLighthouseUrls(postSlugs)

    expect(urls[0]).toBe('http://localhost/index.html')
    expect(urls[urls.length - 2]).toBe('http://localhost/post-a/index.html')
    expect(urls[urls.length - 1]).toBe('http://localhost/post-b/index.html')
  })
})
