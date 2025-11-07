import notion, { collectPaginatedAPI } from './client'

/**
 * Get all children blocks of a block (including a page).
 * @see https://developers.notion.com/reference/get-block-children
 */
export default async function getBlockChildren(blockId: string) {
  const children = await collectPaginatedAPI(notion.blocks.children.list, {
    block_id: blockId,
  })

  return children
}
