import notion, { collectPaginatedAPI } from './client'
import { BlockSchema, type Block, type GroupedBlock, type BulletedListBlock, type NumberedListBlock } from './schemas/block'
import { logValidationError } from '@/utils/zod'
import { Ok, Err, type Result } from '@/utils/result'

export const INVALID_BLOCK_ERROR = 'Invalid block data - build aborted'

/**
 * Pure function: validates and transforms a Notion block to ergonomic domain object.
 * Throws on validation failure to protect production from bad data.
 */
function transformNotionBlockToBlock(block: unknown): Block {
  const parsed = BlockSchema.safeParse(block)

  if (!parsed.success) {
    logValidationError(parsed.error, 'block')
    throw new Error(INVALID_BLOCK_ERROR)
  }

  return parsed.data
}

/**
 * Pure function: groups consecutive list items into list blocks.
 * Transforms [item, item, item] → [{ type: 'bulleted_list', items: [...] }]
 */
function groupListItems(blocks: Block[]): GroupedBlock[] {
  const grouped: GroupedBlock[] = []
  let i = 0

  while (i < blocks.length) {
    const block = blocks[i]

    if (block.type === 'bulleted_list_item') {
      // Collect consecutive bulleted list items
      const items: { richText: Block['richText'] }[] = []
      while (i < blocks.length && blocks[i].type === 'bulleted_list_item') {
        items.push({ richText: (blocks[i] as Extract<Block, { type: 'bulleted_list_item' }>).richText })
        i++
      }
      const bulletedList: BulletedListBlock = {
        type: 'bulleted_list',
        items,
      }
      grouped.push(bulletedList)
    } else if (block.type === 'numbered_list_item') {
      // Collect consecutive numbered list items
      const items: { richText: Block['richText'] }[] = []
      while (i < blocks.length && blocks[i].type === 'numbered_list_item') {
        items.push({ richText: (blocks[i] as Extract<Block, { type: 'numbered_list_item' }>).richText })
        i++
      }
      const numberedList: NumberedListBlock = {
        type: 'numbered_list',
        items,
      }
      grouped.push(numberedList)
    } else {
      // Handle recursive children for toggle blocks
      if (block.type === 'toggle' && block.children.length > 0) {
        grouped.push({
          ...block,
          children: groupListItems(block.children),
        })
      } else {
        grouped.push(block as GroupedBlock)
      }
      i++
    }
  }

  return grouped
}

/**
 * Pure function: validates and transforms array of Notion blocks.
 * Groups list items and handles recursive children.
 */
export function validateBlocks(blocks: unknown[]): GroupedBlock[] {
  // First, validate and transform each block
  const transformedBlocks = blocks.map(transformNotionBlockToBlock)

  // Then, group consecutive list items
  return groupListItems(transformedBlocks)
}

/**
 * Get all children blocks of a block (including a page).
 * Returns validated, ergonomic blocks with grouped lists.
 *
 * @see https://developers.notion.com/reference/get-block-children
 */
export default async function getBlockChildren(blockId: string): Promise<Result<GroupedBlock[], Error>> {
  try {
    const children = await collectPaginatedAPI(notion.blocks.children.list, {
      block_id: blockId,
    })

    // Validate and transform blocks at API boundary
    const blocks = validateBlocks(children)
    return Ok(blocks)
  } catch (error) {
    console.error('getBlockChildren error:', error)
    return Err(error instanceof Error ? error : new Error(String(error)))
  }
}
