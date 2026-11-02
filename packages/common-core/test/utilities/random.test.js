import { random } from '../../src/utilities/index.js'

const LETTER = /^[a-zA-Z]$/
const DIGIT = /^[0-9]$/
const SPECIAL = /^[^a-zA-Z0-9]$/

function expectPassword (password, length, digits, specials) {
  expect(typeof password).toBe('string')
  expect(password).toHaveLength(length)
  expect(password).toMatch(/^[!-~]+$/)
  const chars = [...password]
  expect(chars.filter(char => LETTER.test(char))).toHaveLength(length - digits - specials)
  expect(chars.filter(char => DIGIT.test(char))).toHaveLength(digits)
  expect(chars.filter(char => SPECIAL.test(char))).toHaveLength(specials)
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('random.integer', () => {
  it('maps Math.random 0 to min and near-1 to max (inclusive bounds)', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    expect(random.integer(1, 6)).toBe(1)
    vi.spyOn(Math, 'random').mockReturnValue(0.999999)
    expect(random.integer(1, 6)).toBe(6)
  })
  it('always returns an integer within [min, max]', () => {
    for (let i = 0; i < 1000; i++) {
      const value = random.integer(-3, 7)
      expect(Number.isInteger(value)).toBe(true)
      expect(value).toBeGreaterThanOrEqual(-3)
      expect(value).toBeLessThanOrEqual(7)
    }
  })
  it('supports min === max', () => {
    expect(random.integer(5, 5)).toBe(5)
  })
  it('throws on non-integer bounds', () => {
    expect(() => random.integer(1.5, 6)).toThrow()
    expect(() => random.integer(1, 6.2)).toThrow()
  })
  it('throws when max is less than min', () => {
    expect(() => random.integer(10, 1)).toThrow('max must be greater than or equal to min')
  })
})

describe('random.number', () => {
  it('maps Math.random 0 to min', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    expect(random.number(2, 10)).toBe(2)
  })
  it('always returns a value within [min, max)', () => {
    for (let i = 0; i < 1000; i++) {
      const value = random.number(0, 1)
      expect(value).toBeGreaterThanOrEqual(0)
      expect(value).toBeLessThan(1)
    }
  })
  it('supports min === max', () => {
    expect(random.number(5, 5)).toBe(5)
  })
  it('throws on non-number bounds', () => {
    expect(() => random.number('a', 10)).toThrow()
    expect(() => random.number(1, '10')).toThrow()
  })
  it('throws when max is less than min', () => {
    expect(() => random.number(10, 1)).toThrow('max must be greater than or equal to min')
  })
})

describe('random.choice', () => {
  it('returns the element at the computed index', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    expect(random.choice(['a', 'b', 'c'])).toBe('a')
    vi.spyOn(Math, 'random').mockReturnValue(0.999999)
    expect(random.choice(['a', 'b', 'c'])).toBe('c')
  })
  it('only ever returns an element of the array', () => {
    const array = [10, 20, 30, 40]
    for (let i = 0; i < 1000; i++) {
      expect(array).toContain(random.choice(array))
    }
  })
  it('throws on an empty array', () => {
    expect(() => random.choice([])).toThrow()
  })
})

describe('random.sample', () => {
  it('calls the generator exactly count times', () => {
    const generator = vi.fn(() => 1)
    random.sample(generator, 5)
    expect(generator).toHaveBeenCalledTimes(5)
  })
  it('returns an array of the requested length', () => {
    const result = random.sample(() => random.integer(1, 6), 10)
    expect(result).toHaveLength(10)
  })
  it('returns an empty array for count 0', () => {
    expect(random.sample(() => 1, 0)).toEqual([])
  })
  it('composes with choice', () => {
    const result = random.sample(() => random.choice(['x', 'y']), 20)
    expect(result.every((v) => v === 'x' || v === 'y')).toBe(true)
  })
  it('throws on a non-function generator', () => {
    expect(() => random.sample(42, 3)).toThrow()
  })
  it('throws on a negative count', () => {
    expect(() => random.sample(() => 1, -1)).toThrow()
  })
})

