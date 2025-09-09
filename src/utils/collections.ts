import { render, type CollectionEntry } from 'astro:content'
import type { AstroComponentFactory } from 'astro/runtime/server/index.js'
// import type { MarkdownHeading } from 'astro'

export type HasCollection = {
  collection: 'posts' | 'drafts' | 'notes' | 'bookmarks' | 'pages' | 'albums' | 'books' | 'podcasts'
}

// A generic type that adds a lastModified property to the existing data field
type WithRemarkFrontmatter<T extends CollectionEntry<'posts' | 'drafts' | 'notes' | 'bookmarks'>> = Omit<T, 'data'> & {
  data: T['data'] & {
    backlinks: string[]
    lastModified: string
  }
}

export type HasDate<T extends CollectionEntry<'posts'>> = Omit<T, 'data'> & {
  data: T['data'] & {
    date: Date
  }
}

type HasLastModified = {
  data: {
    lastModified?: string
  }
}

export type HasContent<T extends CollectionEntry<'posts'>> = T & {
  Content: AstroComponentFactory
}

export type Bookmark = WithRemarkFrontmatter<CollectionEntry<'bookmarks'>>
export type Draft = WithRemarkFrontmatter<CollectionEntry<'drafts'>>
export type Note = WithRemarkFrontmatter<CollectionEntry<'notes'>>
export type Post = WithRemarkFrontmatter<CollectionEntry<'posts'>>
export type PostWithContent = HasContent<Post>
export type PostWithDate = HasDate<Post>
export type SinglePage = CollectionEntry<'pages'>

/**
 * Adds the last modified date to the frontmatter of a post, draft, note, or bookmark.
 * See: https://docs.astro.build/en/recipes/modified-time/
 */
export async function addLastModifiedDate<T extends CollectionEntry<'posts' | 'drafts' | 'notes' | 'bookmarks'>>(
  entries: T[],
): Promise<WithRemarkFrontmatter<T>[]> {
  return await Promise.all(
    entries.map(async entry => {
      const renderedEntry = await render(entry)
      return {
        ...entry,
        data: {
          ...entry.data,
          backlinks: renderedEntry.remarkPluginFrontmatter.backlinks,
          lastModified: renderedEntry.remarkPluginFrontmatter.lastModified,
        },
      }
    }),
  )
}

/**
 * Adds the rendered content to the frontmatter of a post (so it can be shown inline on the home page).
 * See: https://docs.astro.build/en/recipes/modified-time/
 */
export const addContent = async <T extends CollectionEntry<'posts'>>(entries: T[]): Promise<HasContent<T>[]> =>
  await Promise.all(entries.map(async entry => ({ ...entry, Content: (await render(entry)).Content })))

export const sortByLastModifiedDate = <T extends HasLastModified>(items: T[]): T[] => {
  const sortByDate = (a: T, b: T): number => {
    const lastModifiedTime = (item: T): number =>
      item.data.lastModified ? new Date(String(item.data.lastModified)).getTime() : -Infinity

    return lastModifiedTime(b) - lastModifiedTime(a)
  }

  return structuredClone(items).sort(sortByDate)
}

/**
 * Returns true if the entry is not marked private or obviously work-specific.
 */
export const isPublic = (entry: CollectionEntry<'drafts' | 'notes' | 'bookmarks' | 'pages'>): boolean =>
  !(entry.data.private === true) && !(entry.data.tags ?? []).includes('private') && !entry.id.includes('recursion')

/**
 * In production only, remove entries marked private.
 */
export const removePrivateInProduction = <T extends CollectionEntry<'drafts' | 'notes' | 'bookmarks' | 'pages'>>(
  entries: T[],
): T[] => (import.meta.env.PROD ? entries.filter(isPublic) : entries)

/**
 * Returns true if the pathname matches any slug in the collection.
 *
 * TODO: still useful now that each type comes from a distinct collection? Do I ever know the pathname but not the entry?
 */
export const isPathnameInCollection = (
  pathname: string | undefined,
  collection: Post[] | Draft[] | Note[] | Bookmark[],
): boolean => {
  const removeLeadingAndTrailingSlashes = (str?: string): string => (str ? str.replace(/^\/|\/$/g, '') : '')

  return collection.some(item => removeLeadingAndTrailingSlashes(pathname) === removeLeadingAndTrailingSlashes(item.id))
}
