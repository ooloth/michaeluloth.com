import { type NotionBulletedListBlock, type NotionNumberedListBlock, type NotionAPIBlock } from '@/lib/notion/types'
import NotionBlock from '@/lib/notion/ui/NotionBlock'

type Props = Readonly<{
  blocks: NotionAPIBlock[]
}>

/**
 * Parses and renders the blocks for a Notion page.
 * @see https://github.com/9gustin/react-notion-render/blob/93bc519a4b0e920a0a9b980323c9a1456fab47d5/src/components/core/Render/index.tsx
 */
export default function NotionBlocks({ blocks }: Props) {
  const blocksToRender = replaceListsItems(blocks)

  return blocksToRender.map(block => <NotionBlock key={block.id} block={block} />)
}

const replaceListsItems = (
  blocks: NotionAPIBlock[],
): (NotionAPIBlock | NotionBulletedListBlock | NotionNumberedListBlock)[] => {
  const newBlocks: (NotionAPIBlock | NotionBulletedListBlock | NotionNumberedListBlock)[] = [...blocks]

  for (const listType of ['bulleted_list', 'numbered_list'] as const) {
    let i = 0

    while (i < newBlocks.length) {
      if (newBlocks[i].type !== `${listType}_item`) {
        // Move to the next block
        i++
        continue
      }

      // Find the range of bulleted list items
      let j = i + 1
      while (j < newBlocks.length && newBlocks[j].type === `${listType}_item`) {
        j++
      }

      // Replace the range with a single bulleted list block
      const listItems = newBlocks.slice(i, j)
      const listBlock =
        listType === 'bulleted_list'
          ? ({ type: 'bulleted_list', bulleted_list: { children: listItems } } as NotionBulletedListBlock)
          : ({ type: 'numbered_list', numbered_list: { children: listItems } } as NotionNumberedListBlock)

      newBlocks.splice(i, j - i, listBlock)
    }

    // Assert no bulleted_list_item blocks remain
    for (const block of newBlocks) {
      if (block.type === `${listType}_item`) {
        throw new Error(`${listType}_item block found after replacement`)
      }
    }
  }

  return newBlocks
}
