import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'

describe('_redirects file', () => {
  const redirectsPath = join(__dirname, '_redirects')
  const content = readFileSync(redirectsPath, 'utf-8')
  const lines = content.split('\n')

  it('exists and is readable', () => {
    expect(content).toBeDefined()
    expect(content.length).toBeGreaterThan(0)
  })

  it('has valid redirect format (source destination status)', () => {
    const redirectLines = lines.filter(line => {
      const trimmed = line.trim()
      return trimmed && !trimmed.startsWith('#')
    })

    expect(redirectLines.length).toBeGreaterThan(0)

    redirectLines.forEach((line, index) => {
      const parts = line.trim().split(/\s+/)

      // Each redirect should have exactly 3 parts: source, destination, status
      expect(parts.length, `Line ${index + 1}: "${line}" should have format "source destination status"`).toBe(3)

      const [source, destination, status] = parts

      // Source should start with /
      expect(source.startsWith('/'), `Line ${index + 1}: source "${source}" should start with /`).toBe(true)

      // Destination should start with /
      expect(destination.startsWith('/'), `Line ${index + 1}: destination "${destination}" should start with /`).toBe(
        true,
      )

      // Status should be a valid HTTP redirect code
      const validStatuses = ['301', '302', '303', '307', '308']
      expect(
        validStatuses.includes(status),
        `Line ${index + 1}: status "${status}" should be one of ${validStatuses.join(', ')}`,
      ).toBe(true)
    })
  })

  it('uses 301 (permanent redirect) for all redirects', () => {
    const redirectLines = lines.filter(line => {
      const trimmed = line.trim()
      return trimmed && !trimmed.startsWith('#')
    })

    redirectLines.forEach(line => {
      const parts = line.trim().split(/\s+/)
      const status = parts[2]
      expect(status).toBe('301')
    })
  })
})
