import { type ReactElement } from 'react'

import { type GroupedBlock, type RichTextItem } from '@/lib/notion/schemas/block'
import NotionBlocks from '@/lib/notion/ui/NotionBlocks'
import NotionRichText from '@/lib/notion/ui/NotionRichText'

import { Code } from '@/ui/code'
import Heading from '@/ui/heading'
import Image from '@/ui/image'
import Paragraph from '@/ui/paragraph'
import Video from '@/ui/video'

type Props = {
  block: GroupedBlock
}

export default function NotionBlock({ block }: Props): ReactElement {
  // TODO: move each markup component into a separate file
  // see: https://github.com/9gustin/react-notion-render/tree/93bc519a4b0e920a0a9b980323c9a1456fab47d5/src/components/common
  switch (block.type) {
    case 'paragraph':
      return (
        <Paragraph>
          <NotionRichText richTextItems={block.richText} />
        </Paragraph>
      )

    case 'heading_1':
      return (
        <Heading level={1}>
          <NotionRichText richTextItems={block.richText} />
        </Heading>
      )

    case 'heading_2':
      return (
        <Heading level={2}>
          <NotionRichText richTextItems={block.richText} />
        </Heading>
      )

    case 'heading_3':
      return (
        <Heading level={3}>
          <NotionRichText richTextItems={block.richText} />
        </Heading>
      )

    case 'bulleted_list': {
      // TODO: extract into a List component that handles ul, ol, todos and toggles
      // see: https://github.com/9gustin/react-notion-render/blob/main/src/components/common/List/index.tsx
      if (block.type !== 'bulleted_list') throw new Error('Unexpected block type')
      return (
        <ul className="list-disc marker:text-accent flex flex-col gap-1 mt-2 pl-5 leading-snug">
          {block.items.map((item: { richText: RichTextItem[] }, index: number) => (
            <li key={index}>
              <NotionRichText richTextItems={item.richText} />
            </li>
          ))}
        </ul>
      )
    }

    case 'numbered_list': {
      if (block.type !== 'numbered_list') throw new Error('Unexpected block type')
      return (
        <ol className="list-decimal marker:text-accent flex flex-col gap-1 mt-2 pl-5 leading-snug">
          {block.items.map((item: { richText: RichTextItem[] }, index: number) => (
            <li key={index}>
              <NotionRichText richTextItems={item.richText} />
            </li>
          ))}
        </ol>
      )
    }

    case 'code': {
      // Hijack the caption to use as meta string for rehype-pretty-code if I want to highlight specific lines, etc
      // See: https://rehype-pretty.pages.dev/#meta-strings
      if (block.type !== 'code') throw new Error('Unexpected block type')
      const codeText = block.richText.map((item: RichTextItem) => item.content).join('\n')

      return <Code code={codeText} lang={block.language} meta={block.caption} />
    }

    case 'quote':
      return (
        <blockquote>
          <NotionRichText richTextItems={block.richText} />
        </blockquote>
      )

    case 'image':
      return <Image url={block.url} />

    case 'video':
      return <Video url={block.url} caption={block.caption} showCaption={!!block.caption} />

    case 'toggle':
      // Render as details/summary for native HTML collapse behavior
      return (
        <details className="my-4">
          <summary className="cursor-pointer font-medium">
            <NotionRichText richTextItems={block.richText} />
          </summary>
          <div className="ml-4 mt-2">
            <NotionBlocks blocks={block.children} />
          </div>
        </details>
      )

    case 'child_page':
      // Child pages are typically skipped in rendering
      console.warn('Child page blocks are not rendered:', block.title)
      return <></>

    default:
      // TypeScript exhaustiveness check
      throw new Error(`Encountered unsupported Notion block type: "${(block as never as { type: string }).type}"`)
  }
}
