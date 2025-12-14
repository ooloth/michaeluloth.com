import { invariant } from './invariant'

describe('invariant', () => {
  describe('when condition is true', () => {
    it('does not throw', () => {
      expect(() => invariant(true, 'should not throw')).not.toThrow()
    })

    it('does not throw for truthy values', () => {
      expect(() => invariant(1, 'should not throw')).not.toThrow()
      expect(() => invariant('string', 'should not throw')).not.toThrow()
      expect(() => invariant({}, 'should not throw')).not.toThrow()
      expect(() => invariant([], 'should not throw')).not.toThrow()
    })

    it('allows TypeScript to narrow types', () => {
      const value: string | null = 'test'
      invariant(value, 'value should exist')
      // TypeScript should know value is string here
      const length: number = value.length
      expect(length).toBe(4)
    })
  })

  describe('when condition is false', () => {
    it('throws with formatted message', () => {
      expect(() => invariant(false, 'something went wrong')).toThrow(
        'Invariant violation: something went wrong',
      )
    })

    it('throws for falsy values', () => {
      expect(() => invariant(0, 'zero is falsy')).toThrow('Invariant violation: zero is falsy')
      expect(() => invariant('', 'empty string is falsy')).toThrow(
        'Invariant violation: empty string is falsy',
      )
      expect(() => invariant(null, 'null is falsy')).toThrow('Invariant violation: null is falsy')
      expect(() => invariant(undefined, 'undefined is falsy')).toThrow(
        'Invariant violation: undefined is falsy',
      )
    })

    it('throws an Error instance', () => {
      try {
        invariant(false, 'test')
        fail('should have thrown')
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
      }
    })
  })

  describe('context parameter', () => {
    it('attaches context object to error when provided', () => {
      const context = {
        publicId: 'test-image',
        width: 100,
        height: 200,
      }

      try {
        invariant(false, 'Invalid dimensions', context)
        fail('should have thrown')
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect((error as any).context).toEqual(context)
      }
    })

    it('does not modify error when context is not provided', () => {
      try {
        invariant(false, 'No context')
        fail('should have thrown')
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect((error as any).context).toBeUndefined()
      }
    })

    it('handles complex context objects', () => {
      const context = {
        nested: { deeply: { value: 42 } },
        array: [1, 2, 3],
        nullValue: null,
        undefinedValue: undefined,
      }

      try {
        invariant(false, 'Complex context', context)
        fail('should have thrown')
      } catch (error) {
        expect((error as any).context).toEqual(context)
      }
    })
  })

  describe('real-world usage patterns', () => {
    it('validates post-validation assumptions', () => {
      // Simulating after successful Zod parse
      const parseResult = {
        success: true,
        data: { width: 100, height: 200, publicId: 'test' },
      }

      expect(() => {
        invariant(parseResult.success, 'Parse should have succeeded')
        const { width, height } = parseResult.data
        invariant(width > 0 && height > 0, 'Dimensions must be positive', { width, height })
      }).not.toThrow()
    })

    it('enforces non-null after parsing', () => {
      const parseId = (url: string): string | null => {
        return url.includes('id=') ? url.split('id=')[1] : null
      }

      const url = 'https://example.com?id=123'
      const id = parseId(url)

      expect(() => {
        invariant(id, 'ID must be present in URL', { url })
        // TypeScript knows id is string here
        const length: number = id.length
        expect(length).toBe(3)
      }).not.toThrow()
    })

    it('documents impossible states', () => {
      type State = { status: 'loading' } | { status: 'success'; data: string } | { status: 'error'; error: Error }

      const state: State = { status: 'success', data: 'result' }

      if (state.status === 'success') {
        invariant('data' in state, 'Success state must have data')
        expect(state.data).toBe('result')
      }
    })
  })
})
