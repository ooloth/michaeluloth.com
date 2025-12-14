# Invariant Usage Guidelines

## Overview

The `invariant()` utility is used to document and enforce runtime assumptions that should never fail in correct code. It provides type narrowing, clear error messages, and optional context for debugging.

## When to Use Invariant

Use `invariant()` to document **impossible conditions** that should never occur if upstream validation is correct:

### ✅ Good Use Cases

1. **Post-validation assumptions**

   ```typescript
   // After successful Zod parsing, certain properties must exist
   const parsed = ImageMetadataSchema.safeParse(data)
   invariant(parsed.success, 'Schema must validate required fields')
   invariant(parsed.data.width > 0, 'Width must be positive after validation', {
     width: parsed.data.width,
   })
   ```

2. **Type narrowing after checks**

   ```typescript
   const user = await getUser(id)
   invariant(user, 'User must exist after authentication')
   // TypeScript now knows user is non-null
   console.log(user.name)
   ```

3. **Documenting impossible states**

   ```typescript
   const ariaLabel = emojiMap.get(symbol)
   invariant(ariaLabel, 'Emoji must have aria-label', { symbol })
   // Documents that our emoji map should be complete
   ```

4. **Guaranteeing required properties exist**
   ```typescript
   // After filtering/mapping operations
   const firstPost = sortedPosts[0]
   invariant(firstPost, 'Posts array must not be empty after filtering')
   ```

## When NOT to Use Invariant

### ❌ Don't Use for Expected Errors

```typescript
// BAD - External data should be validated with Zod/Result pattern
const response = await fetch(url)
invariant(response.ok, 'API must return success')

// GOOD - Use Result pattern for expected failures
const result = await fetchData(url)
if (!result.ok) {
  return result // Propagate error
}
```

### ❌ Don't Use Instead of Validation

```typescript
// BAD - This IS the validation logic
function parseUrl(url: string) {
  invariant(url.startsWith('https://'), 'URL must use HTTPS')
  return new URL(url)
}

// GOOD - Use Zod or throw/return validation errors
function parseUrl(url: string): Result<URL, Error> {
  try {
    const parsed = new URL(url)
    if (parsed.protocol !== 'https:') {
      return Err(new Error('URL must use HTTPS'))
    }
    return Ok(parsed)
  } catch (error) {
    return toErr(error, 'parseUrl')
  }
}
```

### ❌ Don't Use for Function Return Values That Throw

```typescript
// BAD - parsePublicIdFromCloudinaryUrl throws if it can't parse
const publicId = parsePublicIdFromCloudinaryUrl(url)
invariant(publicId, 'Parser must find publicId in validated Cloudinary URL')

// GOOD - Function guarantees non-null by throwing, no check needed
const publicId = parsePublicIdFromCloudinaryUrl(url)
// If we get here, publicId is guaranteed to be a string
```

## Message Format

Follow the "X must Y" pattern for clear, actionable error messages:

```typescript
// ✅ GOOD
invariant(user, 'User must exist after authentication')
invariant(width > 0, 'Image dimensions must be positive', { width, height })
invariant(ariaLabel, 'Emoji must have aria-label', { symbol })

// ❌ BAD
invariant(user, 'No user')
invariant(width > 0, 'Invalid width')
invariant(ariaLabel, 'Missing label')
```

## Context Parameter

Always include context when it helps debugging:

```typescript
// Useful context
invariant(parsed.success, 'Schema must validate required fields', {
  errors: parsed.error?.errors,
  input: data,
})

invariant(width > 0 && height > 0, 'Image dimensions must be positive', {
  width,
  height,
  publicId,
})

// Not needed for simple checks
invariant(user, 'User must exist after authentication')
```

## Decision Tree

```
Is this an assumption that should NEVER fail?
├─ No → Use validation/Result pattern instead
└─ Yes → Is it after upstream validation?
    ├─ Yes → Use invariant() ✅
    └─ No → This IS the validation - use Zod/Result ❌
```

## Migration from Validation to Invariant

When moving validation upstream to Zod schemas, runtime checks become invariants:

```typescript
// BEFORE: Runtime validation
function getPost(slug: string) {
  const page = await notion.query(...)

  // This is validation
  if (!page.last_edited_time) {
    throw new Error('Page must have last_edited_time')
  }

  return transformPage(page)
}

// AFTER: Validation in schema, runtime check becomes invariant
const PostPageSchema = z.object({
  id: z.string(),
  last_edited_time: z.string(), // Now required in schema
  properties: z.unknown(),
})

function getPost(slug: string) {
  const page = await notion.query(...)
  const parsed = PostPageSchema.parse(page) // Throws if invalid

  // Now we can use invariant since schema guarantees it exists
  invariant(parsed.last_edited_time, 'Schema must validate last_edited_time')

  // Or better: trust TypeScript since schema requires it
  return transformPage(parsed) // last_edited_time is guaranteed by type
}
```

## Examples from Codebase

### Good: Post-Validation Assertion

```typescript
// lib/cloudinary/fetchCloudinaryImageMetadata.ts
// Zod has already validated width/height are numbers
invariant(metadata.width > 0 && metadata.height > 0, 'Image dimensions must be positive', {
  width: metadata.width,
  height: metadata.height,
  publicId,
})
```

### Good: Documenting Complete Mapping

```typescript
// ui/emoji.tsx
const ariaLabel = emojiLabels[symbol]
invariant(ariaLabel, 'Emoji must have aria-label', { symbol })
// Documents that our emoji map should cover all symbols
```

### Bad: Checking Function That Throws

```typescript
// lib/cloudinary/fetchCloudinaryImageMetadata.ts (old code)
const publicId = parsePublicIdFromCloudinaryUrl(url)
invariant(publicId, 'Parser must find publicId')
// BAD: parsePublicIdFromCloudinaryUrl throws if it can't parse
//      If we reach this line, publicId is guaranteed non-null
```

## Related Patterns

- **Zod Validation**: Use for external data at I/O boundaries
- **Result Pattern**: Use for operations that can fail expectedly
- **TypeScript `assert` functions**: `invariant()` is an assert function
- **Defensive Programming**: Balance between defense and trust
