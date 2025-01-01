// See: https://docs.astro.build/en/guides/content-collections/
// See: https://docs.astro.build/en/guides/content-collections/#built-in-loaders
// See: https://www.digitalocean.com/community/tools/glob
// See: https://globster.xyz

import { defineCollection, z } from 'astro:content'
import { glob, file } from 'astro/loaders'

// The item ID comes from URL of corresponding Apple Music CA (https://music.apple.com/ca), Apple Books CA
// (https://books.apple.com/ca), or Apple Podcasts CA (https://podcasts.apple.com/ca) page
const iTunesItem = z.object({
  date: z.coerce.date(),
  id: z.number(),
  name: z.string(),
})

const albums = defineCollection({
  loader: file('./src/content/itunes/albums.yaml'),
  schema: iTunesItem,
})

const bookmarks = defineCollection({
  loader: glob({ pattern: '**/[^_]*.{md,mdx}', base: './src/content/bookmarks' }),
  schema: z.object({
    author: z.array(z.string()).optional().nullable(),
    captured: z.coerce.date(),
    date: z.coerce.date().optional().nullable(),
    description: z.string().optional().nullable(),
    favicon: z.string().optional().nullable(),
    image: z.string().optional().nullable(),
    private: z.boolean().optional().nullable(),
    slug: z.string(),
    source: z.string(),
    tags: z.array(z.string()).optional().nullable(),
    title: z.string(),
  }),
})

const books = defineCollection({
  loader: file('./src/content/itunes/books.yaml'),
  schema: iTunesItem,
})

const drafts = defineCollection({
  loader: glob({ pattern: '**/[^_]*.{md,mdx}', base: './src/content/drafts' }),
  schema: z.object({
    title: z.string().optional().nullable(),
    date: z.coerce.date().optional().nullable(),
    private: z.boolean().optional().nullable(),
    tags: z.array(z.string()).optional().nullable(),
  }),
})

const pages = defineCollection({
  loader: glob({ pattern: '**/[^_]*.{md,mdx}', base: './src/content/pages' }),
  schema: z.object({
    title: z.string(),
    private: z.boolean().optional().nullable(),
    tags: z.array(z.string()).optional().nullable(),
  }),
})

const podcasts = defineCollection({
  loader: file('./src/content/itunes/podcasts.yaml'),
  schema: iTunesItem,
})

const tils = defineCollection({
  loader: glob({ pattern: '**/[^_]*.{md,mdx}', base: './src/content/til' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    tags: z.array(z.string()).optional().nullable(), // TODO: report when < 2 tags?
  }),
})

// TODO: split into notes and article
const writing = defineCollection({
  loader: glob({ pattern: '**/[^_]*.{md,mdx}', base: './src/content/writing' }),
  schema: z.object({
    date: z.coerce.date().optional().nullable(), // TODO: require for articles
    description: z.string().optional().nullable(), // TODO: articles only
    feedId: z.string().optional().nullable(), // TODO: articles only
    ogImage: z.string().optional().nullable(),
    parent: z.string().optional().nullable(), // TODO: remove from articles
    private: z.boolean().optional().nullable(), // TODO: remove from articles
    tags: z.array(z.string()).optional().nullable(), // TODO: require? report?
    title: z.string().optional().nullable(), // TODO: require for articles
  }),
})

// 4. Export a single `collections` object to register your collection(s)
export const collections = { albums, bookmarks, books, drafts, pages, podcasts, tils, writing }
