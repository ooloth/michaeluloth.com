import { getCollection, type CollectionEntry } from 'astro:content'

import {
  addLastModifiedDate,
  sortByLastModifiedDate,
  type HasCollection,
  type Post,
  type PostWithContent,
  type PostWithDate,
} from './collections'

/**
 * Returns true if the entry is from the posts collection.
 */
export const isPost = (entry: HasCollection): entry is Post => entry.collection === 'posts'

/**
 * Returns true if the post is scheduled to be published in the future.
 */
export const isScheduled = (post: CollectionEntry<'posts'> | Post | PostWithContent): boolean =>
  post.data.date > new Date()

/**
 * Returns true if the post has a publish date in the past.
 */
export const isPublished = (post: CollectionEntry<'posts'> | Post | PostWithContent): boolean =>
  post.data.date <= new Date()

/**
 * Returns true if the post is not marked incognito and should therefore be included in menus.
 */
export const isAdvertised = (entry: Post): boolean =>
  !(entry.data.incognito === true) && !(entry.data.tags ?? []).includes('incognito')

/**
 * Returns entries sorted in descending order by publish date, with undefined dates sorted first.
 */
export const sortByPublishDate = (items: PostWithDate[]): PostWithDate[] =>
  structuredClone(items).sort((a, b): number => b.data.date.getTime() - a.data.date.getTime())

/**
 * Returns all posts with their last modified date (and the first few with their content), sorted by publish date.
 * In production, only returns published posts (i.e. no scheduled posts).
 */
export const getPosts = async (): Promise<Post[]> =>
  sortByLastModifiedDate(await addLastModifiedDate(await getCollection('posts')))

/**
 * Returns all posts scheduled to be published in the future, sorted by last modified date.
 */
export const getScheduledPosts = async (): Promise<Post[]> =>
  sortByLastModifiedDate(await addLastModifiedDate(await getCollection('posts', isScheduled)))

/**
 * Returns all posts with a publish date in the past, sorted by publish date.
 */
export const getPublishedPosts = async (): Promise<Post[]> =>
  sortByPublishDate(await addLastModifiedDate(await getCollection('posts', isPublished)))

/**
 * Returns all posts with a publish date in the past, sorted by publish date.
 */
export const getAdvertisedPosts = async (): Promise<Post[]> =>
  sortByPublishDate(await addLastModifiedDate(await getCollection('posts', isPublished))).filter(isAdvertised)
