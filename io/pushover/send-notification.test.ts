import { sendNotification } from './send-notification'
import type { PushoverClient } from './client'
import type { PushoverResponse } from './types'
import { vi, beforeEach, afterEach } from 'vitest'

const mockClient: PushoverClient = {
  apiToken: 'test-api-token',
  userKey: 'test-user-key',
  apiUrl: 'https://api.pushover.net/1/messages.json',
}

describe('sendNotification', () => {
  const originalFetch = global.fetch

  beforeEach(() => {
    global.fetch = vi.fn()
  })

  afterEach(() => {
    global.fetch = originalFetch
    vi.restoreAllMocks()
  })

  describe('success cases', () => {
    it('sends notification with message only', async () => {
      const mockResponse: PushoverResponse = {
        status: 1,
        request: 'test-request-id',
      }

      vi.mocked(global.fetch).mockResolvedValueOnce({
        json: async () => mockResponse,
      } as Response)

      const result = await sendNotification(mockClient, {
        message: 'Test message',
      })

      expect(result).toEqual(mockResponse)
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.pushover.net/1/messages.json',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }),
      )

      const callArgs = vi.mocked(global.fetch).mock.calls[0]
      const body = callArgs[1]?.body as string
      expect(body).toContain('token=test-api-token')
      expect(body).toContain('user=test-user-key')
      expect(body).toContain('message=Test+message')
    })

    it('sends notification with message and URL', async () => {
      const mockResponse: PushoverResponse = {
        status: 1,
        request: 'test-request-id',
      }

      vi.mocked(global.fetch).mockResolvedValueOnce({
        json: async () => mockResponse,
      } as Response)

      await sendNotification(mockClient, {
        message: 'Test message',
        url: 'https://example.com',
      })

      const callArgs = vi.mocked(global.fetch).mock.calls[0]
      const body = callArgs[1]?.body as string
      expect(body).toContain('message=Test+message')
      expect(body).toContain('url=https%3A%2F%2Fexample.com')
    })

    it('sends notification with title', async () => {
      const mockResponse: PushoverResponse = {
        status: 1,
        request: 'test-request-id',
      }

      vi.mocked(global.fetch).mockResolvedValueOnce({
        json: async () => mockResponse,
      } as Response)

      await sendNotification(mockClient, {
        message: 'Test message',
        title: 'Test Title',
      })

      const callArgs = vi.mocked(global.fetch).mock.calls[0]
      const body = callArgs[1]?.body as string
      expect(body).toContain('title=Test+Title')
    })

    it('sends notification with priority', async () => {
      const mockResponse: PushoverResponse = {
        status: 1,
        request: 'test-request-id',
      }

      vi.mocked(global.fetch).mockResolvedValueOnce({
        json: async () => mockResponse,
      } as Response)

      await sendNotification(mockClient, {
        message: 'High priority message',
        priority: 1,
      })

      const callArgs = vi.mocked(global.fetch).mock.calls[0]
      const body = callArgs[1]?.body as string
      expect(body).toContain('priority=1')
    })

    it('sends notification with all optional parameters', async () => {
      const mockResponse: PushoverResponse = {
        status: 1,
        request: 'test-request-id',
      }

      vi.mocked(global.fetch).mockResolvedValueOnce({
        json: async () => mockResponse,
      } as Response)

      await sendNotification(mockClient, {
        message: 'Complete message',
        url: 'https://example.com/details',
        title: 'Alert',
        priority: 1,
      })

      const callArgs = vi.mocked(global.fetch).mock.calls[0]
      const body = callArgs[1]?.body as string
      expect(body).toContain('message=Complete+message')
      expect(body).toContain('url=https%3A%2F%2Fexample.com%2Fdetails')
      expect(body).toContain('title=Alert')
      expect(body).toContain('priority=1')
    })
  })

  describe('error cases', () => {
    it('throws error when Pushover API returns status 0', async () => {
      const mockResponse: PushoverResponse = {
        status: 0,
        request: 'test-request-id',
        errors: ['invalid user key', 'message is required'],
      }

      vi.mocked(global.fetch).mockResolvedValueOnce({
        json: async () => mockResponse,
      } as Response)

      await expect(
        sendNotification(mockClient, {
          message: 'Test',
        }),
      ).rejects.toThrow('Pushover API error: invalid user key, message is required')
    })

    it('throws error when Pushover API returns status 0 without error details', async () => {
      const mockResponse: PushoverResponse = {
        status: 0,
        request: 'test-request-id',
      }

      vi.mocked(global.fetch).mockResolvedValueOnce({
        json: async () => mockResponse,
      } as Response)

      await expect(
        sendNotification(mockClient, {
          message: 'Test',
        }),
      ).rejects.toThrow('Pushover API error: Unknown error')
    })

    it('throws error when fetch fails', async () => {
      vi.mocked(global.fetch).mockRejectedValueOnce(new Error('Network error'))

      await expect(
        sendNotification(mockClient, {
          message: 'Test',
        }),
      ).rejects.toThrow('Network error')
    })
  })
})
