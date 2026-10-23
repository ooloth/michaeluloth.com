import { APIErrorCode, APIResponseError, UnknownHTTPResponseError } from '@notionhq/client'
import fc from 'fast-check'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { withRetry } from '@/io/utils/retry'
import { createNotionRetryPolicy, NotionRateLimitTooLong, notionRetryOptions } from './rateLimit'

function rateLimited(retryAfter: string | null, status = 429): Error {
  const headers = new Headers(retryAfter === null ? {} : { 'retry-after': retryAfter })
  const rawBodyText = '{}'

  if (status === 429) {
    return new APIResponseError({
      code: APIErrorCode.RateLimited,
      status,
      message: 'You have been rate limited. Please try again later.',
      headers,
      rawBodyText,
      additional_data: { rate_limit_reason: 'public_api_request_rate_limit' },
      request_id: 'request-123',
    })
  }

  // This SDK version has no error code for 529, so it surfaces as an unknown HTTP error
  return new UnknownHTTPResponseError({ status, message: 'service_overload', headers, rawBodyText })
}

describe('Notion retry policy', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('makes the next attempt no earlier than Retry-After after a 429', async () => {
    const policy = createNotionRetryPolicy()
    const fn = vi.fn().mockRejectedValueOnce(rateLimited('30')).mockResolvedValue('ok')

    const promise = withRetry(fn, { policy })
    await vi.advanceTimersByTimeAsync(29_999)
    expect(fn).toHaveBeenCalledTimes(1)

    await vi.advanceTimersByTimeAsync(1)
    await expect(promise).resolves.toBe('ok')
    expect(fn).toHaveBeenCalledTimes(2)
  })

  it('waits for Retry-After on a 529 the same way', async () => {
    const policy = createNotionRetryPolicy()
    const fn = vi.fn().mockRejectedValueOnce(rateLimited('20', 529)).mockResolvedValue('ok')

    const promise = withRetry(fn, { policy })
    await vi.advanceTimersByTimeAsync(19_999)
    expect(fn).toHaveBeenCalledTimes(1)

    await vi.advanceTimersByTimeAsync(1)
    await expect(promise).resolves.toBe('ok')
  })

  it('holds back a second call that starts during the pause until the pause ends', async () => {
    const policy = createNotionRetryPolicy()
    const first = vi.fn().mockRejectedValueOnce(rateLimited('10')).mockResolvedValue('first')
    const second = vi.fn().mockResolvedValue('second')

    const firstPromise = withRetry(first, { policy })
    await vi.advanceTimersByTimeAsync(1_000)

    const secondPromise = withRetry(second, { policy })
    await vi.advanceTimersByTimeAsync(8_999)
    expect(second).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(1)
    await expect(secondPromise).resolves.toBe('second')
    await expect(firstPromise).resolves.toBe('first')
  })

  it.each(['1', '54', '90'])('completes after waiting a Retry-After of %s seconds', async retryAfter => {
    const policy = createNotionRetryPolicy()
    const fn = vi.fn().mockRejectedValueOnce(rateLimited(retryAfter)).mockResolvedValue('ok')

    const promise = withRetry(fn, { policy })
    await vi.advanceTimersByTimeAsync(Number(retryAfter) * 1000)

    await expect(promise).resolves.toBe('ok')
  })

  it('gives up at once, naming the wait, when Retry-After is above 90 seconds', async () => {
    const policy = createNotionRetryPolicy()
    const fn = vi.fn().mockRejectedValue(rateLimited('91'))

    const promise = withRetry(fn, { policy })
    const assertion = expect(promise).rejects.toThrow(NotionRateLimitTooLong)
    await vi.runAllTimersAsync()

    await assertion
    await expect(promise).rejects.toThrow(/91 seconds/)
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it.each([null, '0', '-5', 'soon', '1.5'])(
    'falls back to the 2s and 4s backoff when Retry-After is %s',
    async retryAfter => {
      const policy = createNotionRetryPolicy()
      const fn = vi.fn().mockRejectedValueOnce(rateLimited(retryAfter)).mockResolvedValue('ok')

      const promise = withRetry(fn, { policy })
      await vi.advanceTimersByTimeAsync(1_999)
      expect(fn).toHaveBeenCalledTimes(1)

      await vi.advanceTimersByTimeAsync(1)
      await expect(promise).resolves.toBe('ok')
    },
  )

  it('keeps the 2s and 4s backoff for errors that are not rate limits', async () => {
    const policy = createNotionRetryPolicy()
    const fn = vi.fn().mockRejectedValue(new Error('fetch failed'))

    const promise = withRetry(fn, { policy })
    const assertion = expect(promise).rejects.toThrow('fetch failed')
    await vi.advanceTimersByTimeAsync(1_999)
    expect(fn).toHaveBeenCalledTimes(1)
    await vi.advanceTimersByTimeAsync(1)
    expect(fn).toHaveBeenCalledTimes(2)
    await vi.advanceTimersByTimeAsync(4_000)

    await assertion
    expect(fn).toHaveBeenCalledTimes(3)
  })

  it('ends the pause at the latest time any Retry-After asked for', () => {
    fc.assert(
      fc.property(fc.array(fc.integer({ min: 1, max: 90 }), { minLength: 1, maxLength: 20 }), seconds => {
        const policy = createNotionRetryPolicy()
        const start = Date.now()

        seconds.forEach((s, i) => policy.decide(rateLimited(String(s)), i + 1, 2_000))

        expect(policy.pausedUntil()).toBe(start + Math.max(...seconds) * 1000)
      }),
    )
  })

  it('logs that Notion rate limited the request, with the reason and the wait', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {})
    const fn = vi.fn().mockRejectedValueOnce(rateLimited('24')).mockResolvedValue('ok')

    const promise = withRetry(fn, { ...notionRetryOptions('post "hello-world"'), policy: createNotionRetryPolicy() })
    await vi.advanceTimersByTimeAsync(24_000)
    await promise

    const message = String(log.mock.calls.at(-1)?.[0])
    expect(message).toContain('rate limited')
    expect(message).toContain('public_api_request_rate_limit')
    expect(message).toContain('24s')
    expect(message).toContain('post "hello-world"')
    expect(message).not.toContain('timeout')
  })

  it('logs other failures as failed requests, not rate limits', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {})
    const fn = vi.fn().mockRejectedValueOnce(new Error('fetch failed')).mockResolvedValue('ok')

    const promise = withRetry(fn, { ...notionRetryOptions('posts'), policy: createNotionRetryPolicy() })
    await vi.advanceTimersByTimeAsync(2_000)
    await promise

    const message = String(log.mock.calls.at(-1)?.[0])
    expect(message).toContain('Notion request for posts failed')
    expect(message).toContain('fetch failed')
    expect(message).not.toContain('rate limited')
  })
})
