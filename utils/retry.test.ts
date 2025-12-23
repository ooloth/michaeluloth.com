import { describe, it, expect, vi, beforeEach } from 'vitest'
import { withRetry } from './retry'

describe('withRetry', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  describe('successful execution', () => {
    it('returns result on first attempt when successful', async () => {
      const fn = vi.fn().mockResolvedValue('success')

      const promise = withRetry(fn)
      await vi.runAllTimersAsync()
      const result = await promise

      expect(result).toBe('success')
      expect(fn).toHaveBeenCalledTimes(1)
    })

    it('does not delay when first attempt succeeds', async () => {
      const fn = vi.fn().mockResolvedValue('success')

      const promise = withRetry(fn)
      const result = await promise

      expect(result).toBe('success')
      expect(vi.getTimerCount()).toBe(0)
    })
  })

  describe('retryable errors', () => {
    it('retries on fetch failed error', async () => {
      const fn = vi
        .fn()
        .mockRejectedValueOnce(new Error('fetch failed'))
        .mockResolvedValue('success')

      const promise = withRetry(fn, { initialDelayMs: 100 })
      await vi.runAllTimersAsync()
      const result = await promise

      expect(result).toBe('success')
      expect(fn).toHaveBeenCalledTimes(2)
    })

    it('retries on ETIMEDOUT error', async () => {
      const error = new Error('Request timeout')
      ;(error as Error & { cause: { code: string } }).cause = { code: 'ETIMEDOUT' }

      const fn = vi.fn().mockRejectedValueOnce(error).mockResolvedValue('success')

      const promise = withRetry(fn, { initialDelayMs: 100 })
      await vi.runAllTimersAsync()
      const result = await promise

      expect(result).toBe('success')
      expect(fn).toHaveBeenCalledTimes(2)
    })

    it('retries on ECONNRESET error', async () => {
      const error = new Error('Connection reset')
      ;(error as Error & { cause: { code: string } }).cause = { code: 'ECONNRESET' }

      const fn = vi.fn().mockRejectedValueOnce(error).mockResolvedValue('success')

      const promise = withRetry(fn, { initialDelayMs: 100 })
      await vi.runAllTimersAsync()
      const result = await promise

      expect(result).toBe('success')
      expect(fn).toHaveBeenCalledTimes(2)
    })

    it('retries on network timeout error', async () => {
      const fn = vi
        .fn()
        .mockRejectedValueOnce(new Error('network timeout'))
        .mockResolvedValue('success')

      const promise = withRetry(fn, { initialDelayMs: 100 })
      await vi.runAllTimersAsync()
      const result = await promise

      expect(result).toBe('success')
      expect(fn).toHaveBeenCalledTimes(2)
    })
  })

  describe('non-retryable errors', () => {
    it('does not retry validation errors', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('Invalid data'))

      const promise = withRetry(fn)

      await expect(promise).rejects.toThrow('Invalid data')
      expect(fn).toHaveBeenCalledTimes(1)
    })

    it('does not retry missing data errors', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('Missing required field'))

      const promise = withRetry(fn)

      await expect(promise).rejects.toThrow('Missing required field')
      expect(fn).toHaveBeenCalledTimes(1)
    })
  })

  describe('exponential backoff', () => {
    it('uses initial delay on first retry', async () => {
      const fn = vi
        .fn()
        .mockRejectedValueOnce(new Error('fetch failed'))
        .mockResolvedValue('success')

      const onRetry = vi.fn()
      const promise = withRetry(fn, { initialDelayMs: 1000, onRetry })
      await vi.runAllTimersAsync()
      await promise

      expect(onRetry).toHaveBeenCalledWith(expect.any(Error), 1, 1000)
    })

    it('doubles delay on second retry', async () => {
      const fn = vi
        .fn()
        .mockRejectedValueOnce(new Error('fetch failed'))
        .mockRejectedValueOnce(new Error('fetch failed'))
        .mockResolvedValue('success')

      const onRetry = vi.fn()
      const promise = withRetry(fn, { initialDelayMs: 1000, backoffMultiplier: 2, onRetry })
      await vi.runAllTimersAsync()
      await promise

      expect(onRetry).toHaveBeenCalledWith(expect.any(Error), 1, 1000)
      expect(onRetry).toHaveBeenCalledWith(expect.any(Error), 2, 2000)
    })

    it('respects max delay cap', async () => {
      const fn = vi
        .fn()
        .mockRejectedValueOnce(new Error('fetch failed'))
        .mockRejectedValueOnce(new Error('fetch failed'))
        .mockResolvedValue('success')

      const onRetry = vi.fn()
      const promise = withRetry(fn, { initialDelayMs: 1000, maxDelayMs: 1500, onRetry })
      await vi.runAllTimersAsync()
      await promise

      expect(onRetry).toHaveBeenCalledWith(expect.any(Error), 1, 1000)
      expect(onRetry).toHaveBeenCalledWith(expect.any(Error), 2, 1500) // capped at maxDelayMs
    })
  })

  describe('max attempts', () => {
    it('throws after max attempts exhausted', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('fetch failed'))

      const promise = withRetry(fn, { maxAttempts: 3, initialDelayMs: 100 })
      // Run timers and wait for promise to reject
      const timerPromise = vi.runAllTimersAsync()
      await Promise.all([timerPromise, promise.catch(() => {})])

      await expect(promise).rejects.toThrow('fetch failed')
      expect(fn).toHaveBeenCalledTimes(3)
    })

    it('respects custom max attempts', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('network error'))

      const promise = withRetry(fn, { maxAttempts: 5, initialDelayMs: 100 })
      // Run timers and wait for promise to reject
      const timerPromise = vi.runAllTimersAsync()
      await Promise.all([timerPromise, promise.catch(() => {})])

      await expect(promise).rejects.toThrow('network error')
      expect(fn).toHaveBeenCalledTimes(5)
    })
  })

  describe('onRetry callback', () => {
    it('calls onRetry with error, attempt, and delay', async () => {
      const error = new Error('fetch failed')
      const fn = vi.fn().mockRejectedValueOnce(error).mockResolvedValue('success')

      const onRetry = vi.fn()
      const promise = withRetry(fn, { initialDelayMs: 500, onRetry })
      await vi.runAllTimersAsync()
      await promise

      expect(onRetry).toHaveBeenCalledWith(error, 1, 500)
      expect(onRetry).toHaveBeenCalledTimes(1)
    })

    it('calls onRetry for each retry attempt', async () => {
      const fn = vi
        .fn()
        .mockRejectedValueOnce(new Error('fetch failed'))
        .mockRejectedValueOnce(new Error('fetch failed'))
        .mockResolvedValue('success')

      const onRetry = vi.fn()
      const promise = withRetry(fn, { initialDelayMs: 100, onRetry })
      await vi.runAllTimersAsync()
      await promise

      expect(onRetry).toHaveBeenCalledTimes(2)
    })
  })
})
