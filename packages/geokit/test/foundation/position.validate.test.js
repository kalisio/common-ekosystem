import { describe, it, expect } from 'vitest'
import { validatePosition } from '../../src/foundation'

const valid = (result) => expect(result.valid).toBe(true)
const invalid = (result) => expect(result.valid).toBe(false)
const hasError = (result, msg) => expect(result.errors.some(e => e.message.includes(msg))).toBe(true)
const hasWarning = (result, msg) => expect(result.warnings.some(w => w.message.includes(msg))).toBe(true)
const noWarnings = (result) => expect(result.warnings).toHaveLength(0)
const noErrors = (result) => expect(result.errors).toHaveLength(0)

describe('validatePosition — valid positions', () => {
  it('accepts a valid 2D position', () => {
    valid(validatePosition([2.3522, 48.8566]))
  })
  it('accepts a valid 3D position', () => {
    valid(validatePosition([2.3522, 48.8566, 100]))
  })
  it('accepts longitude at boundary -180', () => {
    valid(validatePosition([-180, 0]))
  })
  it('accepts longitude at boundary 180', () => {
    valid(validatePosition([180, 0]))
  })
  it('accepts latitude at boundary -90', () => {
    valid(validatePosition([0, -90]))
  })
  it('accepts latitude at boundary 90', () => {
    valid(validatePosition([0, 90]))
  })
  it('accepts zero coordinates', () => {
    valid(validatePosition([0, 0]))
  })
  it('accepts negative altitude', () => {
    valid(validatePosition([0, 0, -100]))
  })
  it('accepts zero altitude', () => {
    valid(validatePosition([0, 0, 0]))
  })
  it('has no errors on valid position', () => {
    noErrors(validatePosition([2.3522, 48.8566]))
  })
  it('has no warnings on normal precision', () => {
    noWarnings(validatePosition([2.3522, 48.8566]))
  })
})

describe('validatePosition — invalid input', () => {
  it('rejects null', () => {
    invalid(validatePosition(null))
  })
  it('rejects undefined', () => {
    invalid(validatePosition(undefined))
  })
  it('rejects a string', () => {
    invalid(validatePosition('0,0'))
  })
  it('rejects a number', () => {
    invalid(validatePosition(42))
  })
  it('rejects an empty array', () => {
    invalid(validatePosition([]))
  })
  it('rejects an array with 1 element', () => {
    const r = validatePosition([2.3522])
    invalid(r)
    hasError(r, 'array of 2 or 3')
  })
  it('rejects an array with 4 elements', () => {
    const r = validatePosition([2.3522, 48.8566, 100, 99])
    invalid(r)
    hasError(r, 'array of 2 or 3')
  })
})

describe('validatePosition — longitude', () => {
  it('rejects longitude > 180', () => {
    const r = validatePosition([181, 0])
    invalid(r)
    hasError(r, 'longitude')
  })
  it('rejects longitude < -180', () => {
    const r = validatePosition([-181, 0])
    invalid(r)
    hasError(r, 'longitude')
  })
  it('rejects non-number longitude', () => {
    invalid(validatePosition(['48', 0]))
  })
  it('rejects NaN longitude', () => {
    invalid(validatePosition([NaN, 0]))
  })
})

describe('validatePosition — latitude', () => {
  it('rejects latitude > 90', () => {
    const r = validatePosition([0, 91])
    invalid(r)
    hasError(r, 'latitude')
  })
  it('rejects latitude < -90', () => {
    const r = validatePosition([0, -91])
    invalid(r)
    hasError(r, 'latitude')
  })
  it('rejects non-number latitude', () => {
    invalid(validatePosition([0, '48']))
  })
  it('rejects NaN latitude', () => {
    invalid(validatePosition([0, NaN]))
  })
})

describe('validatePosition — altitude', () => {
  it('rejects non-number altitude', () => {
    const r = validatePosition([0, 0, 'high'])
    invalid(r)
    hasError(r, 'altitude')
  })
  it('rejects NaN altitude', () => {
    const r = validatePosition([0, 0, NaN])
    invalid(r)
    hasError(r, 'altitude')
  })
})

describe('validatePosition — precision warnings', () => {
  it('warns on longitude precision > 6', () => {
    const r = validatePosition([2.35220001234, 48.8566])
    valid(r)
    hasWarning(r, 'longitude precision is high')
  })
  it('warns on latitude precision > 6', () => {
    const r = validatePosition([2.3522, 48.85660001234])
    valid(r)
    hasWarning(r, 'latitude precision is high')
  })
  it('warns on both longitude and latitude precision > 6', () => {
    const r = validatePosition([2.35220001234, 48.85660001234])
    valid(r)
    expect(r.warnings).toHaveLength(2)
  })
  it('does not warn on precision exactly 6', () => {
    noWarnings(validatePosition([2.352200, 48.856600]))
  })
  it('does not warn on precision < 6', () => {
    noWarnings(validatePosition([2.352, 48.856]))
  })
  it('includes decimal count in warning message', () => {
    hasWarning(validatePosition([2.35220001234, 48.8566]), 'decimals')
  })
})
