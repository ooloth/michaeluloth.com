import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { parseArgs, validateInputs } from './notify-build-status'
import type { BuildStatusInputs, JobResult } from '@/io/pushover/types'

describe('parseArgs', () => {
  const originalArgv = process.argv

  beforeEach(() => {
    // Reset process.argv before each test
    process.argv = ['node', 'script.ts']
  })

  afterEach(() => {
    // Restore original argv
    process.argv = originalArgv
  })

  describe('success cases', () => {
    it('parses all job results correctly', () => {
      process.argv = [
        'node',
        'script.ts',
        '--deploy=success',
        '--lighthouse=failure',
        '--metadata=success',
        '--build=success',
        '--test=success',
        '--typecheck=success',
        '--lint=success',
        '--format=success',
        '--workflow-url=https://github.com/user/repo/actions/runs/123',
      ]

      const result = parseArgs()

      expect(result).toEqual({
        deploy: 'success',
        lighthouse: 'failure',
        metadata: 'success',
        build: 'success',
        test: 'success',
        typecheck: 'success',
        lint: 'success',
        format: 'success',
        workflowUrl: 'https://github.com/user/repo/actions/runs/123',
      })
    })

    it('parses workflow URL with special characters', () => {
      process.argv = [
        'node',
        'script.ts',
        '--workflow-url=https://github.com/user/repo/actions/runs/123?foo=bar&baz=qux',
      ]

      const result = parseArgs()

      expect(result.workflowUrl).toBe('https://github.com/user/repo/actions/runs/123?foo=bar&baz=qux')
    })

    it('handles mixed success/failure/skipped states', () => {
      process.argv = [
        'node',
        'script.ts',
        '--deploy=skipped',
        '--lighthouse=success',
        '--metadata=cancelled',
        '--build=failure',
        '--workflow-url=https://example.com',
      ]

      const result = parseArgs()

      expect(result.deploy).toBe('skipped')
      expect(result.lighthouse).toBe('success')
      expect(result.metadata).toBe('cancelled')
      expect(result.build).toBe('failure')
    })

    it('handles empty string values', () => {
      process.argv = ['node', 'script.ts', '--deploy=', '--workflow-url=']

      const result = parseArgs()

      expect(result.deploy).toBe('')
      expect(result.workflowUrl).toBe('')
    })
  })

  describe('missing arguments', () => {
    it('returns empty strings for missing job results', () => {
      process.argv = ['node', 'script.ts', '--workflow-url=https://example.com']

      const result = parseArgs()

      expect(result.deploy).toBe('')
      expect(result.lighthouse).toBe('')
      expect(result.metadata).toBe('')
      expect(result.build).toBe('')
      expect(result.test).toBe('')
      expect(result.typecheck).toBe('')
      expect(result.lint).toBe('')
      expect(result.format).toBe('')
      expect(result.workflowUrl).toBe('https://example.com')
    })

    it('returns empty string for missing workflow URL', () => {
      process.argv = ['node', 'script.ts', '--deploy=success']

      const result = parseArgs()

      expect(result.workflowUrl).toBe('')
    })

    it('returns all empty strings when no arguments provided', () => {
      process.argv = ['node', 'script.ts']

      const result = parseArgs()

      expect(result).toEqual({
        deploy: '',
        lighthouse: '',
        metadata: '',
        build: '',
        test: '',
        typecheck: '',
        lint: '',
        format: '',
        workflowUrl: '',
      })
    })
  })

  describe('malformed arguments', () => {
    it('ignores arguments without equals sign', () => {
      process.argv = ['node', 'script.ts', '--deploy', 'success', '--workflow-url=https://example.com']

      const result = parseArgs()

      // Arguments without = are ignored
      expect(result.deploy).toBe('')
      expect(result.workflowUrl).toBe('https://example.com')
    })

    it('ignores arguments without double dash prefix', () => {
      process.argv = ['node', 'script.ts', 'deploy=success', '--workflow-url=https://example.com']

      const result = parseArgs()

      // Arguments without -- are ignored
      expect(result.deploy).toBe('')
      expect(result.workflowUrl).toBe('https://example.com')
    })

    it('handles arguments with equals in value', () => {
      process.argv = ['node', 'script.ts', '--workflow-url=https://example.com?foo=bar']

      const result = parseArgs()

      // Should keep everything after first =
      expect(result.workflowUrl).toBe('https://example.com?foo=bar')
    })
  })
})

