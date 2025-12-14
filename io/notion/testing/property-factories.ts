/**
 * Helper functions to create valid Notion property structures for testing.
 * Shared by all Notion tests that need to mock Notion API responses.
 */

export function createRichTextProperty(text: string | null) {
  if (text === null) {
    return {
      type: 'rich_text' as const,
      rich_text: [],
    }
  }
  return {
    type: 'rich_text' as const,
    rich_text: [{ plain_text: text }],
  }
}

export function createTitleProperty(text: string | null) {
  if (text === null) {
    return {
      type: 'title' as const,
      title: [],
    }
  }
  return {
    type: 'title' as const,
    title: [{ plain_text: text }],
  }
}

export function createDateProperty(date: string | null) {
  return {
    type: 'date' as const,
    date: date ? { start: date } : null,
  }
}

export function createFilesProperty(urls: string[]) {
  return {
    type: 'files' as const,
    files: urls.map(url => ({
      type: 'external' as const,
      external: { url },
    })),
  }
}

export function createNumberProperty(num: number | null) {
  return {
    type: 'number' as const,
    number: num,
  }
}
