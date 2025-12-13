# Input Validation Pattern

This document describes the established pattern for validating external inputs using Zod.

## Principle: Validate at I/O Boundaries

**All external data should be validated with Zod at the point it enters the system.**

### What to Validate

1. **Environment variables** - `lib/env.ts`
2. **External API responses** - TMDB, iTunes, Notion, Cloudinary
3. **Filesystem reads** - Cache files, config files
4. **User inputs** - Query params, form data, route params (when needed)

### Schema Organization

**Use inline schemas when:**

- Schema is used in only one file
- Type is not exported for use elsewhere
- Simple, single-purpose validation

```typescript
// ✅ Inline schema - used only here
const TmdbApiResultSchema = z.object({
  id: z.number(),
  title: z.string(),
  // ...
})
```

**Use dedicated schema files when:**

- Schema/type is shared across multiple files
- Part of a domain with multiple related schemas
- Types need to be exported for UI components

```typescript
// ✅ Dedicated file - lib/notion/schemas/post.ts
export const PostListItemSchema = z.object({
  id: z.string(),
  slug: z.string(),
  // ...
})
```

## Patterns

### 1. External API Validation

**Dual-layer validation** - validate raw API response, then transform:

```typescript
// Define schemas
const ApiResponseSchema = z.object({
  raw_field: z.string(),
  nested: z.object({ value: z.number() }),
})

const ProcessedItemSchema = z.object({
  cleanField: z.string(),
  value: z.number(),
})

// Validate raw response
const apiResult = ApiResponseSchema.safeParse(rawResponse)
if (!apiResult.success) {
  throw new Error(`Invalid API response: ${formatValidationError(apiResult.error)}`)
}

// Transform and validate again
const item = ProcessedItemSchema.safeParse({
  cleanField: apiResult.data.raw_field,
  value: apiResult.data.nested.value,
})
```

### 2. Cache Validation

**Always provide schema when reading from cache:**

```typescript
// ✅ Good - validates cached data
const cached = await cache.get<Post>(
  'post-123',
  'notion',
  PostSchema, // ← Schema ensures data integrity
)

// ⚠️ Avoid - no validation, unsafe
const cached = await cache.get<Post>('post-123', 'notion')
```

**Benefits:**

- Detects corrupted cache files → cache miss → re-fetch
- Handles schema evolution gracefully
- Prevents runtime errors from malformed data

### 3. Error Handling

Use `safeParse()` for graceful error handling:

```typescript
const result = MySchema.safeParse(data)
if (!result.success) {
  // Log helpful context
  console.warn(`Invalid data for ${key}:`, result.error.message)
  return null // or throw, depending on criticality
}

const validData = result.data // TypeScript knows this is valid
```

**Validation Error Helpers (`utils/zod.ts`):**

Use these helpers for cleaner, more consistent error messages:

```typescript
import { formatValidationError, logValidationError } from '@/utils/zod'

// For throwing errors - extracts field names and messages
const result = MySchema.safeParse(data)
if (!result.success) {
  throw new Error(`Invalid data: ${formatValidationError(result.error)}`)
  // Output: "Invalid data: title: Required, date: Invalid format"
}

// For logging warnings - includes context
const result = MySchema.safeParse(data)
if (!result.success) {
  logValidationError(result.error, 'post metadata')
  // Output: "Skipping invalid post metadata (title: Required, date: Invalid format)"
}
```

### 4. Optional vs Required Fields

Be explicit about optionality:

```typescript
const Schema = z.object({
  required: z.string(), // Must exist
  optional: z.string().optional(), // May be undefined
  nullable: z.string().nullable(), // May be null
  nullish: z.string().nullish(), // May be null or undefined
})
```

## Type Safety

**Never use type assertions for external data:**

```typescript
// ❌ Bad - no runtime validation
const data = apiResponse as MyType

// ✅ Good - runtime validation with safeParse
const result = MySchema.safeParse(apiResponse)
if (result.success) {
  const data = result.data // Validated
}
```

**Exception:** Type assertions are OK in tests and for backward compatibility (cache without schema).

## Examples in Codebase

- **Environment**: `lib/env.ts` - Validates all env vars at startup
- **APIs**: `lib/cloudinary/fetchCloudinaryImageMetadata.ts` - Dual-layer validation
- **Cache**: `lib/notion/getPosts.ts` - Cache with schema validation
- **Blocks**: `lib/notion/schemas/block.ts` - Complex recursive validation

## Adding New External Inputs

When adding a new external data source:

1. **Define schema** (inline or dedicated file based on usage)
2. **Validate at boundary** using `safeParse()`
3. **Handle errors** gracefully with context
4. **Add schema to cache reads** if applicable
5. **Write tests** for validation edge cases

## Testing

Test both success and failure cases:

```typescript
describe('validation', () => {
  it('accepts valid data', () => {
    const result = MySchema.safeParse(validData)
    expect(result.success).toBe(true)
  })

  it('rejects invalid data', () => {
    const result = MySchema.safeParse(invalidData)
    expect(result.success).toBe(false)
  })
})
```

See `lib/cache/filesystem.test.ts` for comprehensive validation testing examples.