describe('validateInputs', () => {
  const createValidInputs = (): BuildStatusInputs => ({
    deploy: 'success',
    lighthouse: '',
    metadata: '',
    build: '',
    test: '',
    typecheck: '',
    lint: '',
    format: '',
    workflowUrl: 'https://github.com/user/repo/actions/runs/123',
  })

  describe('success cases', () => {
    it('succeeds when workflow URL and at least one job result present', () => {
      const inputs = createValidInputs()

      expect(() => validateInputs(inputs)).not.toThrow()
    })

    it('succeeds when all job results are provided', () => {
      const inputs: BuildStatusInputs = {
        deploy: 'success',
        lighthouse: 'success',
        metadata: 'success',
        build: 'success',
        test: 'success',
        typecheck: 'success',
        lint: 'success',
        format: 'success',
        workflowUrl: 'https://github.com/user/repo/actions/runs/123',
      }

      expect(() => validateInputs(inputs)).not.toThrow()
    })

    it('succeeds with any single job result', () => {
      const jobKeys = ['deploy', 'lighthouse', 'metadata', 'build', 'test', 'typecheck', 'lint', 'format'] as const

      for (const key of jobKeys) {
        const inputs: BuildStatusInputs = {
          deploy: '',
          lighthouse: '',
          metadata: '',
          build: '',
          test: '',
          typecheck: '',
          lint: '',
          format: '',
          workflowUrl: 'https://example.com',
          [key]: 'failure' as JobResult,
        }

        expect(() => validateInputs(inputs)).not.toThrow()
      }
    })
  })

  describe('error cases', () => {
    it('throws when workflow URL is missing', () => {
      const inputs: BuildStatusInputs = {
        deploy: 'success',
        lighthouse: '',
        metadata: '',
        build: '',
        test: '',
        typecheck: '',
        lint: '',
        format: '',
        workflowUrl: '',
      }

      expect(() => validateInputs(inputs)).toThrow('Missing required argument: --workflow-url')
    })

    it('throws when no job results provided', () => {
      const inputs: BuildStatusInputs = {
        deploy: '',
        lighthouse: '',
        metadata: '',
        build: '',
        test: '',
        typecheck: '',
        lint: '',
        format: '',
        workflowUrl: 'https://github.com/user/repo/actions/runs/123',
      }

      expect(() => validateInputs(inputs)).toThrow('At least one job result must be provided')
    })

    it('throws when both workflow URL and job results are missing', () => {
      const inputs: BuildStatusInputs = {
        deploy: '',
        lighthouse: '',
        metadata: '',
        build: '',
        test: '',
        typecheck: '',
        lint: '',
        format: '',
        workflowUrl: '',
      }

      // Should throw for missing workflow URL first (checked first in code)
      expect(() => validateInputs(inputs)).toThrow('Missing required argument: --workflow-url')
    })
  })

  describe('edge cases', () => {
    it('treats empty string as missing job result', () => {
      const inputs: BuildStatusInputs = {
        deploy: '',
        lighthouse: '',
        metadata: '',
        build: '',
        test: '',
        typecheck: '',
        lint: '',
        format: '',
        workflowUrl: 'https://example.com',
      }

      expect(() => validateInputs(inputs)).toThrow('At least one job result must be provided')
    })

    it('accepts non-standard job result values', () => {
      const inputs: BuildStatusInputs = {
        deploy: 'unknown' as unknown as JobResult,
        lighthouse: '',
        metadata: '',
        build: '',
        test: '',
        typecheck: '',
        lint: '',
        format: '',
        workflowUrl: 'https://example.com',
      }

      // Validation only checks presence, not value validity
      expect(() => validateInputs(inputs)).not.toThrow()
    })
  })
})
