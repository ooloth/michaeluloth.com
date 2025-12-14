// TODO: notion changelog: https://developers.notion.com/page/changelog
// TODO: notion mcp server: https://developers.notion.com/docs/mcp

import { Client, collectPaginatedAPI } from '@notionhq/client'
import { env } from '@/lib/env/env'

// See: https://github.com/makenotion/notion-sdk-js
const notion = new Client({
  auth: env.NOTION_ACCESS_TOKEN,
  notionVersion: '2025-09-03',
})

export default notion
export { collectPaginatedAPI }
export type { Client }
