import { type ReactElement } from 'react'

import { type GroupedBlock, type RichTextItem } from '@/io/notion/schemas/block'
import NotionRichText from '@/io/notion/ui/NotionRichText'

import { Code } from '@/ui/code'
import Heading from '@/ui/typography/heading'
import CloudinaryImage from '@/ui/image'
import List from '@/ui/list'
import Paragraph from '@/ui/typography/paragraph'
import Video from '@/ui/video'

type Props = {
  block: GroupedBlock
}

export default function NotionBlock({ block }: Props): ReactElement {
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
      return <List items={block.items} type="bulleted" />
    }

    case 'numbered_list': {
      return <List items={block.items} type="numbered" />
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
      return <CloudinaryImage url={block.url} />

    case 'video':
      return <Video url={block.url} caption={block.caption} />

    default:
      // TypeScript exhaustiveness check
      throw new Error(`Encountered unsupported Notion block type: "${(block as never as { type: string }).type}"`)
  }
}