describe('random.shuffle', () => {
  it('returns a permutation with the same elements', () => {
    const input = [1, 2, 3, 4, 5]
    const result = random.shuffle(input)
    expect([...result].sort((a, b) => a - b)).toEqual(input)
  })
  it('does not mutate the input', () => {
    const input = [1, 2, 3, 4, 5]
    random.shuffle(input)
    expect(input).toEqual([1, 2, 3, 4, 5])
  })
  it('handles an empty array', () => {
    expect(random.shuffle([])).toEqual([])
  })
  it('produces a deterministic order for a fixed Math.random', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    expect(random.shuffle([1, 2, 3])).toEqual([2, 3, 1])
  })
  it('throws on a non-array', () => {
    expect(() => random.shuffle('abc')).toThrow()
  })
})

describe('random.password', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('generation', () => {
    it('generates a password with default options', () => {
      expectPassword(random.password(), 12, 1, 1)
    })
    it('generates a password with empty options', () => {
      expectPassword(random.password({}), 12, 1, 1)
    })
    it('generates a password with custom options', () => {
      expectPassword(random.password({ length: 20, digits: 4, specials: 3 }), 20, 4, 3)
    })
    it('supports a custom length only', () => {
      expectPassword(random.password({ length: 24 }), 24, 1, 1)
    })
    it('supports a custom digit count only', () => {
      expectPassword(random.password({ digits: 4 }), 12, 4, 1)
    })
    it('supports a custom special count only', () => {
      expectPassword(random.password({ specials: 4 }), 12, 1, 4)
    })
    it('uses defaults for explicitly undefined options', () => {
      expectPassword(random.password({
        length: undefined,
        digits: undefined,
        specials: undefined
      }), 12, 1, 1)
    })
    it('generates a password containing letters only', () => {
      expectPassword(random.password({ length: 16, digits: 0, specials: 0 }), 16, 0, 0)
    })
    it('generates a password containing digits only', () => {
      expectPassword(random.password({ length: 16, digits: 16, specials: 0 }), 16, 16, 0)
    })
    it('generates a password containing specials only', () => {
      expectPassword(random.password({ length: 16, digits: 0, specials: 16 }), 16, 0, 16)
    })
    it('generates a password without letters', () => {
      expectPassword(random.password({ length: 12, digits: 6, specials: 6 }), 12, 6, 6)
    })
    it('supports the minimum password length', () => {
      expectPassword(random.password({ length: 1, digits: 0, specials: 0 }), 1, 0, 0)
    })
    it('supports a single digit', () => {
      expectPassword(random.password({ length: 1, digits: 1, specials: 0 }), 1, 1, 0)
    })
    it('supports a single special character', () => {
      expectPassword(random.password({ length: 1, digits: 0, specials: 1 }), 1, 0, 1)
    })
    it('supports a password with no remaining letters', () => {
      expectPassword(random.password({ length: 2, digits: 1, specials: 1 }), 2, 1, 1)
    })
    it('supports large passwords', () => {
      expectPassword(random.password({ length: 1024, digits: 256, specials: 256 }), 1024, 256, 256)
    })
    it('does not mutate the supplied options', () => {
      const options = Object.freeze({ length: 16, digits: 3, specials: 2 })
      expectPassword(random.password(options), 16, 3, 2)
      expect(options).toEqual({ length: 16, digits: 3, specials: 2 })
    })
    it('ignores unknown options', () => {
      expectPassword(random.password({
        length: 16,
        digits: 2,
        specials: 2,
        unknown: true
      }), 16, 2, 2)
    })
  })

  describe('validation', () => {
    it.each([
      ['null', null],
      ['number', 42],
      ['string', 'password'],
      ['array', []],
      ['date', new Date()],
      ['function', () => {}]
    ])('rejects %s options', (name, options) => {
      expect(() => random.password(options)).toThrow()
    })
    it.each([
      0,
      -1,
      1.5,
      '12',
      null,
      true,
      NaN,
      Infinity,
      -Infinity
    ])('rejects invalid length %s', (length) => {
      expect(() => random.password({ length })).toThrow()
    })
    it.each([
      -1,
      1.5,
      '2',
      null,
      false,
      NaN,
      Infinity,
      -Infinity
    ])('rejects invalid digits %s', (digits) => {
      expect(() => random.password({ digits })).toThrow()
    })
    it.each([
      -1,
      1.5,
      '2',
      null,
      false,
      NaN,
      Infinity,
      -Infinity
    ])('rejects invalid specials %s', (specials) => {
      expect(() => random.password({ specials })).toThrow()
    })
    it('rejects a length smaller than the default required characters', () => {
      expect(() => random.password({ length: 1 })).toThrow()
    })
    it('rejects a length smaller than digits plus specials', () => {
      expect(() => random.password({ length: 4, digits: 3, specials: 2 })).toThrow()
    })
    it('rejects a digit count greater than the length', () => {
      expect(() => random.password({ length: 8, digits: 9, specials: 0 })).toThrow()
    })
    it('rejects a special count greater than the length', () => {
      expect(() => random.password({ length: 8, digits: 0, specials: 9 })).toThrow()
    })
    it('accepts a length equal to digits plus specials', () => {
      expectPassword(random.password({ length: 8, digits: 4, specials: 4 }), 8, 4, 4)
    })
  })

  describe('character sets', () => {
    it('only generates printable ASCII characters excluding space', () => {
      const password = random.password({ length: 256, digits: 64, specials: 64 })
      expect(password).toMatch(/^[\x21-\x7E]+$/)
      expect(password).not.toContain(' ')
    })
    it('only generates ASCII letters when digits and specials are disabled', () => {
      const password = random.password({ length: 128, digits: 0, specials: 0 })
      expect(password).toMatch(/^[a-zA-Z]+$/)
    })
    it('only generates ASCII digits when letters and specials are disabled', () => {
      const password = random.password({ length: 128, digits: 128, specials: 0 })
      expect(password).toMatch(/^[0-9]+$/)
    })
    it('only generates ASCII specials when letters and digits are disabled', () => {
      const password = random.password({ length: 128, digits: 0, specials: 128 })
      expect(password).toMatch(/^[\x21-\x7E]+$/)
      expect(password).not.toMatch(/[a-zA-Z0-9]/)
    })
    it('supports all 32 ASCII special characters', () => {
      const values = Array.from({ length: 32 }, (_, index) => index)
      vi.spyOn(globalThis.crypto, 'getRandomValues').mockImplementation((buffer) => {
        buffer[0] = values.shift() ?? 0
        return buffer
      })
      const password = random.password({ length: 32, digits: 0, specials: 32 })
      const expected = Array.from({ length: 94 }, (_, index) => String.fromCharCode(index + 33))
        .filter(char => SPECIAL.test(char))
      expect(new Set(password)).toEqual(new Set(expected))
      expect(new Set(password).size).toBe(32)
    })
    it('allows repeated characters', () => {
      vi.spyOn(globalThis.crypto, 'getRandomValues').mockImplementation((buffer) => {
        buffer[0] = 0
        return buffer
      })
      expect(random.password({ length: 8, digits: 0, specials: 0 })).toBe('AAAAAAAA')
    })
  })

  describe('cryptographic randomness', () => {
    it('uses crypto.getRandomValues instead of Math.random', () => {
      const cryptoSpy = vi.spyOn(globalThis.crypto, 'getRandomValues')
      const mathSpy = vi.spyOn(Math, 'random').mockImplementation(() => {
        throw new Error('Math.random must not be used')
      })
      expectPassword(random.password({ length: 16, digits: 2, specials: 2 }), 16, 2, 2)
      expect(cryptoSpy).toHaveBeenCalled()
      expect(mathSpy).not.toHaveBeenCalled()
    })
    it('requests 32-bit unsigned random values', () => {
      const spy = vi.spyOn(globalThis.crypto, 'getRandomValues').mockImplementation((buffer) => {
        expect(buffer).toBeInstanceOf(Uint32Array)
        expect(buffer).toHaveLength(1)
        buffer[0] = 0
        return buffer
      })
      expect(random.password({ length: 1, digits: 1, specials: 0 })).toBe('0')
      expect(spy).toHaveBeenCalledTimes(1)
    })
    it.each([
      ['first digit', { length: 1, digits: 1, specials: 0 }, 0, '0'],
      ['last digit', { length: 1, digits: 1, specials: 0 }, 9, '9'],
      ['first letter', { length: 1, digits: 0, specials: 0 }, 0, 'A'],
      ['last letter', { length: 1, digits: 0, specials: 0 }, 51, 'z'],
      ['first special', { length: 1, digits: 0, specials: 1 }, 0, '!'],
      ['last special', { length: 1, digits: 0, specials: 1 }, 31, '~']
    ])('selects the %s correctly', (name, options, index, expected) => {
      const spy = vi.spyOn(globalThis.crypto, 'getRandomValues').mockImplementation((buffer) => {
        buffer[0] = index
        return buffer
      })
      expect(random.password(options)).toBe(expected)
      expect(spy).toHaveBeenCalledTimes(1)
    })
    it('rejects out-of-range random values to avoid modulo bias', () => {
      const values = [0xFFFFFFFF, 7]
      const spy = vi.spyOn(globalThis.crypto, 'getRandomValues').mockImplementation((buffer) => {
        buffer[0] = values.shift()
        return buffer
      })
      expect(random.password({ length: 1, digits: 1, specials: 0 })).toBe('7')
      expect(spy).toHaveBeenCalledTimes(2)
      expect(values).toEqual([])
    })
    it('accepts the maximum unsigned 32-bit value when the charset size divides 2^32', () => {
      const spy = vi.spyOn(globalThis.crypto, 'getRandomValues').mockImplementation((buffer) => {
        buffer[0] = 0xFFFFFFFF
        return buffer
      })
      // The special charset contains 32 characters
      expect(random.password({ length: 1, digits: 0, specials: 1 })).toBe('~')
      expect(spy).toHaveBeenCalledTimes(1)
    })
    it('uses secure Fisher-Yates shuffle', () => {
      const values = [0, 9, 1, 0, 51, 0, 0, 0, 0]
      const spy = vi.spyOn(globalThis.crypto, 'getRandomValues').mockImplementation((buffer) => {
        if (!values.length) throw new Error('Unexpected random draw')
        buffer[0] = values.shift()
        return buffer
      })
      // Initial characters: 0, 9, ", A, z
      // Shuffling with index 0 at each step produces: 9, ", A, z, 0
      expect(random.password({ length: 5, digits: 2, specials: 1 })).toBe('9"Az0')
      // 5 character draws + 4 Fisher-Yates draws
      expect(spy).toHaveBeenCalledTimes(9)
      expect(values).toEqual([])
    })
    it('applies rejection sampling during the shuffle', () => {
      const values = [0, 1, 2, 0xFFFFFFFF, 0, 0]
      const spy = vi.spyOn(globalThis.crypto, 'getRandomValues').mockImplementation((buffer) => {
        if (!values.length) throw new Error('Unexpected random draw')
        buffer[0] = values.shift()
        return buffer
      })
      // Initial characters: A, B, C
      // The first shuffle draw is rejected for size 3
      expect(random.password({ length: 3, digits: 0, specials: 0 })).toBe('BCA')
      expect(spy).toHaveBeenCalledTimes(6)
      expect(values).toEqual([])
    })
  })
})
