// TODO: notion changelog: https://developers.notion.com/page/changelog
// TODO: notion mcp server: https://developers.notion.com/docs/mcp

import { Client, collectPaginatedAPI } from '@notionhq/client'

// See: https://github.com/makenotion/notion-sdk-js
const notion = new Client({
  auth: process.env.NOTION_ACCESS_TOKEN,
  notionVersion: '2025-09-03',
})

export default notion
export { collectPaginatedAPI }
