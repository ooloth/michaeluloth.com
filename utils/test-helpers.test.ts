import { assertInstanceOf } from './test-helpers'

class CustomError extends Error {
  code: string

  constructor(message: string, code: string) {
    super(message)
    this.name = 'CustomError'
    this.code = code
  }
}

describe('assertInstanceOf', () => {
  it('narrows type when value is instance of constructor', () => {
    const error = new CustomError('test', 'TEST_CODE')

    assertInstanceOf(error, CustomError)
    // TypeScript now knows error is CustomError
    expect(error.code).toBe('TEST_CODE')
  })

  it('throws when value is not instance of constructor', () => {
    const error = new Error('regular error')

    expect(() => assertInstanceOf(error, CustomError)).toThrow('Expected instance of CustomError, got object')
  })

  it('uses custom error message when provided', () => {
    const value = 'not an error'

    expect(() => assertInstanceOf(value, CustomError, 'Custom message')).toThrow('Custom message')
  })

  it('works with built-in Error class', () => {
    const error = new Error('test')

    assertInstanceOf(error, Error)
    expect(error.message).toBe('test')
  })

  it('works with null values', () => {
    expect(() => assertInstanceOf(null, Error)).toThrow('Expected instance of Error, got object')
  })

  it('works with undefined values', () => {
    expect(() => assertInstanceOf(undefined, Error)).toThrow('Expected instance of Error, got undefined')
  })
})
