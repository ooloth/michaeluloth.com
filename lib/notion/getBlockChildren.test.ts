import { describe, it, expect, vi } from 'vitest'
import getBlockChildren, { validateBlocks, INVALID_BLOCK_ERROR } from './getBlockChildren'
import * as client from './client'
import type { GroupedBlock } from './schemas/block'
import { isOk, isErr } from '@/utils/result'

// Mock the client
vi.mock('./client', () => ({
  default: {
    blocks: {
      children: {
        list: vi.fn(),
      },
    },
  },
  collectPaginatedAPI: vi.fn(),
}))

describe('validateBlocks', () => {
  describe('rich text transformation', () => {
    it('transforms rich text with all annotations', () => {
      const blocks = [
        {
          type: 'paragraph',
          paragraph: {
            rich_text: [
              {
                type: 'text',
                text: {
                  content: 'Bold and italic',
                  link: null,
                },
                annotations: {
                  bold: true,
                  italic: true,
                  strikethrough: false,
                  underline: false,
                  code: false,
                },
              },
            ],
          },
        },
      ]

      const result = validateBlocks(blocks)

      expect(result).toEqual([
        {
          type: 'paragraph',
          richText: [
            {
              content: 'Bold and italic',
              link: null,
              bold: true,
              italic: true,
              strikethrough: false,
              underline: false,
              code: false,
            },
          ],
        },
      ])
    })

    it('transforms rich text with link', () => {
      const blocks = [
        {
          type: 'paragraph',
          paragraph: {
            rich_text: [
              {
                type: 'text',
                text: {
                  content: 'Click here',
                  link: { url: 'https://example.com' },
                },
                annotations: {
                  bold: false,
                  italic: false,
                  strikethrough: false,
                  underline: true,
                  code: false,
                },
              },
            ],
          },
        },
      ]

      const result = validateBlocks(blocks)

      expect(result[0]).toMatchObject({
        type: 'paragraph',
        richText: [
          {
            content: 'Click here',
            link: 'https://example.com',
            underline: true,
          },
        ],
      })
    })
  })

  describe('block transformations', () => {
    it('transforms paragraph blocks', () => {
      const blocks = [
        {
          type: 'paragraph',
          paragraph: {
            rich_text: [
              {
                type: 'text',
                text: { content: 'Simple paragraph', link: null },
                annotations: {
                  bold: false,
                  italic: false,
                  strikethrough: false,
                  underline: false,
                  code: false,
                },
              },
            ],
          },
        },
      ]

      const result = validateBlocks(blocks)

      expect(result).toEqual([
        {
          type: 'paragraph',
          richText: [
            {
              content: 'Simple paragraph',
              link: null,
              bold: false,
              italic: false,
              strikethrough: false,
              underline: false,
              code: false,
            },
          ],
        },
      ])
    })

    it('transforms heading blocks', () => {
      const headings = [
        {
          type: 'heading_1',
          heading_1: {
            rich_text: [
              {
                type: 'text',
                text: { content: 'Heading 1', link: null },
                annotations: {
                  bold: false,
                  italic: false,
                  strikethrough: false,
                  underline: false,
                  code: false,
                },
              },
            ],
          },
        },
        {
          type: 'heading_2',
          heading_2: {
            rich_text: [
              {
                type: 'text',
                text: { content: 'Heading 2', link: null },
                annotations: {
                  bold: false,
                  italic: false,
                  strikethrough: false,
                  underline: false,
                  code: false,
                },
              },
            ],
          },
        },
        {
          type: 'heading_3',
          heading_3: {
            rich_text: [
              {
                type: 'text',
                text: { content: 'Heading 3', link: null },
                annotations: {
                  bold: false,
                  italic: false,
                  strikethrough: false,
                  underline: false,
                  code: false,
                },
              },
            ],
          },
        },
      ]

      const result = validateBlocks(headings)

      expect(result[0].type).toBe('heading_1')
      expect(result[1].type).toBe('heading_2')
      expect(result[2].type).toBe('heading_3')
      expect(result[0]).toHaveProperty('richText')
      expect(result[1]).toHaveProperty('richText')
      expect(result[2]).toHaveProperty('richText')
    })

    it('transforms quote blocks', () => {
      const blocks = [
        {
          type: 'quote',
          quote: {
            rich_text: [
              {
                type: 'text',
                text: { content: 'Quoted text', link: null },
                annotations: {
                  bold: false,
                  italic: true,
                  strikethrough: false,
                  underline: false,
                  code: false,
                },
              },
            ],
          },
        },
      ]

      const result = validateBlocks(blocks)

      expect(result).toEqual([
        {
          type: 'quote',
          richText: [
            {
              content: 'Quoted text',
              link: null,
              bold: false,
              italic: true,
              strikethrough: false,
              underline: false,
              code: false,
            },
          ],
        },
      ])
    })

    it('transforms code blocks with language and caption', () => {
      const blocks = [
        {
          type: 'code',
          code: {
            rich_text: [
              {
                type: 'text',
                text: { content: 'const x = 5;', link: null },
                annotations: {
                  bold: false,
                  italic: false,
                  strikethrough: false,
                  underline: false,
                  code: false,
                },
              },
            ],
            language: 'javascript',
            caption: [
              {
                type: 'text',
                text: { content: 'Variable declaration', link: null },
                annotations: {
                  bold: false,
                  italic: false,
                  strikethrough: false,
                  underline: false,
                  code: false,
                },
              },
            ],
          },
        },
      ]

      const result = validateBlocks(blocks)

      expect(result).toEqual([
        {
          type: 'code',
          richText: [
            {
              content: 'const x = 5;',
              link: null,
              bold: false,
              italic: false,
              strikethrough: false,
              underline: false,
              code: false,
            },
          ],
          language: 'javascript',
          caption: 'Variable declaration',
        },
      ])
    })

    it('transforms code blocks with empty caption to null', () => {
      const blocks = [
        {
          type: 'code',
          code: {
            rich_text: [
              {
                type: 'text',
                text: { content: 'console.log("hi")', link: null },
                annotations: {
                  bold: false,
                  italic: false,
                  strikethrough: false,
                  underline: false,
                  code: false,
                },
              },
            ],
            language: 'typescript',
            caption: [],
          },
        },
      ]

      const result = validateBlocks(blocks)

      expect(result[0]).toMatchObject({
        type: 'code',
        caption: null,
      })
    })

    it('transforms image blocks with external URL', () => {
      const blocks = [
        {
          type: 'image',
          image: {
            type: 'external',
            external: { url: 'https://example.com/image.png' },
          },
        },
      ]

      const result = validateBlocks(blocks)

      expect(result).toEqual([
        {
          type: 'image',
          url: 'https://example.com/image.png',
        },
      ])
    })

    it('transforms image blocks with file URL', () => {
      const blocks = [
        {
          type: 'image',
          image: {
            type: 'file',
            file: { url: 'https://notion.so/files/image.png' },
          },
        },
      ]

      const result = validateBlocks(blocks)

      expect(result).toEqual([
        {
          type: 'image',
          url: 'https://notion.so/files/image.png',
        },
      ])
    })

    it('transforms video blocks with caption', () => {
      const blocks = [
        {
          type: 'video',
          video: {
            type: 'external',
            external: { url: 'https://youtube.com/watch?v=abc' },
            caption: [
              {
                type: 'text',
                text: { content: 'Demo video', link: null },
                annotations: {
                  bold: false,
                  italic: false,
                  strikethrough: false,
                  underline: false,
                  code: false,
                },
              },
            ],
          },
        },
      ]

      const result = validateBlocks(blocks)

      expect(result).toEqual([
        {
          type: 'video',
          url: 'https://youtube.com/watch?v=abc',
          caption: 'Demo video',
        },
      ])
    })

    it('transforms video blocks with empty caption to null', () => {
      const blocks = [
        {
          type: 'video',
          video: {
            type: 'file',
            file: { url: 'https://notion.so/files/video.mp4' },
            caption: [],
          },
        },
      ]

      const result = validateBlocks(blocks)

      expect(result[0]).toMatchObject({
        type: 'video',
        caption: null,
      })
    })

    it('transforms child_page blocks', () => {
      const blocks = [
        {
          type: 'child_page',
          child_page: {
            title: 'Subpage Title',
          },
        },
      ]

      const result = validateBlocks(blocks)

      expect(result).toEqual([
        {
          type: 'child_page',
          title: 'Subpage Title',
        },
      ])
    })
  })

  describe('list grouping', () => {
    it('groups consecutive bulleted list items', () => {
      const blocks = [
        {
          type: 'bulleted_list_item',
          bulleted_list_item: {
            rich_text: [
              {
                type: 'text',
                text: { content: 'First item', link: null },
                annotations: {
                  bold: false,
                  italic: false,
                  strikethrough: false,
                  underline: false,
                  code: false,
                },
              },
            ],
          },
        },
        {
          type: 'bulleted_list_item',
          bulleted_list_item: {
            rich_text: [
              {
                type: 'text',
                text: { content: 'Second item', link: null },
                annotations: {
                  bold: false,
                  italic: false,
                  strikethrough: false,
                  underline: false,
                  code: false,
                },
              },
            ],
          },
        },
        {
          type: 'bulleted_list_item',
          bulleted_list_item: {
            rich_text: [
              {
                type: 'text',
                text: { content: 'Third item', link: null },
                annotations: {
                  bold: false,
                  italic: false,
                  strikethrough: false,
                  underline: false,
                  code: false,
                },
              },
            ],
          },
        },
      ]

      const result = validateBlocks(blocks)

      expect(result).toEqual([
        {
          type: 'bulleted_list',
          items: [
            {
              richText: [
                {
                  content: 'First item',
                  link: null,
                  bold: false,
                  italic: false,
                  strikethrough: false,
                  underline: false,
                  code: false,
                },
              ],
            },
            {
              richText: [
                {
                  content: 'Second item',
                  link: null,
                  bold: false,
                  italic: false,
                  strikethrough: false,
                  underline: false,
                  code: false,
                },
              ],
            },
            {
              richText: [
                {
                  content: 'Third item',
                  link: null,
                  bold: false,
                  italic: false,
                  strikethrough: false,
                  underline: false,
                  code: false,
                },
              ],
            },
          ],
        },
      ])
    })

    it('groups consecutive numbered list items', () => {
      const blocks = [
        {
          type: 'numbered_list_item',
          numbered_list_item: {
            rich_text: [
              {
                type: 'text',
                text: { content: 'Step 1', link: null },
                annotations: {
                  bold: false,
                  italic: false,
                  strikethrough: false,
                  underline: false,
                  code: false,
                },
              },
            ],
          },
        },
        {
          type: 'numbered_list_item',
          numbered_list_item: {
            rich_text: [
              {
                type: 'text',
                text: { content: 'Step 2', link: null },
                annotations: {
                  bold: false,
                  italic: false,
                  strikethrough: false,
                  underline: false,
                  code: false,
                },
              },
            ],
          },
        },
      ]

      const result = validateBlocks(blocks)

      expect(result).toEqual([
        {
          type: 'numbered_list',
          items: [
            {
              richText: [
                {
                  content: 'Step 1',
                  link: null,
                  bold: false,
                  italic: false,
                  strikethrough: false,
                  underline: false,
                  code: false,
                },
              ],
            },
            {
              richText: [
                {
                  content: 'Step 2',
                  link: null,
                  bold: false,
                  italic: false,
                  strikethrough: false,
                  underline: false,
                  code: false,
                },
              ],
            },
          ],
        },
      ])
    })

    it('creates separate lists when interrupted by other block types', () => {
      const blocks = [
        {
          type: 'bulleted_list_item',
          bulleted_list_item: {
            rich_text: [
              {
                type: 'text',
                text: { content: 'First list item', link: null },
                annotations: {
                  bold: false,
                  italic: false,
                  strikethrough: false,
                  underline: false,
                  code: false,
                },
              },
            ],
          },
        },
        {
          type: 'paragraph',
          paragraph: {
            rich_text: [
              {
                type: 'text',
                text: { content: 'Interrupting paragraph', link: null },
                annotations: {
                  bold: false,
                  italic: false,
                  strikethrough: false,
                  underline: false,
                  code: false,
                },
              },
            ],
          },
        },
        {
          type: 'bulleted_list_item',
          bulleted_list_item: {
            rich_text: [
              {
                type: 'text',
                text: { content: 'Second list item', link: null },
                annotations: {
                  bold: false,
                  italic: false,
                  strikethrough: false,
                  underline: false,
                  code: false,
                },
              },
            ],
          },
        },
      ]

      const result = validateBlocks(blocks)

      expect(result).toHaveLength(3)
      expect(result[0].type).toBe('bulleted_list')
      expect((result[0] as any).items).toHaveLength(1)
      expect(result[1].type).toBe('paragraph')
      expect(result[2].type).toBe('bulleted_list')
      expect((result[2] as any).items).toHaveLength(1)
    })
  })

  describe('toggle blocks with recursive children', () => {
    it('transforms toggle blocks with children', () => {
      const blocks = [
        {
          type: 'toggle',
          toggle: {
            rich_text: [
              {
                type: 'text',
                text: { content: 'Click to expand', link: null },
                annotations: {
                  bold: false,
                  italic: false,
                  strikethrough: false,
                  underline: false,
                  code: false,
                },
              },
            ],
          },
          children: [
            {
              type: 'paragraph',
              paragraph: {
                rich_text: [
                  {
                    type: 'text',
                    text: { content: 'Hidden content', link: null },
                    annotations: {
                      bold: false,
                      italic: false,
                      strikethrough: false,
                      underline: false,
                      code: false,
                    },
                  },
                ],
              },
            },
          ],
        },
      ]

      const result = validateBlocks(blocks)

      expect(result).toEqual([
        {
          type: 'toggle',
          richText: [
            {
              content: 'Click to expand',
              link: null,
              bold: false,
              italic: false,
              strikethrough: false,
              underline: false,
              code: false,
            },
          ],
          children: [
            {
              type: 'paragraph',
              richText: [
                {
                  content: 'Hidden content',
                  link: null,
                  bold: false,
                  italic: false,
                  strikethrough: false,
                  underline: false,
                  code: false,
                },
              ],
            },
          ],
        },
      ])
    })

    it('groups list items inside toggle children', () => {
      const blocks = [
        {
          type: 'toggle',
          toggle: {
            rich_text: [
              {
                type: 'text',
                text: { content: 'Toggle with list', link: null },
                annotations: {
                  bold: false,
                  italic: false,
                  strikethrough: false,
                  underline: false,
                  code: false,
                },
              },
            ],
          },
          children: [
            {
              type: 'bulleted_list_item',
              bulleted_list_item: {
                rich_text: [
                  {
                    type: 'text',
                    text: { content: 'Nested item 1', link: null },
                    annotations: {
                      bold: false,
                      italic: false,
                      strikethrough: false,
                      underline: false,
                      code: false,
                    },
                  },
                ],
              },
            },
            {
              type: 'bulleted_list_item',
              bulleted_list_item: {
                rich_text: [
                  {
                    type: 'text',
                    text: { content: 'Nested item 2', link: null },
                    annotations: {
                      bold: false,
                      italic: false,
                      strikethrough: false,
                      underline: false,
                      code: false,
                    },
                  },
                ],
              },
            },
          ],
        },
      ]

      const result = validateBlocks(blocks) as GroupedBlock[]

      expect(result[0].type).toBe('toggle')
      expect((result[0] as any).children).toHaveLength(1)
      expect((result[0] as any).children[0].type).toBe('bulleted_list')
      expect((result[0] as any).children[0].items).toHaveLength(2)
    })

    it('handles toggle blocks with no children', () => {
      const blocks = [
        {
          type: 'toggle',
          toggle: {
            rich_text: [
              {
                type: 'text',
                text: { content: 'Empty toggle', link: null },
                annotations: {
                  bold: false,
                  italic: false,
                  strikethrough: false,
                  underline: false,
                  code: false,
                },
              },
            ],
          },
        },
      ]

      const result = validateBlocks(blocks)

      expect(result).toEqual([
        {
          type: 'toggle',
          richText: [
            {
              content: 'Empty toggle',
              link: null,
              bold: false,
              italic: false,
              strikethrough: false,
              underline: false,
              code: false,
            },
          ],
          children: [],
        },
      ])
    })
  })

  describe('validation errors', () => {
    it('throws on invalid block type', () => {
      const blocks = [
        {
          type: 'unsupported_block_type',
          unsupported_block_type: {},
        },
      ]

      expect(() => validateBlocks(blocks)).toThrow(INVALID_BLOCK_ERROR)
    })

    it('throws on missing required fields', () => {
      const blocks = [
        {
          type: 'paragraph',
          // missing paragraph.rich_text
        },
      ]

      expect(() => validateBlocks(blocks)).toThrow(INVALID_BLOCK_ERROR)
    })

    it('throws on invalid rich text structure', () => {
      const blocks = [
        {
          type: 'paragraph',
          paragraph: {
            rich_text: [
              {
                type: 'text',
                // missing text.content
                text: {},
                annotations: {
                  bold: false,
                  italic: false,
                  strikethrough: false,
                  underline: false,
                  code: false,
                },
              },
            ],
          },
        },
      ]

      expect(() => validateBlocks(blocks)).toThrow(INVALID_BLOCK_ERROR)
    })

    it('throws on invalid URL', () => {
      const blocks = [
        {
          type: 'image',
          image: {
            type: 'external',
            external: { url: 'not-a-url' },
          },
        },
      ]

      expect(() => validateBlocks(blocks)).toThrow(INVALID_BLOCK_ERROR)
    })
  })
})

