import {
  type APIErrorCode,
  Client,
  collectPaginatedAPI,
  type PageObjectResponse,
  type BlockObjectResponse,
  type PropertyItemObjectResponse,
} from '@notionhq/client'

// See: https://github.com/makenotion/notion-sdk-js
const notion = new Client({
  auth: process.env.NOTION_ACCESS_TOKEN,
  notionVersion: '2025-09-03',
})

export default notion
export { APIErrorCode, collectPaginatedAPI }
