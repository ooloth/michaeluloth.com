import { z } from 'zod'

/**
 * Rich text schema - validates and transforms Notion rich text to ergonomic shape
 */
export const RichTextItemSchema = z
  .object({
    type: z.literal('text'),
    text: z.object({
      content: z.string(),
      link: z
        .object({
          url: z.string().url(),
        })
        .nullable()
        .optional(),
    }),
    annotations: z.object({
      bold: z.boolean(),
      italic: z.boolean(),
      strikethrough: z.boolean(),
      underline: z.boolean(),
      code: z.boolean(),
    }),
  })
  .transform(data => ({
    content: data.text.content,
    link: data.text.link?.url ?? null,
    bold: data.annotations.bold,
    italic: data.annotations.italic,
    strikethrough: data.annotations.strikethrough,
    underline: data.annotations.underline,
    code: data.annotations.code,
  }))

export type RichTextItem = z.infer<typeof RichTextItemSchema>

/**
 * Paragraph block schema
 */
const ParagraphBlockSchema = z
  .object({
    type: z.literal('paragraph'),
    paragraph: z.object({
      rich_text: z.array(RichTextItemSchema),
    }),
  })
  .transform(data => ({
    type: 'paragraph' as const,
    richText: data.paragraph.rich_text,
  }))

/**
 * Heading blocks schema
 */
const Heading1BlockSchema = z
  .object({
    type: z.literal('heading_1'),
    heading_1: z.object({
      rich_text: z.array(RichTextItemSchema),
    }),
  })
  .transform(data => ({
    type: 'heading_1' as const,
    richText: data.heading_1.rich_text,
  }))

const Heading2BlockSchema = z
  .object({
    type: z.literal('heading_2'),
    heading_2: z.object({
      rich_text: z.array(RichTextItemSchema),
    }),
  })
  .transform(data => ({
    type: 'heading_2' as const,
    richText: data.heading_2.rich_text,
  }))

const Heading3BlockSchema = z
  .object({
    type: z.literal('heading_3'),
    heading_3: z.object({
      rich_text: z.array(RichTextItemSchema),
    }),
  })
  .transform(data => ({
    type: 'heading_3' as const,
    richText: data.heading_3.rich_text,
  }))

/**
 * Quote block schema
 */
const QuoteBlockSchema = z
  .object({
    type: z.literal('quote'),
    quote: z.object({
      rich_text: z.array(RichTextItemSchema),
    }),
  })
  .transform(data => ({
    type: 'quote' as const,
    richText: data.quote.rich_text,
  }))

/**
 * Code block schema
 */
const CodeBlockSchema = z
  .object({
    type: z.literal('code'),
    code: z.object({
      rich_text: z.array(RichTextItemSchema),
      language: z.string(),
      caption: z.array(RichTextItemSchema),
    }),
  })
  .transform(data => ({
    type: 'code' as const,
    richText: data.code.rich_text,
    language: data.code.language,
    caption: data.code.caption.length > 0 ? data.code.caption.map(item => item.content).join('') : null,
  }))

/**
 * Image block schema
 */
const ImageBlockSchema = z
  .object({
    type: z.literal('image'),
    image: z.union([
      z.object({
        type: z.literal('external'),
        external: z.object({ url: z.string().url() }),
      }),
      z.object({
        type: z.literal('file'),
        file: z.object({ url: z.string().url() }),
      }),
    ]),
  })
  .transform(data => ({
    type: 'image' as const,
    url: data.image.type === 'external' ? data.image.external.url : data.image.file.url,
  }))

/**
 * Video block schema
 */
const VideoBlockSchema = z
  .object({
    type: z.literal('video'),
    video: z.union([
      z.object({
        type: z.literal('external'),
        external: z.object({ url: z.string().url() }),
        caption: z.array(RichTextItemSchema),
      }),
      z.object({
        type: z.literal('file'),
        file: z.object({ url: z.string().url() }),
        caption: z.array(RichTextItemSchema),
      }),
    ]),
  })
  .transform(data => ({
    type: 'video' as const,
    url: data.video.type === 'external' ? data.video.external.url : data.video.file.url,
    caption: data.video.caption.length > 0 ? data.video.caption.map(item => item.content).join('') : null,
  }))

/**
 * List item schemas (will be grouped into lists during transformation)
 */
export const BulletedListItemBlockSchema = z
  .object({
    type: z.literal('bulleted_list_item'),
    bulleted_list_item: z.object({
      rich_text: z.array(RichTextItemSchema),
    }),
  })
  .transform(data => ({
    type: 'bulleted_list_item' as const,
    richText: data.bulleted_list_item.rich_text,
  }))

export const NumberedListItemBlockSchema = z
  .object({
    type: z.literal('numbered_list_item'),
    numbered_list_item: z.object({
      rich_text: z.array(RichTextItemSchema),
    }),
  })
  .transform(data => ({
    type: 'numbered_list_item' as const,
    richText: data.numbered_list_item.rich_text,
  }))

/**
 * Toggle block schema (recursive - contains children blocks)
 */
const ToggleBlockSchema: z.ZodType<any> = z
  .object({
    type: z.literal('toggle'),
    toggle: z.object({
      rich_text: z.array(RichTextItemSchema),
    }),
    // Children are validated recursively
    children: z.array(z.lazy(() => BlockSchema)).optional(),
  })
  .transform(data => ({
    type: 'toggle' as const,
    richText: data.toggle.rich_text,
    children: data.children ?? [],
  }))

/**
 * Child page block schema
 */
const ChildPageBlockSchema = z
  .object({
    type: z.literal('child_page'),
    child_page: z.object({
      title: z.string(),
    }),
  })
  .transform(data => ({
    type: 'child_page' as const,
    title: data.child_page.title,
  }))

/**
 * Main block schema - discriminated union of all block types
 */
export const BlockSchema = z.discriminatedUnion('type', [
  ParagraphBlockSchema,
  Heading1BlockSchema,
  Heading2BlockSchema,
  Heading3BlockSchema,
  QuoteBlockSchema,
  CodeBlockSchema,
  ImageBlockSchema,
  VideoBlockSchema,
  BulletedListItemBlockSchema,
  NumberedListItemBlockSchema,
  ToggleBlockSchema,
  ChildPageBlockSchema,
])

export type Block = z.infer<typeof BlockSchema>

/**
 * Grouped list blocks (created during transformation)
 */
export type BulletedListBlock = {
  type: 'bulleted_list'
  items: { richText: RichTextItem[] }[]
}

export type NumberedListBlock = {
  type: 'numbered_list'
  items: { richText: RichTextItem[] }[]
}

export type GroupedBlock =
  | Exclude<Block, { type: 'bulleted_list_item' } | { type: 'numbered_list_item' }>
  | BulletedListBlock
  | NumberedListBlock
