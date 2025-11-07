import { QueryDataSourceResponse } from '@notionhq/client'
import notion, { APIErrorCode, collectPaginatedAPI } from './client'

type FetchArgs = {
  data_source_id: string
  filter?: any
  sorts?: any
  start_cursor?: string
}

async function fetch100Rows({ databaseId: dataSourceId, filter, sorts, start_cursor }: FetchArgs) {
  // type QueryDataSourcePathParameters = {
  // data_source_id: IdRequest;
  // };
  // type QueryDataSourceQueryParameters = {
  // filter_properties?: Array<string>;
  // };
  // type QueryDataSourceBodyParameters = {
  //     sorts?: Array<{
  //         property: string;
  //         direction: "ascending" | "descending";
  //     } | {
  //         timestamp: "created_time" | "last_edited_time";
  //         direction: "ascending" | "descending";
  //     }>;
  //     filter?: {
  //         or: GroupFilterOperatorArray;
  //     } | {
  //         and: GroupFilterOperatorArray;
  //     } | PropertyFilter | TimestampFilter;
  //     start_cursor?: string;
  //     page_size?: number;
  //     archived?: boolean;
  //     in_trash?: boolean;
  //     result_type?: "page" | "data_source";
  // };

  const response = await notion.dataSources.query({
    // const response = await notion.databases.query({
    data_source_id: dataSourceId,
    filter,
    sorts,
    start_cursor,
  })

  return response
}

type GetDataSourceArgs = {
  dataSourceId: string
  filter?: any
  sorts?: any
}

/**
 * Alternative implementation using collectPaginatedAPI
 * @see https://developers.notion.com/reference/query-a-data-source
 */
async function getDataSource2({ dataSourceId, filter, sorts }: GetDataSourceArgs): Promise<Record<string, any>[]> {
  try {
    const results = await collectPaginatedAPI(notion.dataSources.query, { data_source_id: dataSourceId, filter, sorts })
    return results
  } catch (error) {
    console.error(error)
  }

  // TODO: parse with zod (here? elsewhere?)
}

async function getDataSource({ dataSourceId, filter, sorts }: GetDataSourceArgs) {
  let allRows = []
  let has_more = false
  let start_cursor: string = undefined

  do {
    const response = await fetch100Rows({ dataSourceId: dataSourceId, filter, sorts, start_cursor })

    // Accumulate the results 100 rows at a time
    allRows = [...allRows, ...response.results]

    // Check if there are more rows than the 100 in the latest response
    has_more = response.has_more
    start_cursor = response.next_cursor
  } while (has_more)

  return await Promise.all(allRows)
}

export default getDataSource
export { getDataSource2 }
