import { getCached, setCached } from './filesystem'
import { readFile, writeFile, mkdir } from 'fs/promises'
import { z } from 'zod'

vi.mock('fs/promises', () => ({
  readFile: vi.fn(),
  writeFile: vi.fn(),
  mkdir: vi.fn(),
}))

describe('filesystem cache', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.unstubAllEnvs()
  })

  describe('getCached', () => {
    const TestSchema = z.object({
      name: z.string(),
      count: z.number(),
    })

    it('returns null in production mode', async () => {
      vi.stubEnv('NODE_ENV', 'production')

      const result = await getCached('test-key')

      expect(result).toBeNull()
      expect(readFile).not.toHaveBeenCalled()
    })

    it('returns null when cache file does not exist', async () => {
      vi.stubEnv('NODE_ENV', 'development')

      vi.mocked(readFile).mockRejectedValue(new Error('ENOENT: no such file'))

      const result = await getCached('test-key')

      expect(result).toBeNull()
    })

    it('returns cached data when file exists and no schema provided', async () => {
      vi.stubEnv('NODE_ENV', 'development')

      const cachedData = {
        cachedAt: '2024-01-01T00:00:00.000Z',
        data: { name: 'test', count: 42 },
      }

      vi.mocked(readFile).mockResolvedValue(JSON.stringify(cachedData))

      const result = await getCached('test-key')

      expect(result).toEqual({ name: 'test', count: 42 })
    })

    it('validates cached data with schema when provided', async () => {
      vi.stubEnv('NODE_ENV', 'development')

      const cachedData = {
        cachedAt: '2024-01-01T00:00:00.000Z',
        data: { name: 'test', count: 42 },
      }

      vi.mocked(readFile).mockResolvedValue(JSON.stringify(cachedData))

      const result = await getCached('test-key', 'default', TestSchema)

      expect(result).toEqual({ name: 'test', count: 42 })
    })

    it('returns null when cached data fails schema validation', async () => {
      vi.stubEnv('NODE_ENV', 'development')

      const cachedData = {
        cachedAt: '2024-01-01T00:00:00.000Z',
        data: { name: 'test', count: 'invalid' }, // Should be number
      }

      vi.mocked(readFile).mockResolvedValue(JSON.stringify(cachedData))

      const result = await getCached('test-key', 'default', TestSchema)

      expect(result).toBeNull()
    })

    it('returns null when cache file has invalid structure', async () => {
      vi.stubEnv('NODE_ENV', 'development')

      const invalidCachedData = {
        // Missing 'data' field
        cachedAt: '2024-01-01T00:00:00.000Z',
      }

      vi.mocked(readFile).mockResolvedValue(JSON.stringify(invalidCachedData))

      const result = await getCached('test-key', 'default', TestSchema)

      expect(result).toBeNull()
    })

    it('returns null when cache file contains malformed JSON', async () => {
      vi.stubEnv('NODE_ENV', 'development')

      vi.mocked(readFile).mockResolvedValue('{ invalid json')

      const result = await getCached('test-key')

      expect(result).toBeNull()
    })

    it('sanitizes cache key for filesystem safety', async () => {
      vi.stubEnv('NODE_ENV', 'development')

      const cachedData = {
        cachedAt: '2024-01-01T00:00:00.000Z',
        data: { name: 'test', count: 42 },
      }

      vi.mocked(readFile).mockResolvedValue(JSON.stringify(cachedData))

      await getCached('test/key:with*special?chars', 'namespace')

      expect(readFile).toHaveBeenCalledWith(
        expect.stringContaining('test-key-with-special-chars.json'),
        'utf-8',
      )
    })
  })

  describe('setCached', () => {
    it('does nothing in production mode', async () => {
      vi.stubEnv('NODE_ENV', 'production')

      await setCached('test-key', { name: 'test', count: 42 })

      expect(writeFile).not.toHaveBeenCalled()
    })

    it('writes cache file in development mode', async () => {
      vi.stubEnv('NODE_ENV', 'development')

      vi.mocked(mkdir).mockResolvedValue(undefined)
      vi.mocked(writeFile).mockResolvedValue()

      await setCached('test-key', { name: 'test', count: 42 })

      expect(mkdir).toHaveBeenCalled()

      const writeCall = vi.mocked(writeFile).mock.calls[0]
      expect(writeCall[0]).toContain('test-key.json')
      expect(writeCall[1]).toContain('"name"')
      expect(writeCall[1]).toContain('"test"')
      expect(writeCall[2]).toBe('utf-8')
    })

    it('includes timestamp in cached data', async () => {
      vi.stubEnv('NODE_ENV', 'development')

      vi.mocked(mkdir).mockResolvedValue(undefined)
      vi.mocked(writeFile).mockResolvedValue()

      await setCached('test-key', { name: 'test', count: 42 })

      const writeCall = vi.mocked(writeFile).mock.calls[0]
      const writtenData = JSON.parse(writeCall[1] as string)

      expect(writtenData).toHaveProperty('cachedAt')
      expect(writtenData).toHaveProperty('data')
      expect(writtenData.data).toEqual({ name: 'test', count: 42 })
    })

    it('does not throw on write failure', async () => {
      vi.stubEnv('NODE_ENV', 'development')

      vi.mocked(mkdir).mockRejectedValue(new Error('Permission denied'))

      await expect(setCached('test-key', { name: 'test', count: 42 })).resolves.not.toThrow()
    })
  })
})
