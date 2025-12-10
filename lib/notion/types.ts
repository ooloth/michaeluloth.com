// TODO: https://github.com/makenotion/notion-sdk-js?tab=readme-ov-file#typescript
// TODO: https://github.com/vogelino/notion-api-zod-schema/blob/main/src/NotionDatabaseSchema.ts
// TODO: https://github.com/vogelino/notion-api-zod-schema/blob/main/src/NotionObjectSchema.ts
// TODO: https://github.com/vogelino/notion-api-zod-schema/blob/main/src/NotionPageSchema.ts
// TODO: https://github.com/vogelino/notion-api-zod-schema/blob/main/src/NotionBlockSchema.ts
// TODO: https://github.com/vogelino/notion-api-zod-schema/blob/main/src/NotionTextSchema.ts
// TODO: rich text: https://developers.notion.com/reference/rich-text
// TODO: block: https://github.com/NotionX/react-notion-x/blob/master/packages/notion-types/src/block.ts

import {
  type BlockObjectResponse,
  type BulletedListItemBlockObjectResponse,
  type ChildPageBlockObjectResponse,
  type CodeBlockObjectResponse,
  type Heading1BlockObjectResponse,
  type Heading2BlockObjectResponse,
  type Heading3BlockObjectResponse,
  type ImageBlockObjectResponse,
  type NumberedListItemBlockObjectResponse,
  // type PageObjectResponse,
  type ParagraphBlockObjectResponse,
  // type PropertyItemObjectResponse,
  type RichTextItemResponse,
  type QuoteBlockObjectResponse,
  type ToggleBlockObjectResponse,
  type VideoBlockObjectResponse,
} from '@notionhq/client'
import {
  type RichTextItemResponseCommon,
  type TextRichTextItemResponse,
} from '@notionhq/client/build/src/api-endpoints'

// export type BlockObjectResponse = ParagraphBlockObjectResponse | Heading1BlockObjectResponse | Heading2BlockObjectResponse | Heading3BlockObjectResponse | BulletedListItemBlockObjectResponse | NumberedListItemBlockObjectResponse | QuoteBlockObjectResponse | ToDoBlockObjectResponse | ToggleBlockObjectResponse | TemplateBlockObjectResponse | SyncedBlockBlockObjectResponse | ChildPageBlockObjectResponse | ChildDatabaseBlockObjectResponse | EquationBlockObjectResponse | CodeBlockObjectResponse | CalloutBlockObjectResponse | DividerBlockObjectResponse | BreadcrumbBlockObjectResponse | TableOfContentsBlockObjectResponse | ColumnListBlockObjectResponse | ColumnBlockObjectResponse | LinkToPageBlockObjectResponse | TableBlockObjectResponse | TableRowBlockObjectResponse | EmbedBlockObjectResponse | BookmarkBlockObjectResponse | ImageBlockObjectResponse | VideoBlockObjectResponse | PdfBlockObjectResponse | FileBlockObjectResponse | AudioBlockObjectResponse | LinkPreviewBlockObjectResponse | UnsupportedBlockObjectResponse;

// TODO: distinguish these API types from parsed/validated types and use the latter throughout the app
export type NotionAPIBlock = BlockObjectResponse
export type NotionAPIBulletedListItemBlock = BulletedListItemBlockObjectResponse
export type NotionAPIChildPageBlock = ChildPageBlockObjectResponse
export type NotionAPICodeBlock = CodeBlockObjectResponse
export type NotionAPIHeading1Block = Heading1BlockObjectResponse
export type NotionAPIHeading2Block = Heading2BlockObjectResponse
export type NotionAPIHeading3Block = Heading3BlockObjectResponse
export type NotionAPIImageBlock = ImageBlockObjectResponse
export type NotionAPINumberedListItemBlock = NumberedListItemBlockObjectResponse
export type NotionAPIParagraphBlock = ParagraphBlockObjectResponse
export type NotionAPIRichTextItem = RichTextItemResponse
// export type NotionAPIRichTextItem = RichTextItemResponseCommon & TextRichTextItemResponse

export type NotionAPIQuoteBlock = QuoteBlockObjectResponse
export type NotionAPIToggleBlock = ToggleBlockObjectResponse
export type NotionAPIVideoBlock = VideoBlockObjectResponse

// Created in NotionBlocks.tsx to group list items so they're easier to render
export type NotionBulletedListBlock = Omit<BulletedListItemBlockObjectResponse, 'bulleted_list_item' | 'type'> & {
  type: 'bulleted_list'
  bulleted_list: {
    children: NotionAPIBulletedListItemBlock[]
  }
}

// Created in NotionBlocks.tsx to group list items so they're easier to render
export type NotionNumberedListBlock = Omit<NumberedListItemBlockObjectResponse, 'numbered_list_item' | 'type'> & {
  type: 'numbered_list'
  numbered_list: {
    children: NotionAPINumberedListItemBlock[]
  }
}
