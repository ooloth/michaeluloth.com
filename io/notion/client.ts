import { Client, collectPaginatedAPI } from '@notionhq/client'
import { notionEnv } from '@/io/env/notion'

// See: https://github.com/makenotion/notion-sdk-js
const notion = new Client({
  auth: notionEnv.NOTION_ACCESS_TOKEN,
  notionVersion: '2025-09-03',
})

export default notion
export { collectPaginatedAPI }
export type { Client }
