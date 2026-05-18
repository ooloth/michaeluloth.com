# michaeluloth.com

My personal site where I write about what I'm learning and building 📝. It's a Next.js blog, but I treated the data pipeline like a production system because I wanted to see what that would look like.

## Patterns worth checking out

- **🛡️ Parse at the boundary** - Zod schemas that validate and reshape API responses (Notion, Cloudinary, TMDB, iTunes) in one pass, so the rest of the app works with clean domain types instead of nested API structures
- **✨ Result types for errors** - Rust-style `Result<T, E>` instead of exceptions. Errors are values that flow through function signatures, making error handling explicit
- **🧪 Testable by design** - Dependency injection separates I/O from business logic, so tests can validate transformations without mocking modules
- **✅ Post-build validation** - Scripts parse the actual build output to validate OpenGraph tags, image dimensions, alt text, and SEO metadata. Builds fail if Cloudinary images are missing alt text.
- **⚡ Smart CI pipeline** - Fast checks (format/lint/typecheck/test) run on every commit. Slow checks (build/Lighthouse/metadata) only run when PRs are ready. Lighthouse tests a randomized sample of URLs from the RSS feed instead of only hardcoded paths
- **🔄 Retry with backoff** - All external API calls are wrapped with exponential backoff retry logic to handle transient failures
- **💾 Development caching** - First fetch hits real APIs, then results are cached locally by namespace. Zero network calls on page refresh during development
- **🖼️ Responsive images** - Cloudinary integration generates srcsets with 9 sizes, automatic format/quality optimization, and enforced alt text
- **🔒 Environment validation** - Zod validates all env vars at startup with helpful error messages instead of runtime undefined errors
- **🧪 Comprehensive tests** - ~12k lines of tests covering data flow integration, component behavior via Testing Library, and reusable property factories for test data

**Tech:** TypeScript + Zod, Tailwind CSS 4, Vitest + Testing Library, GitHub Actions, Cloudflare Pages
