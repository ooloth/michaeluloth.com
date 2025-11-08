import Block from '@/lib/notion/ui/Block'

/**
 * Parses and renders the blocks for a Notion page.
 * @see https://github.com/9gustin/react-notion-render/blob/93bc519a4b0e920a0a9b980323c9a1456fab47d5/src/components/core/Render/index.tsx
 */
export default function Blocks({ blocks }) {
  const blocksToRender = getBlocksToRender(blocks)

  return blocksToRender.map(block => <Block key={block.id} block={block} />)
}

/**
 * Returns a list of parsed blocks that Block knows how to render.
 * @see https://github.com/9gustin/react-notion-render/blob/93bc519a4b0e920a0a9b980323c9a1456fab47d5/src/utils/getBlocksToRender.ts#L15
 */
function getBlocksToRender(blocks: any[]) {
  // Filter out blocks the Notion API doesn't support
  const supportedBlocks = blocks.filter(block => block.type !== 'unsupported')

  if (!supportedBlocks.length) return []

  // Parse the remaining blocks to make lists easier to render
  return supportedBlocks.reduce((blocksToRender, block) => {
    const previousBlock = blocksToRender.length && blocksToRender[blocksToRender.length - 1]
    const currentBlock = createParsedNotionBlock(block)

    // If the current block is part of a list, append it to the existing list block
    if (previousBlock && areRelated(previousBlock, currentBlock)) {
      previousBlock.addItem(currentBlock)
      return blocksToRender
      // Otherwise, start a new list
    } else if (currentBlock.isList()) {
      currentBlock.addItem(currentBlock)
      return [...blocksToRender, currentBlock]
      // If it's not a list item, render it separately
    } else {
      return [...blocksToRender, currentBlock]
    }
  }, [])
}

/**
 * Returns a Notion block that's been extended with helper methods and a consolidated array of list items (if applicable)
 * @see https://github.com/9gustin/react-notion-render/blob/93bc519a4b0e920a0a9b980323c9a1456fab47d5/src/types/Block.ts
 * @see https://kyleshevlin.com/what-is-a-factory-function
 */
function createParsedNotionBlock(notionBlock: any) {
  const items = []

  const getType = () => notionBlock.type

  return {
    addItem(block: any) {
      items.push(createParsedNotionBlock(block))
    },
    equalsType(type: string) {
      return notionBlock.type === type
    },
    getComponent() {
      // TODO: Implement
    },
    getType,
    isList() {
      return (
        getType() === 'bulleted_list_item' ||
        getType() === 'numbered_list_item' ||
        getType() === 'todo' ||
        getType() === 'toggle'
      )
    },
    items,
    ...notionBlock,
  }
}

function areRelated(previous: any, current: any) {
  return previous.isList() && previous.equalsType(current.type)
}
