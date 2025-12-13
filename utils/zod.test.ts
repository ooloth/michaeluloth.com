import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { z } from 'zod'
import { formatValidationError, logValidationError } from './zod'

describe('formatValidationError', () => {
  describe('single field errors', () => {
    it('formats required field error', () => {
      const schema = z.object({ title: z.string() })
      const result = schema.safeParse({})

      if (!result.success) {
        const formatted = formatValidationError(result.error)
        expect(formatted).toContain('title')
        expect(formatted).toContain('expected string')
      }
    })

    it('formats type mismatch error', () => {
      const schema = z.object({ count: z.number() })
      const result = schema.safeParse({ count: 'not-a-number' })

      if (!result.success) {
        const formatted = formatValidationError(result.error)
        expect(formatted).toContain('count')
        expect(formatted).toContain('expected number')
      }
    })

    it('formats string validation error', () => {
      const schema = z.object({ email: z.string().email() })
      const result = schema.safeParse({ email: 'not-an-email' })

      if (!result.success) {
        const formatted = formatValidationError(result.error)
        expect(formatted).toContain('email')
        expect(formatted).toContain('Invalid email')
      }
    })

    it('formats minimum length error', () => {
      const schema = z.object({ name: z.string().min(3) })
      const result = schema.safeParse({ name: 'ab' })

      if (!result.success) {
        const formatted = formatValidationError(result.error)
        expect(formatted).toContain('name')
        expect(formatted).toContain('>=3 characters')
      }
    })

    it('formats regex pattern error', () => {
      const schema = z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) })
      const result = schema.safeParse({ date: 'invalid-date' })

      if (!result.success) {
        const formatted = formatValidationError(result.error)
        expect(formatted).toContain('date')
        expect(formatted).toContain('Invalid')
      }
    })
  })

  describe('nested field errors', () => {
    it('formats nested object field errors with dot notation', () => {
      const schema = z.object({
        user: z.object({
          profile: z.object({
            name: z.string(),
          }),
        }),
      })
      const result = schema.safeParse({ user: { profile: {} } })

      if (!result.success) {
        const formatted = formatValidationError(result.error)
        expect(formatted).toContain('user.profile.name')
        expect(formatted).toContain('expected string')
      }
    })

    it('formats array index errors with numeric path', () => {
      const schema = z.object({
        items: z.array(
          z.object({
            id: z.number(),
          }),
        ),
      })
      const result = schema.safeParse({ items: [{ id: 1 }, { id: 'invalid' }, { id: 3 }] })

      if (!result.success) {
        const formatted = formatValidationError(result.error)
        expect(formatted).toContain('items.1.id')
        expect(formatted).toContain('expected number')
      }
    })

    it('formats deeply nested errors', () => {
      const schema = z.object({
        data: z.object({
          metadata: z.object({
            properties: z.object({
              title: z.object({
                value: z.string(),
              }),
            }),
          }),
        }),
      })
      const result = schema.safeParse({ data: { metadata: { properties: { title: {} } } } })

      if (!result.success) {
        const formatted = formatValidationError(result.error)
        expect(formatted).toContain('data.metadata.properties.title.value')
        expect(formatted).toContain('expected string')
      }
    })
  })

  describe('multiple field errors', () => {
    it('formats multiple errors with comma separation', () => {
      const schema = z.object({
        title: z.string().min(1),
        count: z.number(),
        email: z.string().email(),
      })
      const result = schema.safeParse({})

      if (!result.success) {
        const formatted = formatValidationError(result.error)
        expect(formatted).toContain('title')
        expect(formatted).toContain('count')
        expect(formatted).toContain('email')
        // Verify errors are comma-separated (messages contain commas too, so just check presence)
        expect(formatted).toMatch(/title:.*,.*count:.*,.*email:/)
      }
    })

    it('maintains order of errors', () => {
      const schema = z.object({
        first: z.string(),
        second: z.string(),
        third: z.string(),
      })
      const result = schema.safeParse({})

      if (!result.success) {
        const formatted = formatValidationError(result.error)
        const firstIndex = formatted.indexOf('first')
        const secondIndex = formatted.indexOf('second')
        const thirdIndex = formatted.indexOf('third')

        expect(firstIndex).toBeLessThan(secondIndex)
        expect(secondIndex).toBeLessThan(thirdIndex)
      }
    })

    it('formats complex multi-field validation errors', () => {
      const schema = z.object({
        slug: z.string().regex(/^[a-z0-9-]+$/),
        title: z.string().min(1),
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        count: z.number().positive(),
      })
      const result = schema.safeParse({
        slug: 'Invalid Slug!',
        title: '',
        date: 'invalid-date',
        count: -5,
      })

      if (!result.success) {
        const formatted = formatValidationError(result.error)
        expect(formatted).toContain('slug')
        expect(formatted).toContain('title')
        expect(formatted).toContain('date')
        expect(formatted).toContain('count')
      }
    })
  })

  describe('empty path errors', () => {
    it('formats errors with empty path', () => {
      const schema = z.string()
      const result = schema.safeParse(123)

      if (!result.success) {
        const formatted = formatValidationError(result.error)
        expect(formatted).toContain('expected string')
      }
    })
  })

  describe('real-world scenarios', () => {
    it('formats Notion post validation error', () => {
      const PostSchema = z.object({
        slug: z.string().min(1),
        title: z.string().min(1),
        firstPublished: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      })

      const result = PostSchema.safeParse({
        slug: '',
        title: 'Valid Title',
        firstPublished: 'invalid-date',
      })

      if (!result.success) {
        const formatted = formatValidationError(result.error)
        expect(formatted).toContain('slug')
        expect(formatted).toContain('firstPublished')
        expect(formatted).not.toContain('title') // title is valid
      }
    })

    it('formats media item validation error', () => {
      const MediaSchema = z.object({
        appleId: z.number().positive(),
        name: z.string().min(1),
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      })

      const result = MediaSchema.safeParse({
        appleId: -1,
        name: '',
        date: '2024-01-01',
      })

      if (!result.success) {
        const formatted = formatValidationError(result.error)
        expect(formatted).toContain('appleId')
        expect(formatted).toContain('name')
        expect(formatted).not.toContain('date') // date is valid
      }
    })
  })
})

