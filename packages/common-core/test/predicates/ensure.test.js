import { ensure, is, AssertionError } from '../../src/predicates'

describe('ensure.that', () => {
  it('should not throw when validator returns true', () => {
    expect(() => ensure.that('hello', is.string, 'Must be string')).not.toThrow()
    expect(() => ensure.that([1, 2, 3], is.array, 'Must be array')).not.toThrow()
  })
  it('should throw a TypeError with the message by default', () => {
    expect(() => ensure.that(-1, is.positive, 'Must be positive')).toThrow(TypeError)
    expect(() => ensure.that(-1, is.positive, 'Must be positive')).toThrow('Must be positive')
  })
  it('should throw the given error type', () => {
    expect(() => ensure.that(-1, is.positive, 'Must be positive', RangeError)).toThrow(RangeError)
    expect(() => ensure.that(-1, is.positive, 'Must be positive', AssertionError)).toThrow(AssertionError)
  })
  it('should throw a custom error type with the message', () => {
    class ConfigError extends Error {}
    expect(() => ensure.that(null, is.defined, 'Config is required', ConfigError)).toThrow(ConfigError)
    expect(() => ensure.that(null, is.defined, 'Config is required', ConfigError)).toThrow('Config is required')
  })
})

describe('ensure.all', () => {
  it('should not throw when all validations pass', () => {
    expect(() => ensure.all([
      { value: 'hello', validator: is.string, message: 'Must be string' },
      { value: 5, validator: is.number, message: 'Must be number' }
    ])).not.toThrow()
  })
  it('should throw on the first failing validation only', () => {
    const validator = vi.fn(() => false)
    expect(() => ensure.all([
      { value: 1, validator, message: 'First error' },
      { value: 2, validator, message: 'Second error' }
    ])).toThrow('First error')
    expect(validator).toHaveBeenCalledTimes(1)
  })
  it('should throw a TypeError by default and the given error type otherwise', () => {
    const failing = [{ value: 1, validator: () => false, message: 'Error' }]
    expect(() => ensure.all(failing)).toThrow(TypeError)
    expect(() => ensure.all(failing, RangeError)).toThrow(RangeError)
  })
  it('should pass on an empty array', () => {
    expect(() => ensure.all([])).not.toThrow()
  })
})

describe('ensure.any', () => {
  it('should not throw when one validation passes', () => {
    expect(() => ensure.any([
      { value: 5, validator: is.string, message: 'Must be string' },
      { value: 5, validator: is.number, message: 'Must be number' }
    ])).not.toThrow()
  })
  it('should combine all messages with "or" when every validation fails', () => {
    expect(() => ensure.any([
      { value: null, validator: is.string, message: 'Must be string' },
      { value: null, validator: is.number, message: 'Must be number' }
    ])).toThrow('Must be string or Must be number')
  })
  it('should throw a TypeError by default and the given error type otherwise', () => {
    const failing = [{ value: 1, validator: () => false, message: 'Error' }]
    expect(() => ensure.any(failing)).toThrow(TypeError)
    expect(() => ensure.any(failing, RangeError)).toThrow(RangeError)
  })
  it('should pass on an empty array', () => {
    expect(() => ensure.any([])).not.toThrow()
  })
})

describe('ensure in production', () => {
  const failing = { value: 1, validator: () => false, message: 'checked anyway' }
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.resetModules()
  })
  it('keeps ensure.that, ensure.all and ensure.any active', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.resetModules()
    const { ensure } = await import('../../src/predicates/ensure.js')
    expect(() => ensure.that(failing.value, failing.validator, failing.message)).toThrow(TypeError)
    expect(() => ensure.all([failing])).toThrow(TypeError)
    expect(() => ensure.any([failing])).toThrow(TypeError)
  })
})
