import { z } from 'zod'
import { isCloudinaryUrl } from '@/io/cloudinary/validation'

/**
 * Property schemas validate Notion property structures at I/O boundary
 * and transform them into ergonomic values.
 *
 * Each schema:
 * 1. Validates the raw Notion API property structure
 * 2. Transforms to the extracted value (replacing getPropertyValue)
 */

// Base rich text item schema (used by title and rich_text properties)
const RichTextItemSchema = z.object({
  plain_text: z.string(),
})

/**
 * Title property - array of rich text items
 * Transforms to: joined plain text string
 */
export const TitlePropertySchema = z
  .object({
    type: z.literal('title'),
    title: z.array(RichTextItemSchema),
  })
  .transform(prop => prop.title.map(item => item.plain_text).join(''))

/**
 * Rich text property - array of rich text items
 * Transforms to: joined plain text string, or null if empty
 */
export const RichTextPropertySchema = z
  .object({
    type: z.literal('rich_text'),
    rich_text: z.array(RichTextItemSchema),
  })
  .transform(prop => {
    const text = prop.rich_text.map(item => item.plain_text).join('')
    return text || null
  })

/**
 * Number property
 * Transforms to: number or null
 */
export const NumberPropertySchema = z
  .object({
    type: z.literal('number'),
    number: z.number().nullable(),
  })
  .transform(prop => prop.number)

/**
 * Date property - object with start date
 * Transforms to: start date string or null
 */
export const DatePropertySchema = z
  .object({
    type: z.literal('date'),
    date: z
      .object({
        start: z.string(),
      })
      .nullable(),
  })
  .transform(prop => prop.date?.start ?? null)

/**
 * URL property
 * Transforms to: URL string or null
 */
export const UrlPropertySchema = z
  .object({
    type: z.literal('url'),
    url: z.url().nullable(),
  })
  .transform(prop => prop.url)

/**
 * Files property - array of file objects (external or uploaded)
 * Transforms to: array of URLs
 */
const FileItemSchema = z.union([
  z.object({
    type: z.literal('external'),
    external: z.object({
      url: z.url(),
    }),
  }),
  z.object({
    type: z.literal('file'),
    file: z.object({
      url: z.url(),
    }),
  }),
])

export const FilesPropertySchema = z
  .object({
    type: z.literal('files'),
    files: z.array(FileItemSchema),
  })
  .transform(prop =>
    prop.files.map(item => {
      if (item.type === 'external') {
        return item.external.url
      } else {
        return item.file.url
      }
    }),
  )

/**
 * Featured image property - can be either URL or Files type
 * Transforms to: single URL string or null
 */
export const FeaturedImagePropertySchema = z
  .union([
    // URL property type (some posts use this)
    z
      .object({
        type: z.literal('url'),
        url: z.url().nullable(),
      })
      .transform(prop => prop.url),
    // Files property type (other posts use this)
    z
      .object({
        type: z.literal('files'),
        files: z.array(FileItemSchema),
      })
      .transform(prop => {
        // Extract first file URL or null
        const firstFile = prop.files[0]
        if (!firstFile) return null
        return firstFile.type === 'external' ? firstFile.external.url : firstFile.file.url
      }),
  ])
  .nullable()
  .refine(isCloudinaryUrl, {
    message: 'Featured image must be a Cloudinary URL in the "mu/" or "fetch/" folders',
  })

/**
 * Helper to create a schema for a specific set of page properties.
 * Validates property names exist and have expected types.
 *
 * @example
 * const PostPropertiesSchema = createPropertiesSchema({
 *   'Slug': RichTextPropertySchema,
 *   'Title': TitlePropertySchema,
 * })
 */
export function createPropertiesSchema<T extends Record<string, z.ZodTypeAny>>(
  propertySchemas: T,
): z.ZodType<{ [K in keyof T]: z.infer<T[K]> }> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return z.object(propertySchemas as any) as any
}
