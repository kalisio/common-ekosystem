import { describe, it, expect } from 'vitest'
import { quantify } from '../../src/operators'

describe('quantify', () => {
  const unitSystem = new Map([
    ['m', { factor: 1, type: 'length', symbol: 'm', prefixes: 'SHORT' }],
    ['meter', { factor: 1, type: 'length', symbol: 'm', prefixes: 'LONG' }],
    ['g', { factor: 1e-3, type: 'mass', symbol: 'g', prefixes: 'SHORT' }],
    ['gram', { factor: 1e-3, type: 'mass', symbol: 'g', prefixes: 'LONG' }],
    ['s', { factor: 1, type: 'time', symbol: 's', prefixes: 'SHORT' }],
    ['second', { factor: 1, type: 'time', symbol: 's', prefixes: 'LONG' }],
    ['inch', { factor: 0.0254, type: 'length', symbol: 'in' }]
  ])

  describe('creation', () => {
    it('returns value and unit for a direct unit', () => {
      const q = quantify(1, 'meter', unitSystem)
      expect(q.value).toBe(1)
      expect(q.unit).toEqual({ factor: 1, type: 'length', symbol: 'm', scientific: true, prefixes: 'LONG' })
    })

    it('works with value = 0', () => {
      expect(quantify(0, 'meter', unitSystem).value).toBe(0)
    })

    it('works with a negative value', () => {
      expect(quantify(-5, 'meter', unitSystem).value).toBe(-5)
    })

    it('works with a decimal value', () => {
      expect(quantify(1.5, 'meter', unitSystem).value).toBe(1.5)
    })

    it('returns the correct factor for a short prefix (km)', () => {
      expect(quantify(1, 'km', unitSystem).unit.factor).toBe(1000)
    })

    it('returns the correct factor for a long prefix (kilometer)', () => {
      expect(quantify(1, 'kilometer', unitSystem).unit.factor).toBe(1000)
    })

    it('returns the correct factor for milli short (mm)', () => {
      expect(quantify(1, 'mm', unitSystem).unit.factor).toBe(1e-3)
    })

    it('returns the correct factor for milli long (millimeter)', () => {
      expect(quantify(1, 'millimeter', unitSystem).unit.factor).toBe(1e-3)
    })

    it('returns the correct factor for mega short (Mm)', () => {
      expect(quantify(1, 'Mm', unitSystem).unit.factor).toBe(1e6)
    })

    it('returns the correct factor for mega long (megameter)', () => {
      expect(quantify(1, 'megameter', unitSystem).unit.factor).toBe(1e6)
    })

    it('returns the correct symbol for a short prefix (km)', () => {
      expect(quantify(1, 'km', unitSystem).unit.symbol).toBe('km')
    })

    it('returns the correct symbol for a long prefix (kilometer)', () => {
      expect(quantify(1, 'kilometer', unitSystem).unit.symbol).toBe('km')
    })

    it('returns the correct symbol for milli short (mm)', () => {
      expect(quantify(1, 'mm', unitSystem).unit.symbol).toBe('mm')
    })

    it('returns the correct symbol for milli long (millimeter)', () => {
      expect(quantify(1, 'millimeter', unitSystem).unit.symbol).toBe('mm')
    })

    it('returns scientific true for a scientific short prefix (km)', () => {
      expect(quantify(1, 'km', unitSystem).unit.scientific).toBe(true)
    })

    it('returns scientific true for a scientific long prefix (kilometer)', () => {
      expect(quantify(1, 'kilometer', unitSystem).unit.scientific).toBe(true)
    })

    it('returns scientific false for a non-scientific short prefix (hm)', () => {
      expect(quantify(1, 'hm', unitSystem).unit.scientific).toBe(false)
    })

    it('returns scientific false for a non-scientific long prefix (hectometer)', () => {
      expect(quantify(1, 'hectometer', unitSystem).unit.scientific).toBe(false)
    })

    it('preserves the base unit type after short prefix resolution', () => {
      expect(quantify(1, 'km', unitSystem).unit.type).toBe('length')
    })

    it('preserves the base unit type after long prefix resolution', () => {
      expect(quantify(1, 'kilometer', unitSystem).unit.type).toBe('length')
    })

    it('throws if value is not a number', () => {
      expect(() => quantify('1', 'meter', unitSystem)).toThrow('value must be a number')
    })

    it('throws if value is null', () => {
      expect(() => quantify(null, 'meter', unitSystem)).toThrow('value must be a number')
    })

    it('throws if value is undefined', () => {
      expect(() => quantify(undefined, 'meter', unitSystem)).toThrow('value must be a number')
    })

    it('throws if value is a boolean', () => {
      expect(() => quantify(true, 'meter', unitSystem)).toThrow('value must be a number')
    })

    it('throws if unitCode is an empty string', () => {
      expect(() => quantify(1, '', unitSystem)).toThrow('unitCode must be a non empty string')
    })

    it('throws if unitCode is null', () => {
      expect(() => quantify(1, null, unitSystem)).toThrow('unitCode must be a non empty string')
    })

    it('throws if unitSystem is an empty Map', () => {
      expect(() => quantify(1, 'meter', new Map())).toThrow('unitSystem must be a non empty map')
    })

    it('throws if unitSystem is not a Map', () => {
      expect(() => quantify(1, 'meter', {})).toThrow('unitSystem must be a non empty map')
    })

    it('throws if the unit is unknown', () => {
      expect(() => quantify(1, 'foo', unitSystem)).toThrow('Unknown unit: foo')
    })

    it('throws if the prefix is valid but the base unit is unknown', () => {
      expect(() => quantify(1, 'kilobar', unitSystem)).toThrow('Unknown unit: kilobar')
    })
  })

  describe('to', () => {
    it('converts between two direct units', () => {
      expect(quantify(1, 'meter', unitSystem).to('inch').value).toBeCloseTo(39.37, 2)
    })

    it('returns 1 when converting a unit to itself', () => {
      expect(quantify(1, 'meter', unitSystem).to('meter').value).toBe(1)
    })

    it('returns 1 when converting a prefixed unit to itself', () => {
      expect(quantify(1, 'km', unitSystem).to('km').value).toBe(1)
    })

    it('converts with a short prefix on source (km → meter)', () => {
      expect(quantify(1, 'km', unitSystem).to('meter').value).toBeCloseTo(1000, 5)
    })

    it('converts with a long prefix on source (kilometer → meter)', () => {
      expect(quantify(1, 'kilometer', unitSystem).to('meter').value).toBeCloseTo(1000, 5)
    })

    it('converts with a short prefix on destination (meter → km)', () => {
      expect(quantify(1000, 'meter', unitSystem).to('km').value).toBeCloseTo(1, 5)
    })

    it('converts with a long prefix on destination (meter → kilometer)', () => {
      expect(quantify(1000, 'meter', unitSystem).to('kilometer').value).toBeCloseTo(1, 5)
    })

    it('converts short → short (km → mm)', () => {
      expect(quantify(1, 'km', unitSystem).to('mm').value).toBeCloseTo(1e6, 0)
    })

    it('converts long → long (kilometer → millimeter)', () => {
      expect(quantify(1, 'kilometer', unitSystem).to('millimeter').value).toBeCloseTo(1e6, 0)
    })

    it('converts long → short (kilometer → mm)', () => {
      expect(quantify(1, 'kilometer', unitSystem).to('mm').value).toBeCloseTo(1e6, 0)
    })

    it('converts short → long (km → millimeter)', () => {
      expect(quantify(1, 'km', unitSystem).to('millimeter').value).toBeCloseTo(1e6, 0)
    })

    it('converts kilogram → gram', () => {
      expect(quantify(1, 'kg', unitSystem).to('g').value).toBeCloseTo(1000, 5)
    })

    it('works with value = 0', () => {
      expect(quantify(0, 'km', unitSystem).to('meter').value).toBe(0)
    })

    it('works with a negative value', () => {
      expect(quantify(-1, 'km', unitSystem).to('meter').value).toBeCloseTo(-1000, 5)
    })

    it('returns a chainable quantify object', () => {
      expect(quantify(1000, 'meter', unitSystem).to('km').to('meter').value).toBeCloseTo(1000, 5)
    })

    it('throws if dstUnitCode is an empty string', () => {
      expect(() => quantify(1, 'meter', unitSystem).to('')).toThrow('dstUnitCode must be a non empty string')
    })

    it('throws if dstUnitCode is null', () => {
      expect(() => quantify(1, 'meter', unitSystem).to(null)).toThrow('dstUnitCode must be a non empty string')
    })

    it('throws if the destination unit is unknown', () => {
      expect(() => quantify(1, 'meter', unitSystem).to('foo')).toThrow('Unknown unit: foo')
    })

    it('throws if unit types are incompatible', () => {
      expect(() => quantify(1, 'meter', unitSystem).to('gram')).toThrow('Incompatible unit types: "length" → "mass"')
    })

    it('throws if unit types are incompatible with prefixes', () => {
      expect(() => quantify(1, 'km', unitSystem).to('kg')).toThrow('Incompatible unit types: "length" → "mass"')
    })

    it('throws if unit types are incompatible between prefixed and unprefixed', () => {
      expect(() => quantify(1, 'km', unitSystem).to('gram')).toThrow('Incompatible unit types: "length" → "mass"')
    })
  })

  describe('toString', () => {
    it('formats a scientific unit with 2 decimals by default', () => {
      expect(quantify(1000, 'meter', unitSystem).toString()).toBe('1.00e+3 m')
    })

    it('formats a scientific unit with given decimals', () => {
      expect(quantify(1000, 'meter', unitSystem).toString(4)).toBe('1.0000e+3 m')
    })

    it('formats a non-scientific unit with 2 decimals by default', () => {
      expect(quantify(1.23456, 'hectometer', unitSystem).toString()).toBe('1.23 hm')
    })

    it('formats a non-scientific unit with given decimals', () => {
      expect(quantify(1.23456, 'hectometer', unitSystem).toString(4)).toBe('1.2346 hm')
    })

    it('uses short symbol when long prefix used as input (hectometer → hm)', () => {
      expect(quantify(1.51, 'hectometer', unitSystem).toString()).toBe('1.51 hm')
    })

    it('uses short symbol when long prefix used as input (kilometer → km)', () => {
      expect(quantify(1.5, 'km', unitSystem).toString()).toBe('1.50e+0 km')
    })

    it('formats a negative non-scientific value', () => {
      expect(quantify(-1.23456, 'hectometer', unitSystem).toString()).toBe('-1.23 hm')
    })

    it('formats a negative scientific value', () => {
      expect(quantify(-1000, 'meter', unitSystem).toString()).toBe('-1.00e+3 m')
    })

    it('formats zero for a scientific unit', () => {
      expect(quantify(0, 'meter', unitSystem).toString()).toBe('0.00e+0 m')
    })

    it('throws if decimals is not a positive integer', () => {
      expect(() => quantify(1000, 'meter', unitSystem).toString(-1)).toThrow('decimals must be a non-negative integer')
    })
  })
})
