import { beforeEach, describe, expect, it, vi } from 'vitest'

// Each service has its own env module so a process only needs the secrets for
// the services it loads (e.g. the CI notify job only has the Pushover ones).
const services = [
  {
    name: 'notion',
    load: async () => (await import('./notion')).notionEnv,
    valid: {
      NOTION_ACCESS_TOKEN: 'notion-token-abc',
      NOTION_DATA_SOURCE_ID_BOOKS: 'books-db-id',
      NOTION_DATA_SOURCE_ID_ALBUMS: 'albums-db-id',
      NOTION_DATA_SOURCE_ID_PODCASTS: 'podcasts-db-id',
      NOTION_DATA_SOURCE_ID_WRITING: 'writing-db-id',
    },
  },
  {
    name: 'tmdb',
    load: async () => (await import('./tmdb')).tmdbEnv,
    valid: {
      TMDB_TV_LIST_ID: 'tv-list-123',
      TMDB_MOVIE_LIST_ID: 'movie-list-456',
      TMDB_READ_ACCESS_TOKEN: 'tmdb-token-xyz',
    },
  },
  {
    name: 'cloudinary',
    load: async () => (await import('./cloudinary')).cloudinaryEnv,
    valid: {
      CLOUDINARY_CLOUD_NAME: 'my-cloud',
      CLOUDINARY_API_KEY: 'cloudinary-key',
      CLOUDINARY_API_SECRET: 'cloudinary-secret',
    },
  },
  {
    name: 'pushover',
    load: async () => (await import('./pushover')).pushoverEnv,
    valid: {
      PUSHOVER_API_TOKEN: 'pushover-token',
      PUSHOVER_USER_KEY: 'pushover-user',
    },
  },
] as const

const allKeys = services.flatMap(service => Object.keys(service.valid))

const cases = services.flatMap(service =>
  Object.keys(service.valid).map(key => ({ service: service.name, key, ...service })),
)

function stubOnly(vars: Readonly<Record<string, string>>) {
  Object.entries(vars).forEach(([key, value]) => vi.stubEnv(key, value))
}

beforeEach(() => {
  // Reset modules to allow re-importing with different env vars
  vi.resetModules()
  vi.unstubAllEnvs()

  // A developer's shell or CI may already set these, so clear them so the
  // tests control exactly which ones exist
  allKeys.forEach(key => {
    delete process.env[key]
  })

  // vitest.setup.ts mocks these modules for every other test
  services.forEach(service => vi.doUnmock(`./${service.name}`))
})

describe.each(services)('$name env', ({ load, valid }) => {
  it("exports its variables when only its own are set and every other service's are absent", async () => {
    stubOnly(valid)

    await expect(load()).resolves.toEqual(valid)
  })

  it('reports all of its missing variables at once', async () => {
    await expect(load()).rejects.toThrow(new RegExp(Object.keys(valid).join('[\\s\\S]*')))
  })
})

describe('missing or empty variables', () => {
  it.each(cases)('$service env throws naming $key when it is missing', async ({ key, load, valid }) => {
    stubOnly(Object.fromEntries(Object.entries(valid).filter(([k]) => k !== key)))

    await expect(load()).rejects.toThrow(key)
    await expect(load()).rejects.toThrow(/expected string, received undefined/)
  })

  it.each(cases)('$service env throws "$key is required" when it is empty', async ({ key, load, valid }) => {
    stubOnly({ ...valid, [key]: '' })

    await expect(load()).rejects.toThrow(`${key} is required`)
  })
})
