import { type GroupedBlock } from '@/lib/notion/schemas/block'
import NotionBlock from '@/lib/notion/ui/NotionBlock'

type Props = Readonly<{
  blocks: GroupedBlock[]
}>

/**
 * Renders blocks for a Notion page.
 * Blocks are already validated and grouped during fetch.
 * @see https://github.com/9gustin/react-notion-render/blob/93bc519a4b0e920a0a9b980323c9a1456fab47d5/src/components/core/Render/index.tsx
 */
export default function NotionBlocks({ blocks }: Props) {
  return blocks.map((block, index) => <NotionBlock key={index} block={block} />)
}
