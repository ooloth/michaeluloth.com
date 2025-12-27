# michaeluloth.com

Personal site with writing, projects, and media consumption 📝. Built with Next.js 16, deployed as a static site to Cloudflare Pages.

## What's interesting

- **🛡️ I/O boundary validation** - External data (Notion, Cloudinary, TMDB, iTunes) gets validated and transformed at the boundary using Zod schemas that both validate and reshape in one pass, so the rest of the app works with clean domain types instead of nested API structures
- **✨ Result types for explicit errors** - Custom Result<T, E> type (Rust-inspired) instead of throwing exceptions everywhere, making error handling visible in function signatures
- **🧪 Dependency injection for testable I/O** - Pure transformation functions are separated from I/O and accept dependencies as optional parameters, so tests can validate business logic without module mocking
- **✅ Post-build metadata validation** - Scripts parse the actual build output HTML to validate OpenGraph tags, image dimensions, alt text, and SEO metadata—enforces quality at the boundary where it matters
- **⚡ Smart CI pipeline** - Fast checks (format/lint/typecheck/test) run on every commit, slow checks (build/Lighthouse/metadata) only on ready PRs, dynamic Lighthouse URLs from RSS feed instead of hardcoded pages
- **🔄 Retry logic with exponential backoff** - All external API calls (Notion, Cloudinary, etc.) wrapped with consistent retry behavior to handle transient failures
- **💾 Development caching** - Zero network calls during local dev after first fetch, with per-source namespaces and scripts to clear individual caches
- **🖼️ Responsive image pipeline** - Cloudinary integration generates 9 srcset sizes with enforced alt text (build fails if missing) and automatic format/quality optimization
- **🔒 Environment validation at startup** - All env vars validated with Zod at app startup with helpful error messages, not runtime "undefined" surprises
- **🧪 72k lines of tests** - Integration tests for data flow, component tests using Testing Library patterns, property factories to eliminate test data duplication

**Tech stack:** TypeScript + Zod, Tailwind CSS 4, Vitest + Testing Library, GitHub Actions CI