describe('logValidationError', () => {
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleWarnSpy.mockRestore()
  })

  it('logs validation error with context', () => {
    const schema = z.object({ title: z.string() })
    const result = schema.safeParse({})

    if (!result.success) {
      logValidationError(result.error, 'post')
      expect(consoleWarnSpy).toHaveBeenCalledOnce()
      expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('Skipping invalid post'))
      expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('title'))
    }
  })

  it('includes formatted error details in log message', () => {
    const schema = z.object({
      slug: z.string(),
      count: z.number(),
    })
    const result = schema.safeParse({})

    if (!result.success) {
      logValidationError(result.error, 'item')
      expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('slug'))
      expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('count'))
    }
  })

  it('uses correct log format: "Skipping invalid {context} ({errors})"', () => {
    const schema = z.object({ name: z.string() })
    const result = schema.safeParse({})

    if (!result.success) {
      logValidationError(result.error, 'book')
      const logMessage = consoleWarnSpy.mock.calls[0][0]
      expect(logMessage).toMatch(/^Skipping invalid book \(.+\)$/)
    }
  })

  it('handles different context strings appropriately', () => {
    const schema = z.object({ value: z.string() })
    const result = schema.safeParse({})

    if (!result.success) {
      const contexts = ['post', 'block', 'media item', 'TMDB result', 'iTunes result']

      contexts.forEach(context => {
        consoleWarnSpy.mockClear()
        logValidationError(result.error, context)
        expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining(`Skipping invalid ${context}`))
      })
    }
  })

  it('logs helpful message for build-time debugging', () => {
    const schema = z.object({
      slug: z.string().regex(/^[a-z0-9-]+$/),
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    })
    const result = schema.safeParse({
      slug: 'Invalid Slug!',
      date: 'bad-date',
    })

    if (!result.success) {
      logValidationError(result.error, 'post')
      const logMessage = consoleWarnSpy.mock.calls[0][0]

      // Verify message contains enough detail to debug
      expect(logMessage).toContain('post')
      expect(logMessage).toContain('slug')
      expect(logMessage).toContain('date')

      // Verify message is concise (not too verbose)
      expect(logMessage.length).toBeLessThan(200)
    }
  })

  it('uses console.warn for visibility during builds', () => {
    const schema = z.object({ test: z.string() })
    const result = schema.safeParse({})

    if (!result.success) {
      logValidationError(result.error, 'test')

      // Verify it's using console.warn (not console.log or console.error)
      expect(consoleWarnSpy).toHaveBeenCalled()
    }
  })

  it('does not throw - allows build to continue with warning', () => {
    const schema = z.object({ value: z.string() })
    const result = schema.safeParse({})

    if (!result.success) {
      expect(() => {
        logValidationError(result.error, 'item')
      }).not.toThrow()
    }
  })
})
