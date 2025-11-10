import { type ReactElement } from 'react'

import {
  type NotionAPIBlock,
  type NotionAPIBulletedListItemBlock,
  type NotionAPICodeBlock,
  type NotionAPIHeading1Block,
  type NotionAPIHeading2Block,
  type NotionAPIHeading3Block,
  type NotionAPIImageBlock,
  type NotionAPINumberedListItemBlock,
  type NotionAPIParagraphBlock,
  type NotionAPIQuoteBlock,
  type NotionBulletedListBlock,
  type NotionNumberedListBlock,
} from '@/lib/notion/types'
import NotionRichText from '@/lib/notion/ui/NotionRichText'

import { Code } from '@/ui/code'
import Heading from '@/ui/heading'
import Image from '@/ui/image'
import Paragraph from '@/ui/paragraph'

// TODO: add type definitions for raw Notion blocks + my parsed blocks
// see: https://github.com/9gustin/react-notion-render/blob/93bc519a4b0e920a0a9b980323c9a1456fab47d5/src/types/NotionBlock.ts
type Props = {
  // TODO: receive a confirmed type safe block instead of assuming the types?
  block: NotionAPIBlock | NotionBulletedListBlock | NotionNumberedListBlock
}

export default function NotionBlock({ block }: Props): ReactElement {
  // TODO: move each markup component into a separate file
  // see: https://github.com/9gustin/react-notion-render/tree/93bc519a4b0e920a0a9b980323c9a1456fab47d5/src/components/common
  switch (block.type) {
    case 'paragraph':
      const paragraph = block['paragraph'] satisfies NotionAPIParagraphBlock['paragraph']

      return (
        <Paragraph>
          <NotionRichText richTextItems={paragraph.rich_text} />
        </Paragraph>
      )

    case 'heading_1':
      const heading1 = block['heading_1'] satisfies NotionAPIHeading1Block['heading_1']

      return (
        <Heading level={1}>
          <NotionRichText richTextItems={heading1.rich_text} />
        </Heading>
      )

    case 'heading_2':
      const heading2 = block['heading_2'] satisfies NotionAPIHeading2Block['heading_2']

      return (
        <Heading level={2}>
          <NotionRichText richTextItems={heading2.rich_text} />
        </Heading>
      )

    case 'heading_3':
      const heading3 = block['heading_3'] satisfies NotionAPIHeading3Block['heading_3']

      return (
        <Heading level={3}>
          <NotionRichText richTextItems={heading3.rich_text} />
        </Heading>
      )

    case 'bulleted_list':
      // NOTE: I create this new type in NotionBlocks.tsx to group bulleted list items together
      // TODO: extract into a List component that handles ul, ol, todos and toggles
      // see: https://github.com/9gustin/react-notion-render/blob/main/src/components/common/List/index.tsx
      return (
        <ul className="list-disc flex flex-col gap-1 mt-2 pl-5 leading-snug">
          {block['bulleted_list'].children.map(item => {
            return (
              <li key={item.id}>
                <NotionRichText richTextItems={item['bulleted_list_item'].rich_text} />
              </li>
            )
          })}
        </ul>
      )

    case 'numbered_list':
      // NOTE: I create this type in NotionBlocks.tsx to group numbeed list items together
      return (
        <ol>
          {block['numbered_list'].children.map(item => {
            return (
              <li key={item.id}>
                <NotionRichText richTextItems={item['numbered_list_item'].rich_text} />
              </li>
            )
          })}
        </ol>
      )

    case 'code':
      const code = block['code'] satisfies NotionAPICodeBlock['code']

      // Hijack the caption to use as meta string for rehype-pretty-code if I want to highlight specific lines, etc
      // See: https://rehype-pretty.pages.dev/#meta-strings
      const rehypePrettyCodeMetaString = code.caption?.[0]?.plain_text
      // const rehypePrettyCodeMetaString = code.caption?.[0]?.plain_text || code.language

      const codeText = code.rich_text.map(textItem => textItem.plain_text).join('\n')

      return <Code code={codeText} lang={code.language} meta={rehypePrettyCodeMetaString} />

    case 'quote':
      const quote = block['quote'] satisfies NotionAPIQuoteBlock['quote']

      return (
        <blockquote>
          <NotionRichText richTextItems={quote.rich_text} />
        </blockquote>
      )

    case 'image':
      const image = block['image'] satisfies NotionAPIImageBlock['image']

      const src = image.type === 'external' ? image.external.url : image.file.url

      // TODO: look up alt, width and height via Cloudinary so caption can be photo credit etc?
      const { alt, width, height } = parseImageCaption(image.caption)

      return <Image src={src} alt={alt} width={width} height={height} />

    // FIXME: support video embeds
    case 'video':
      throw new Error('Video blocks not supported yet.')

    // const video = block['video'] satisfies VideoBlock['video']
    //
    // // TODO: extract component
    // return (
    //   <figure>
    //     Hi
    //     <video src={video.type === 'external' ? video.external.url : video.file.url} />
    //     <video controls>
    //       <source src={video.type === 'external' ? video.external.url : video.file.url} />
    //     </video>
    //     {video.caption && <figcaption>{video.caption ? video.caption[0]?.plain_text : ''}</figcaption>}
    //   </figure>
    // )

    case 'toggle':
      throw new Error('Toggle blocks not supported yet.')

    // TODO: is "children" something I've inserted?

    // const toggle = block['toggle'] satisfies ToggleBlock['toggle']
    //
    // return (
    //   <details>
    //     <summary>
    //       <NotionRichText text={toggle.rich_text} />
    //     </summary>
    //     {toggle.children?.map(block => (
    //       <Fragment key={block.id}>{NotionBlock(block)}</Fragment>
    //     ))}
    //   </details>
    // )

    default:
      throw new Error(`Encountered unsupported Notion block type: "${block.type}"`)
  }
}

function parseImageCaption(caption: NotionAPIImageBlock['image']['caption']) {
  if (!caption) {
    throw new Error('Image block must include a caption.')
  }

  const dimensions = caption[0].plain_text.match(/\d+x\d+/)

  if (!dimensions) {
    throw new Error('Image caption must start with valid dimensions: [<width>x<height>]')
  }

  const width = parseInt(dimensions[0].replace(/x.*/, ''))
  const height = parseInt(dimensions[0].replace(/.*x/, ''))

  const alt = caption[0]?.plain_text.replace(/\[\d+x\d+\]/, '').trim()

  if (!alt) {
    throw new Error('Image caption must end with alt text.')
  }

  return { alt, width, height }
}
