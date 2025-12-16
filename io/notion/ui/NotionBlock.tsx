import { type ReactElement } from 'react'

import { type GroupedBlock, type RichTextItem } from '@/io/notion/schemas/block'
import NotionBlocks from '@/io/notion/ui/NotionBlocks'
import NotionRichText from '@/io/notion/ui/NotionRichText'

import { Code } from '@/ui/code'
import Heading from '@/ui/typography/heading'
import Image from '@/ui/image'
import Paragraph from '@/ui/typography/paragraph'
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
      return (
        <ul className="list-disc marker:text-accent flex flex-col gap-1 mt-2 pl-5 leading-snug">
          {block.items.map((item: { richText: RichTextItem[] }, index: number) => (
            <li key={index} className="mt-1">
              <NotionRichText richTextItems={item.richText} />
            </li>
          ))}
        </ul>
      )
    }

    case 'numbered_list': {
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
      const codeText = block.richText.map((item: RichTextItem) => item.content).join('\n')

      // JSX and TSX are required for React and also work for vanilla JS/TS
      const lang = block.language
        ? block.language.replace('javascript', 'jsx').replace('typescript', 'tsx')
        : 'plaintext'

      // Replace fancy quotes with straight quotes in meta string (if present)
      const meta = block.caption
        ?.replace(/\u2018/g, "'")
        .replace(/\u2019/g, "'")
        .replace(/\u201C/g, '"')
        .replace(/\u201D/g, '"')

      return <Code code={codeText} lang={lang} meta={meta} />
    }

    case 'quote':
      return (
        <blockquote className="my-4 border-l-4 border-accent pl-3 italic text-zinc-200">
          <NotionRichText richTextItems={block.richText} />
        </blockquote>
      )

    case 'image':
      return <Image url={block.url} />

    case 'video':
      return <Video url={block.url} caption={block.caption} showCaption={!!block.caption} />

    case 'toggle':
      // TODO: test and improve this
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

    default:
      // TypeScript exhaustiveness check
      throw new Error(`Encountered unsupported Notion block type: "${(block as never as { type: string }).type}"`)
  }
}
