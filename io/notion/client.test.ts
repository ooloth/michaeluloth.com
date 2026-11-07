/**
 * The shared pause in rateLimit.ts decides every wait after a Notion 429 or 529, so the SDK must
 * hand the first one straight to withRetry rather than retrying on its own.
 */

describe('notion client', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.resetModules()
  })

  it('rejects a rate-limited request after one attempt, leaving retries to withRetry', async () => {
    const fetchStub = vi.fn(
      async () =>
        new Response(JSON.stringify({ object: 'error', status: 429, code: 'rate_limited', message: 'slow down' }), {
          status: 429,
          headers: { 'content-type': 'application/json', 'retry-after': '1' },
        }),
    )
    // The SDK binds fetch when the client is created, so stub it before the module loads
    vi.stubGlobal('fetch', fetchStub)
    vi.resetModules()
    const { default: notion } = await vi.importActual<typeof import('./client')>('./client')

    await expect(notion.dataSources.query({ data_source_id: 'test-data-source' })).rejects.toMatchObject({
      status: 429,
    })
    expect(fetchStub).toHaveBeenCalledTimes(1)
  })
})
