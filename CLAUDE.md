# michaeluloth.com - Claude Code Rules

## TypeScript Type Safety

### Never use `any`

**Rule:** Never use `any`, `as any`, or `@typescript-eslint/no-explicit-any` to bypass type errors.

**Why:** Type errors indicate a mismatch between what TypeScript expects and what you're providing. The solution is always to communicate the real type properly, not to suppress the error.

**How to fix type errors properly:**

1. **Understand what TypeScript expects** - Read the error message carefully to understand the expected type
2. **Provide the correct type** - Use proper type annotations, interfaces, or type assertions with the actual type
3. **Use the right syntax** - If a library expects JSX/ReactNode, use JSX syntax (`.tsx` files) instead of plain objects
4. **Import necessary types** - Ensure you have the correct imports (e.g., `React` for JSX)

**Example: Satori type error**

```typescript
// ❌ WRONG - bypassing the type error
const svg = await satori(
  {
    type: 'div',
    props: { /* ... */ }
  } as any,  // Never do this!
  options
)

// ✅ CORRECT - using proper JSX syntax that TypeScript understands
// 1. Rename file from .ts to .tsx
// 2. Import React
import React from 'react'

// 3. Use JSX syntax instead of plain objects
const svg = await satori(
  <div>
    {/* ... */}
  </div>,
  options
)
```

This rule ensures the codebase maintains full type safety and prevents runtime errors that `any` would hide.
