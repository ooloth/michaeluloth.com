import { Ok, Err, isOk, isErr, unwrap, unwrapOr, map, mapErr, flatMap } from './result'

describe('Result type', () => {
  describe('Ok', () => {
    it('creates a successful Result', () => {
      const result = Ok(42)
      expect(result).toEqual({ ok: true, value: 42 })
    })

    it('preserves type of value', () => {
      const result = Ok({ name: 'test', count: 10 })
      expect(result.value).toEqual({ name: 'test', count: 10 })
    })
  })

  describe('Err', () => {
    it('creates a failed Result', () => {
      const error = new Error('Something went wrong')
      const result = Err(error)
      expect(result).toEqual({ ok: false, error })
    })

    it('can hold any error type', () => {
      const result = Err('string error')
      expect(result.error).toBe('string error')
    })
  })

  describe('isOk', () => {
    it('returns true for Ok results', () => {
      const result = Ok(42)
      expect(isOk(result)).toBe(true)
    })

    it('returns false for Err results', () => {
      const result = Err(new Error('fail'))
      expect(isOk(result)).toBe(false)
    })

    it('narrows type to Ok', () => {
      const result = Ok(42)
      if (isOk(result)) {
        // TypeScript should know result.value exists
        expect(result.value).toBe(42)
      }
    })
  })

  describe('isErr', () => {
    it('returns true for Err results', () => {
      const result = Err(new Error('fail'))
      expect(isErr(result)).toBe(true)
    })

    it('returns false for Ok results', () => {
      const result = Ok(42)
      expect(isErr(result)).toBe(false)
    })

    it('narrows type to Err', () => {
      const result = Err(new Error('fail'))
      if (isErr(result)) {
        // TypeScript should know result.error exists
        expect(result.error.message).toBe('fail')
      }
    })
  })

  describe('unwrap', () => {
    it('returns value from Ok result', () => {
      const result = Ok(42)
      expect(unwrap(result)).toBe(42)
    })

    it('throws error from Err result', () => {
      const error = new Error('Something went wrong')
      const result = Err(error)
      expect(() => unwrap(result)).toThrow(error)
    })

    it('preserves error message when throwing', () => {
      const result = Err(new Error('Custom error'))
      expect(() => unwrap(result)).toThrow('Custom error')
    })
  })

  describe('unwrapOr', () => {
    it('returns value from Ok result', () => {
      const result = Ok(42)
      expect(unwrapOr(result, 0)).toBe(42)
    })

    it('returns default value from Err result', () => {
      const result = Err(new Error('fail'))
      expect(unwrapOr(result, 0)).toBe(0)
    })

    it('works with complex default values', () => {
      const result = Err(new Error('fail'))
      const defaultValue = { items: [], count: 0 }
      expect(unwrapOr(result, defaultValue)).toEqual({ items: [], count: 0 })
    })
  })

  describe('map', () => {
    it('transforms Ok value', () => {
      const result = Ok(42)
      const mapped = map(result, (n) => n * 2)
      expect(mapped).toEqual(Ok(84))
    })

    it('preserves Err without calling function', () => {
      const error = new Error('fail')
      const result = Err(error)
      const mapped = map(result, (n: number) => n * 2)
      expect(mapped).toEqual(Err(error))
    })

    it('can change value type', () => {
      const result = Ok(42)
      const mapped = map(result, (n) => String(n))
      expect(mapped).toEqual(Ok('42'))
    })
  })

  describe('mapErr', () => {
    it('transforms Err error', () => {
      const result = Err(new Error('original'))
      const mapped = mapErr(result, (e) => new Error(`Wrapped: ${e.message}`))
      expect(mapped).toEqual(Err(new Error('Wrapped: original')))
    })

    it('preserves Ok without calling function', () => {
      const result = Ok(42)
      const mapped = mapErr(result, (e: Error) => new Error(`Wrapped: ${e.message}`))
      expect(mapped).toEqual(Ok(42))
    })

    it('can change error type', () => {
      const result = Err(new Error('fail'))
      const mapped = mapErr(result, (e) => e.message)
      expect(mapped).toEqual(Err('fail'))
    })
  })

  describe('flatMap', () => {
    it('chains Ok results', () => {
      const result = Ok(42)
      const chained = flatMap(result, (n) => Ok(n * 2))
      expect(chained).toEqual(Ok(84))
    })

    it('chains and converts Ok to Err', () => {
      const result = Ok(42)
      const chained = flatMap(result, (n) => (n > 50 ? Ok(n) : Err(new Error('too small'))))
      expect(chained).toEqual(Err(new Error('too small')))
    })

    it('short-circuits on Err', () => {
      const error = new Error('original')
      const result = Err(error)
      const chained = flatMap(result, (n: number) => Ok(n * 2))
      expect(chained).toEqual(Err(error))
    })

    it('can change value type through chaining', () => {
      const result = Ok(42)
      const chained = flatMap(result, (n) => Ok(String(n)))
      expect(chained).toEqual(Ok('42'))
    })
  })

  describe('real-world usage patterns', () => {
    it('chains multiple operations', () => {
      const divide = (a: number, b: number) => (b === 0 ? Err(new Error('divide by zero')) : Ok(a / b))

      const result = flatMap(divide(10, 2), (x) => flatMap(divide(x, 5), (y) => Ok(y * 3)))

      expect(result).toEqual(Ok(3)) // (10 / 2) / 5 * 3 = 3
    })

    it('handles error in chain', () => {
      const divide = (a: number, b: number) => (b === 0 ? Err(new Error('divide by zero')) : Ok(a / b))

      const result = flatMap(divide(10, 0), (x) => flatMap(divide(x, 5), (y) => Ok(y * 3)))

      expect(isErr(result)).toBe(true)
      if (isErr(result)) {
        expect(result.error.message).toBe('divide by zero')
      }
    })

    it('provides default value for error case', () => {
      const fetchUser = (id: number) =>
        id > 0 ? Ok({ id, name: 'Alice' }) : Err(new Error('Invalid ID'))

      const user = unwrapOr(fetchUser(-1), { id: 0, name: 'Guest' })
      expect(user).toEqual({ id: 0, name: 'Guest' })
    })
  })
})
