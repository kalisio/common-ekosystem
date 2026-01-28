import { describe, it, expect } from 'vitest'
import { assert } from '../src/assert.js'
import { is } from '../src/is.js'

describe('assert.that', () => {
  it('should not throw when validator returns true', () => {
    expect(() => {
      assert.that(5, (v) => v === 5, 'Should be 5')
    }).not.toThrow()

    expect(() => {
      assert.that('hello', is.string, 'Should be a string')
    }).not.toThrow()

    expect(() => {
      assert.that([1, 2, 3], is.array, 'Should be an array')
    }).not.toThrow()
  })

  it('should throw TypeError when validator returns false', () => {
    expect(() => {
      assert.that(5, (v) => v === 10, 'Should be 10')
    }).toThrow(TypeError)

    expect(() => {
      assert.that(5, (v) => v === 10, 'Should be 10')
    }).toThrow('Should be 10')
  })

  it('should throw with custom error message', () => {
    expect(() => {
      assert.that(null, is.defined, 'Value must be defined')
    }).toThrow('Value must be defined')

    expect(() => {
      assert.that('', is.emptyString, 'String must be empty')
    }).not.toThrow()

    expect(() => {
      assert.that(-5, (v) => is.number(v) && is.positive(v), 'Age must be positive')
    }).toThrow('Age must be positive')
  })

  it('should work with is validators', () => {
    expect(() => {
      assert.that({ a: 1 }, is.plainObject, 'Must be plain object')
    }).not.toThrow()

    expect(() => {
      assert.that([], is.plainObject, 'Must be plain object')
    }).toThrow('Must be plain object')
  })

  it('should work with custom validators', () => {
    const isEven = (n) => n % 2 === 0
    const isEmail = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)

    expect(() => {
      assert.that(4, isEven, 'Must be even')
    }).not.toThrow()

    expect(() => {
      assert.that(5, isEven, 'Must be even')
    }).toThrow('Must be even')

    expect(() => {
      assert.that('test@example.com', isEmail, 'Must be valid email')
    }).not.toThrow()

    expect(() => {
      assert.that('invalid', isEmail, 'Must be valid email')
    }).toThrow('Must be valid email')
  })

  it('should work with complex validators', () => {
    const hasRequiredFields = (obj) =>
      obj && obj.name && obj.email && obj.age

    expect(() => {
      assert.that(
        { name: 'John', email: 'john@example.com', age: 30 },
        hasRequiredFields,
        'Missing required fields'
      )
    }).not.toThrow()

    expect(() => {
      assert.that(
        { name: 'John' },
        hasRequiredFields,
        'Missing required fields'
      )
    }).toThrow('Missing required fields')
  })

  it('should work with range validators', () => {
    expect(() => {
      assert.that(5, (v) => is.inRange(v, 0, 10), 'Must be between 0 and 10')
    }).not.toThrow()

    expect(() => {
      assert.that(15, (v) => is.inRange(v, 0, 10), 'Must be between 0 and 10')
    }).toThrow('Must be between 0 and 10')
  })

  it('should work with oneOf validators', () => {
    expect(() => {
      assert.that('blue', (v) => is.oneOf(v, ['red', 'green', 'blue']), 'Invalid color')
    }).not.toThrow()

    expect(() => {
      assert.that('yellow', (v) => is.oneOf(v, ['red', 'green', 'blue']), 'Invalid color')
    }).toThrow('Invalid color')
  })
})

