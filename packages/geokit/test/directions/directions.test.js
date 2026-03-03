import { describe, it, beforeEach, expect } from 'vitest'
import { setLocale } from '../../src/locale'
import {
  isNorthDirection,
  isSouthDirection,
  isEastDirection,
  isWestDirection,
  isDirection
} from '../../src/directions'

describe('direction helpers', () => {
  describe('with english locale', () => {
    beforeEach(() => {
      // Ensure english locale is active
      setLocale('en')
    })

    it('should validate north direction (label + symbol)', () => {
      expect(isNorthDirection('North')).toBe(true)
      expect(isNorthDirection('north')).toBe(true)
      expect(isNorthDirection('N')).toBe(true)
    })

    it('should validate other directions', () => {
      expect(isSouthDirection('South')).toBe(true)
      expect(isEastDirection('E')).toBe(true)
      expect(isWestDirection('W')).toBe(true)
    })

    it('should validate using generic isDirection', () => {
      expect(isDirection('N')).toBe(true)
      expect(isDirection('S')).toBe(true)
      expect(isDirection('E')).toBe(true)
      expect(isDirection('W')).toBe(true)
    })

    it('should return false for invalid values', () => {
      expect(isDirection('Nord')).toBe(false)
      expect(isDirection('O')).toBe(false) // French west symbol
      expect(isNorthDirection('South')).toBe(false)
    })
  })

  describe('with french locale', () => {
    beforeEach(() => {
      // Switch to french locale
      setLocale('fr')
    })

    it('should validate french labels and symbols', () => {
      expect(isNorthDirection('Nord')).toBe(true)
      expect(isNorthDirection('nord')).toBe(true)
      expect(isWestDirection('O')).toBe(true)
      expect(isEastDirection('Est')).toBe(true)
    })

    it('should reject english values in french locale', () => {
      expect(isDirection('North')).toBe(false)
      expect(isDirection('W')).toBe(false)
    })
  })

  describe('input validation', () => {
    beforeEach(() => {
      setLocale('en')
    })

    it('should throw if dir is not a string', () => {
      expect(() => isDirection(null)).toThrow('dir must be a string')
      expect(() => isNorthDirection(123)).toThrow('dir must be a string')
      expect(() => isSouthDirection({})).toThrow('dir must be a string')
    })
  })

  describe('case normalization', () => {
    beforeEach(() => {
      setLocale('en')
    })
    it('should be case insensitive', () => {
      expect(isDirection('north')).toBe(true)
      expect(isDirection('NORTH')).toBe(true)
      expect(isDirection('NoRtH')).toBe(true)
    })
  })
})