describe('getBlockChildren', () => {
  it('fetches and validates blocks from Notion API', async () => {
    const mockBlocks = [
      {
        type: 'paragraph',
        paragraph: {
          rich_text: [
            {
              type: 'text',
              text: { content: 'Test paragraph', link: null },
              annotations: {
                bold: false,
                italic: false,
                strikethrough: false,
                underline: false,
                code: false,
              },
            },
          ],
        },
      },
    ]

    vi.mocked(client.collectPaginatedAPI).mockResolvedValue(mockBlocks)

    const result = await getBlockChildren('test-block-id')

    expect(client.collectPaginatedAPI).toHaveBeenCalledWith(client.default.blocks.children.list, {
      block_id: 'test-block-id',
    })

    expect(isOk(result)).toBe(true)
    if (isOk(result)) {
      expect(result.value).toEqual([
        {
          type: 'paragraph',
          richText: [
            {
              content: 'Test paragraph',
              link: null,
              bold: false,
              italic: false,
              strikethrough: false,
              underline: false,
              code: false,
            },
          ],
        },
      ])
    }
  })

  it('returns Err on invalid data from API', async () => {
    const invalidBlocks = [
      {
        type: 'paragraph',
        // missing paragraph field
      },
    ]

    vi.mocked(client.collectPaginatedAPI).mockResolvedValue(invalidBlocks)

    const result = await getBlockChildren('test-block-id')

    expect(isErr(result)).toBe(true)
    if (isErr(result)) {
      expect(result.error.message).toBe(INVALID_BLOCK_ERROR)
    }
  })

  it('returns Err when Notion API call fails', async () => {
    const apiError = new Error('Notion API error')
    vi.mocked(client.collectPaginatedAPI).mockRejectedValue(apiError)

    const result = await getBlockChildren('test-block-id')

    expect(isErr(result)).toBe(true)
    if (isErr(result)) {
      expect(result.error).toBe(apiError)
    }
  })

  it('wraps non-Error exceptions as Error', async () => {
    vi.mocked(client.collectPaginatedAPI).mockRejectedValue('string error')

    const result = await getBlockChildren('test-block-id')

    expect(isErr(result)).toBe(true)
    if (isErr(result)) {
      expect(result.error).toBeInstanceOf(Error)
      expect(result.error.message).toBe('string error')
    }
  })
})
