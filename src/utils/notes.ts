import { getCollection } from 'astro:content'
import {
  addLastModifiedDate,
  removePrivateInProduction,
  sortByLastModifiedDate,
  type HasCollection,
  type Note,
} from './collections'

/**
 * Returns true if the entry is a note.
 */
export const isNote = (entry: HasCollection): entry is Note => entry.collection === 'notes'

export type NoteWithChildren = Note & { data: { children: NoteWithChildren[] } }

/**
 * Given an array of collection items, returns the array with child items nested under their parents.
 */
const nestChildren = (collection: Note[]): NoteWithChildren[] => {
  // Step 1: Create a mapping from item slugs to their respective item data
  const slugToNodeMap = collection.reduce(
    (nodesBySlug, item) => {
      // Append an empty children array to the item data
      nodesBySlug[item.id.toLowerCase()] = { ...item, data: { ...item.data, children: [] } }
      return nodesBySlug
    },
    {} as Record<string, NoteWithChildren>,
  )

  // Step 2: Build the item tree
  const tree = collection.reduce((roots, item) => {
    // Find the node matching the current collection item
    const node = slugToNodeMap[item.id.toLowerCase()]

    if (item.data.parent) {
      const parentNode = slugToNodeMap[item.data.parent.toLowerCase()]

      if (parentNode) {
        // If the note has a parent, add the item's data to the parent's children array
        parentNode.data.children.push(node)
      } else {
        console.error(`Parent slug "${item.data.parent}" not found (this should never happen).`)
      }
    } else {
      // If the item has no parent, treat it as a new root-level note
      roots.push(node)
    }

    // Return the update tree
    return roots
  }, [] as NoteWithChildren[])

  return tree
}

/**
 * Returns a list of all notes (with private notes removed in production), sorted by last modified date.
 */
export const getNotes = async (): Promise<Note[]> => {
  return sortByLastModifiedDate(await addLastModifiedDate(removePrivateInProduction(await getCollection('notes'))))
}

/**
 * Returns a list of all notes (with private notes removed in production), sorted by last modified date.
 */
export const getNestedNotes = async (): Promise<NoteWithChildren[]> => {
  return nestChildren(await addLastModifiedDate(removePrivateInProduction(await getCollection('notes'))))
}