describe('assert.all', () => {
  it('should not throw when all validations pass', () => {
    expect(() => {
      assert.all([
        { value: 'hello', validator: is.string, message: 'Must be string' },
        { value: 5, validator: is.number, message: 'Must be number' },
        { value: true, validator: is.boolean, message: 'Must be boolean' }
      ])
    }).not.toThrow()
  })

  it('should throw on first failing validation', () => {
    expect(() => {
      assert.all([
        { value: 'hello', validator: is.string, message: 'Must be string' },
        { value: null, validator: is.number, message: 'Must be number' },
        { value: true, validator: is.boolean, message: 'Must be boolean' }
      ])
    }).toThrow('Must be number')
  })

  it('should handle empty validations array', () => {
    expect(() => {
      assert.all([])
    }).not.toThrow()
  })

  it('should validate multiple properties of an object', () => {
    const user = {
      name: 'John Doe',
      age: 30,
      email: 'john@example.com',
      isActive: true
    }

    expect(() => {
      assert.all([
        { value: user.name, validator: (v) => !is.emptyString(v), message: 'Name is required' },
        { value: user.age, validator: (v) => is.number(v) && is.positive(v), message: 'Age must be positive' },
        { value: user.email, validator: (v) => !is.emptyString(v), message: 'Email is required' },
        { value: user.isActive, validator: is.boolean, message: 'isActive must be boolean' }
      ])
    }).not.toThrow()
  })

  it('should fail with specific message for each property', () => {
    const user = {
      name: '',
      age: -5,
      email: 'john@example.com'
    }

    expect(() => {
      assert.all([
        { value: user.name, validator: (v) => !is.emptyString(v), message: 'Name is required' }
      ])
    }).toThrow('Name is required')

    expect(() => {
      assert.all([
        { value: user.name, validator: is.string, message: 'Name must be string' },
        { value: user.age, validator: (v) => is.number(v) && is.positive(v), message: 'Age must be positive' }
      ])
    }).toThrow('Age must be positive')
  })

  it('should work with custom validators', () => {
    const isAdult = (age) => age >= 18
    const isValidUsername = (name) => /^[a-zA-Z0-9_]{3,20}$/.test(name)

    expect(() => {
      assert.all([
        { value: 'john_doe', validator: isValidUsername, message: 'Invalid username' },
        { value: 25, validator: isAdult, message: 'Must be adult' }
      ])
    }).not.toThrow()

    expect(() => {
      assert.all([
        { value: 'jo', validator: isValidUsername, message: 'Invalid username' },
        { value: 25, validator: isAdult, message: 'Must be adult' }
      ])
    }).toThrow('Invalid username')

    expect(() => {
      assert.all([
        { value: 'john_doe', validator: isValidUsername, message: 'Invalid username' },
        { value: 15, validator: isAdult, message: 'Must be adult' }
      ])
    }).toThrow('Must be adult')
  })

  it('should validate function parameters', () => {
    function createUser (name, age, email) {
      assert.all([
        { value: name, validator: (v) => !is.emptyString(v), message: 'Name must be a non-empty string' },
        { value: age, validator: (v) => is.number(v) && is.positive(v), message: 'Age must be a positive number' },
        { value: email, validator: (v) => !is.emptyString(v), message: 'Email must be a non-empty string' }
      ])
      return { name, age, email }
    }

    expect(() => createUser('John', 30, 'john@example.com')).not.toThrow()
    expect(() => createUser('', 30, 'john@example.com')).toThrow('Name must be a non-empty string')
    expect(() => createUser('John', -5, 'john@example.com')).toThrow('Age must be a positive number')
    expect(() => createUser('John', 30, '')).toThrow('Email must be a non-empty string')
  })

  it('should work with complex validation logic', () => {
    const config = {
      port: 3000,
      host: 'localhost',
      env: 'development',
      db: {
        name: 'mydb',
        user: 'admin'
      }
    }

    expect(() => {
      assert.all([
        { value: config.port, validator: (v) => is.number(v) && is.positive(v), message: 'Port must be positive number' },
        { value: config.host, validator: (v) => !is.emptyString(v), message: 'Host is required' },
        { value: config.env, validator: (v) => is.oneOf(v, ['development', 'production', 'test']), message: 'Invalid environment' },
        { value: config.db, validator: (v) => !is.emptyObject(v), message: 'Database config is required' },
        { value: config.db.name, validator: (v) => !is.emptyString(v), message: 'Database name is required' },
        { value: config.db.user, validator: (v) => !is.emptyString(v), message: 'Database user is required' }
      ])
    }).not.toThrow()
  })

  it('should handle array validations', () => {
    const items = [1, 2, 3, 4, 5]

    expect(() => {
      assert.all([
        { value: items, validator: (v) => !is.emptyArray(v), message: 'Items must be non-empty array' },
        { value: items.length, validator: (len) => len >= 3, message: 'Must have at least 3 items' },
        { value: items.every(n => is.number(n)), validator: (v) => v === true, message: 'All items must be numbers' }
      ])
    }).not.toThrow()
  })

  it('should stop at first error and not continue validating', () => {
    let validationCount = 0
    const countingValidator = () => {
      validationCount++
      return false
    }

    expect(() => {
      assert.all([
        { value: 1, validator: countingValidator, message: 'First error' },
        { value: 2, validator: countingValidator, message: 'Second error' },
        { value: 3, validator: countingValidator, message: 'Third error' }
      ])
    }).toThrow('First error')

    expect(validationCount).toBe(1)
  })

  it('should throw TypeError specifically', () => {
    expect(() => {
      assert.all([
        { value: 'test', validator: () => false, message: 'Error' }
      ])
    }).toThrow(TypeError)
  })
})

describe('assert integration with is', () => {
  it('should work seamlessly with all is validators', () => {
    expect(() => assert.that(123, is.number, 'Must be number')).not.toThrow()
    expect(() => assert.that('test', is.string, 'Must be string')).not.toThrow()
    expect(() => assert.that([], is.array, 'Must be array')).not.toThrow()
    expect(() => assert.that({}, is.plainObject, 'Must be object')).not.toThrow()
    expect(() => assert.that(true, is.boolean, 'Must be boolean')).not.toThrow()
    expect(() => assert.that(() => {}, is.function, 'Must be function')).not.toThrow()
  })

  it('should validate with is.inRange', () => {
    expect(() => {
      assert.that(5, (v) => is.inRange(v, 0, 10), 'Must be between 0 and 10')
    }).not.toThrow()

    expect(() => {
      assert.that(15, (v) => is.inRange(v, 0, 10), 'Must be between 0 and 10')
    }).toThrow('Must be between 0 and 10')
  })

  it('should validate with negations', () => {
    expect(() => {
      assert.that('hello', (v) => !is.emptyString(v), 'String must not be empty')
    }).not.toThrow()

    expect(() => {
      assert.that('', (v) => !is.emptyString(v), 'String must not be empty')
    }).toThrow('String must not be empty')
  })

  it('should combine multiple is checks', () => {
    expect(() => {
      assert.that(5, (v) => is.number(v) && is.positive(v) && is.integer(v), 'Must be positive integer')
    }).not.toThrow()

    expect(() => {
      assert.that(5.5, (v) => is.number(v) && is.positive(v) && is.integer(v), 'Must be positive integer')
    }).toThrow('Must be positive integer')
  })
})
