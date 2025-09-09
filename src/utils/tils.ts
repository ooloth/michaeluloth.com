import { getCollection } from 'astro:content'
import {
  addLastModifiedDate,
  removePrivateInProduction,
  sortByLastModifiedDate,
  type HasCollection,
  type TIL,
} from './collections'

/**
 * Returns true if the entry is a note.
 */
export const isTIL = (entry: HasCollection): entry is TIL => entry.collection === 'tils'

/**
 * Returns a list of all notes (with private notes removed in production), sorted by last modified date.
 */
export const getTILs = async (): Promise<TIL[]> => {
  return sortByLastModifiedDate(await addLastModifiedDate(removePrivateInProduction(await getCollection('tils'))))
}

export const getTILsByFolder = async (): Promise<Record<string, TIL[]>> => {
  const tils = await getTILs()
  const tilsByFolder: Record<string, TIL[]> = {}

  for (const til of tils) {
    const folder = til.id.split('/')[0] // Get the folder name from the ID (assuming IDs are like 'folder/filename')

    if (!tilsByFolder[folder]) {
      tilsByFolder[folder] = []
    }

    tilsByFolder[folder].push(til)
  }

  return tilsByFolder
}
