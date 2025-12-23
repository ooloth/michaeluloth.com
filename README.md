# michaeluloth.com

Personal website and blog built with Next.js 16, deployed as a static site to Cloudflare Pages.

## Tech Stack

- **Framework**: Next.js 16 (App Router, static export)
- **Styling**: Tailwind CSS 4
- **Content**: Notion API (posts, books, albums, podcasts)
- **Images**: Cloudinary
- **Comments**: Giscus (GitHub Discussions)
- **Deployment**: Cloudflare Pages (via Wrangler CLI)

## Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the site.

### Environment Variables

Create a `.env.local` file with:

```
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
CLOUDINARY_CLOUD_NAME=
NOTION_ACCESS_TOKEN=
NOTION_DATA_SOURCE_ID_ALBUMS=
NOTION_DATA_SOURCE_ID_BOOKS=
NOTION_DATA_SOURCE_ID_PODCASTS=
NOTION_DATA_SOURCE_ID_WRITING=
TMDB_READ_ACCESS_TOKEN=
TMDB_MOVIE_LIST_ID=
TMDB_TV_LIST_ID=
```

**CI-only variables** (configured in GitHub Actions secrets):

```
CLOUDFLARE_ACCOUNT_ID=
CLOUDFLARE_API_TOKEN=
PUSHOVER_API_TOKEN=
PUSHOVER_USER_KEY=
```

See `.env.example` for the complete list.

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build static site to `out/`
- `npm run deploy:preview` - Build and deploy to Cloudflare Pages (preview)
- `npm run deploy:production` - Build and deploy to Cloudflare Pages (production)
- `npm test` - Run tests
- `npm run lighthouse` - Run Lighthouse CI
- `npm run cache:clear` - Clear all local caches

## Deployment

The site is deployed to **Cloudflare Pages** using the **Wrangler CLI**.

### Prerequisites

1. Install Wrangler CLI (included in devDependencies, runs via `npx`)
2. Authenticate: `npx wrangler login`

### Deploy Commands

**Preview deployment** (allows uncommitted changes):

```bash
npm run deploy:preview
```

**Production deployment** (from main branch):

```bash
npm run deploy:production
```

### Deployment Details

- **Project name**: `michaeluloth`
- **Preview URL**: `https://michaeluloth.pages.dev`
- **Production URL**: `https://michaeluloth.com` (custom domain)
- **Build output**: `out/` directory (static files)
- **Build command**: `npm run build` (Next.js static export)

### Static Export Configuration

This site uses Next.js static export (`output: 'export'` in `next.config.ts`). All pages are pre-rendered at build time:

- Blog posts generated via `generateStaticParams()`
- 404 page at `app/not-found.tsx`
- Redirects handled via `public/_redirects` (Cloudflare Pages format)

## Comments Configuration

Comments use [Giscus](https://giscus.app/) backed by the [`ooloth/comments`](https://github.com/ooloth/comments) repository.

**Allowed origins** (configured in `ooloth/comments/giscus.json`):

- `https://michaeluloth.com`
- `https://michaeluloth.netlify.app`
- `https://*.michaeluloth.pages.dev` (Cloudflare preview deployments)
- `http://localhost:[0-9]+` (local development)

## API Retry Logic

All external API calls include retry logic with exponential backoff to handle transient network failures:

- **Notion API**: Posts, media items, block children
- **Cloudinary API**: Image metadata
- **iTunes API**: Book/album/podcast metadata
- **TMDB API**: Movie/TV metadata

**Configuration:**

- **Max attempts**: 3
- **Initial delay**: 2s
- **Backoff multiplier**: 2x (delays: 2s, 4s, 8s)
- **Retryable errors**: Network/timeout errors only (fetch failures, ETIMEDOUT, ECONNRESET, ENOTFOUND, EAI_AGAIN)
- **Non-retryable errors**: Validation errors, missing data, authentication failures

See `utils/retry.ts` for implementation details.
