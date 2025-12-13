import { Ok, Err, isOk, isErr } from './result'

describe('Result type', () => {
  describe('Ok', () => {
    it('creates a successful Result', () => {
      const result = Ok(42)
      expect(result).toMatchObject({ ok: true, value: 42 })
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
      expect(result).toMatchObject({ ok: false, error })
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

    it('narrows type to OkResult', () => {
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

    it('narrows type to ErrResult', () => {
      const result = Err(new Error('fail'))
      if (isErr(result)) {
        // TypeScript should know result.error exists
        expect(result.error.message).toBe('fail')
      }
    })
  })

  describe('unwrap method', () => {
    it('returns value from Ok result', () => {
      const result = Ok(42)
      expect(result.unwrap()).toBe(42)
    })

    it('throws error from Err result', () => {
      const error = new Error('Something went wrong')
      const result = Err(error)
      expect(() => result.unwrap()).toThrow(error)
    })

    it('preserves error message when throwing', () => {
      const result = Err(new Error('Custom error'))
      expect(() => result.unwrap()).toThrow('Custom error')
    })
  })

  describe('unwrapOr method', () => {
    it('returns value from Ok result', () => {
      const result = Ok(42)
      expect(result.unwrapOr(0)).toBe(42)
    })

    it('returns default value from Err result', () => {
      const result = Err(new Error('fail'))
      expect(result.unwrapOr(0)).toBe(0)
    })

    it('works with complex default values', () => {
      const result = Err(new Error('fail'))
      const defaultValue = { items: [], count: 0 }
      expect(result.unwrapOr(defaultValue)).toEqual({ items: [], count: 0 })
    })
  })

  describe('map method', () => {
    it('transforms Ok value', () => {
      const result = Ok(42)
      const mapped = result.map((n) => n * 2)
      expect(mapped).toMatchObject({ ok: true, value: 84 })
    })

    it('preserves Err without calling function', () => {
      const error = new Error('fail')
      const result = Err(error)
      const mapped = result.map((n: number) => n * 2)
      expect(mapped).toMatchObject({ ok: false, error })
    })

    it('can change value type', () => {
      const result = Ok(42)
      const mapped = result.map((n) => String(n))
      expect(mapped).toMatchObject({ ok: true, value: '42' })
    })

    it('can chain map calls', () => {
      const result = Ok(10)
      const mapped = result.map((n) => n * 2).map((n) => n + 5)
      expect(mapped).toMatchObject({ ok: true, value: 25 })
    })
  })

  describe('mapErr method', () => {
    it('transforms Err error', () => {
      const result = Err(new Error('original'))
      const mapped = result.mapErr((e) => new Error(`Wrapped: ${e.message}`))
      expect(isErr(mapped)).toBe(true)
      if (isErr(mapped)) {
        expect(mapped.error.message).toBe('Wrapped: original')
      }
    })

    it('preserves Ok without calling function', () => {
      const result = Ok(42)
      const mapped = result.mapErr((e: Error) => new Error(`Wrapped: ${e.message}`))
      expect(mapped).toMatchObject({ ok: true, value: 42 })
    })

    it('can change error type', () => {
      const result = Err(new Error('fail'))
      const mapped = result.mapErr((e) => e.message)
      expect(mapped).toMatchObject({ ok: false, error: 'fail' })
    })
  })

  describe('flatMap method', () => {
    it('chains Ok results', () => {
      const result = Ok(42)
      const chained = result.flatMap((n) => Ok(n * 2))
      expect(chained).toMatchObject({ ok: true, value: 84 })
    })

    it('chains and converts Ok to Err', () => {
      const result = Ok(42)
      const chained = result.flatMap((n) => (n > 50 ? Ok(n) : Err(new Error('too small'))))
      expect(isErr(chained)).toBe(true)
      if (isErr(chained)) {
        expect(chained.error.message).toBe('too small')
      }
    })

    it('short-circuits on Err', () => {
      const error = new Error('original')
      const result = Err(error)
      const chained = result.flatMap((n: number) => Ok(n * 2))
      expect(chained).toMatchObject({ ok: false, error })
    })

    it('can change value type through chaining', () => {
      const result = Ok(42)
      const chained = result.flatMap((n) => Ok(String(n)))
      expect(chained).toMatchObject({ ok: true, value: '42' })
    })
  })

  describe('real-world usage patterns', () => {
    it('chains multiple operations', () => {
      const divide = (a: number, b: number) => (b === 0 ? Err(new Error('divide by zero')) : Ok(a / b))

      const result = divide(10, 2).flatMap((x) => divide(x, 5).flatMap((y) => Ok(y * 3)))

      expect(result).toMatchObject({ ok: true, value: 3 }) // (10 / 2) / 5 * 3 = 3
    })

    it('handles error in chain', () => {
      const divide = (a: number, b: number) => (b === 0 ? Err(new Error('divide by zero')) : Ok(a / b))

      const result = divide(10, 0).flatMap((x) => divide(x, 5).flatMap((y) => Ok(y * 3)))

      expect(isErr(result)).toBe(true)
      if (isErr(result)) {
        expect(result.error.message).toBe('divide by zero')
      }
    })

    it('provides default value for error case', () => {
      const fetchUser = (id: number) =>
        id > 0 ? Ok({ id, name: 'Alice' }) : Err(new Error('Invalid ID'))

      const user = fetchUser(-1).unwrapOr({ id: 0, name: 'Guest' })
      expect(user).toEqual({ id: 0, name: 'Guest' })
    })

    it('fluent API with method chaining', () => {
      const result = Ok([1, 2, 3, 4, 5])
        .map((arr) => arr.filter((n) => n % 2 === 0))
        .map((arr) => arr.map((n) => n * 2))
        .unwrapOr([])

      expect(result).toEqual([4, 8])
    })
  })
})
