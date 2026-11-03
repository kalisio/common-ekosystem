import {
  getDirections,
  getDirectionSymbols,
  getDirectionPattern,
  getNorth,
  getSouth,
  getEast,
  getWest,
  isValidDirection,
  isNorth,
  isSouth,
  isEast,
  isWest,
  getDirectionAxis
} from '../../src/foundation/directions.js'
import { AXES } from '../../src/foundation/axes.js'
import { setLocale } from '../../src/foundation/localization.js'

beforeEach(() => {
  setLocale('en')
})

describe('getDirections', () => {
  it('should return all four directions when called without axis', () => {
    expect(getDirections()).toHaveLength(4)
  })
  it('should return SOUTH and NORTH for latitude axis', () => {
    const result = getDirections(AXES.LATITUDE)
    expect(result).toHaveLength(2)
    expect(result.some(d => d.symbol === 'S')).toBe(true)
    expect(result.some(d => d.symbol === 'N')).toBe(true)
  })
  it('should return EAST and WEST for longitude axis', () => {
    const result = getDirections(AXES.LONGITUDE)
    expect(result).toHaveLength(2)
    expect(result.some(d => d.symbol === 'E')).toBe(true)
    expect(result.some(d => d.symbol === 'W')).toBe(true)
  })
  it('should return an empty array for altitude axis', () => {
    expect(getDirections(AXES.ALTITUDE)).toHaveLength(0)
  })
  it('should throw if axis is not a valid axis', () => {
    expect(() => getDirections('UNKNOWN')).toThrow()
  })
  it('should reflect locale change', () => {
    setLocale('fr')
    const result = getDirections(AXES.LONGITUDE)
    expect(result.some(d => d.symbol === 'O')).toBe(true)
  })
})

describe('getNorth', () => {
  it('should return the NORTH direction object in english', () => {
    expect(getNorth().symbol).toBe('N')
    expect(getNorth().label).toBe('North')
  })
  it('should return the NORTH direction object in french', () => {
    setLocale('fr')
    expect(getNorth().symbol).toBe('N')
    expect(getNorth().label).toBe('Nord')
  })
})

describe('getSouth', () => {
  it('should return the SOUTH direction object in english', () => {
    expect(getSouth().symbol).toBe('S')
    expect(getSouth().label).toBe('South')
  })
  it('should return the SOUTH direction object in french', () => {
    setLocale('fr')
    expect(getSouth().symbol).toBe('S')
    expect(getSouth().label).toBe('Sud')
  })
})

describe('getEast', () => {
  it('should return the EAST direction object in english', () => {
    expect(getEast().symbol).toBe('E')
    expect(getEast().label).toBe('East')
  })
  it('should return the EAST direction object in french', () => {
    setLocale('fr')
    expect(getEast().symbol).toBe('E')
    expect(getEast().label).toBe('Est')
  })
})

describe('getWest', () => {
  it('should return the WEST direction object in english', () => {
    expect(getWest().symbol).toBe('W')
    expect(getWest().label).toBe('West')
  })
  it('should return the WEST direction object in french', () => {
    setLocale('fr')
    expect(getWest().symbol).toBe('O')
    expect(getWest().label).toBe('Ouest')
  })
})

describe('isValidDirection', () => {
  it('should return true for valid symbols', () => {
    expect(isValidDirection('N')).toBe(true)
    expect(isValidDirection('S')).toBe(true)
    expect(isValidDirection('E')).toBe(true)
    expect(isValidDirection('W')).toBe(true)
  })
  it('should return true for valid labels', () => {
    expect(isValidDirection('North')).toBe(true)
    expect(isValidDirection('South')).toBe(true)
    expect(isValidDirection('East')).toBe(true)
    expect(isValidDirection('West')).toBe(true)
  })
  it('should be case insensitive', () => {
    expect(isValidDirection('n')).toBe(true)
    expect(isValidDirection('north')).toBe(true)
    expect(isValidDirection('NORTH')).toBe(true)
  })
  it('should return true for french symbols', () => {
    setLocale('fr')
    expect(isValidDirection('O')).toBe(true)
    expect(isValidDirection('Ouest')).toBe(true)
  })
  it('should still accept W in french locale via the en fallback', () => {
    setLocale('fr')
    expect(isValidDirection('W')).toBe(true)
  })
  it('should return false for an unknown direction', () => {
    expect(isValidDirection('X')).toBe(false)
    expect(isValidDirection('Z')).toBe(false)
  })
  it('should return false if dir is not a string', () => {
    expect(isValidDirection(null)).toBe(false)
    expect(isValidDirection(42)).toBe(false)
    expect(isValidDirection(undefined)).toBe(false)
  })
})

describe('isNorth', () => {
  it('should return true for symbol N', () => {
    expect(isNorth('N')).toBe(true)
  })
  it('should return true for label North', () => {
    expect(isNorth('North')).toBe(true)
  })
  it('should return true for french label Nord', () => {
    setLocale('fr')
    expect(isNorth('Nord')).toBe(true)
  })
  it('should be case insensitive', () => {
    expect(isNorth('n')).toBe(true)
    expect(isNorth('north')).toBe(true)
  })
  it('should return false for other directions', () => {
    expect(isNorth('S')).toBe(false)
    expect(isNorth('E')).toBe(false)
    expect(isNorth('W')).toBe(false)
  })
  it('should return false if dir is not a string', () => {
    expect(isNorth(null)).toBe(false)
  })
})

describe('isSouth', () => {
  it('should return true for symbol S', () => {
    expect(isSouth('S')).toBe(true)
  })
  it('should return true for label South', () => {
    expect(isSouth('South')).toBe(true)
  })
  it('should return true for french label Sud', () => {
    setLocale('fr')
    expect(isSouth('Sud')).toBe(true)
  })
  it('should return false for other directions', () => {
    expect(isSouth('N')).toBe(false)
    expect(isSouth('E')).toBe(false)
    expect(isSouth('W')).toBe(false)
  })
  it('should return false if dir is not a string', () => {
    expect(isSouth(null)).toBe(false)
  })
})

describe('isEast', () => {
  it('should return true for symbol E', () => {
    expect(isEast('E')).toBe(true)
  })
  it('should return true for label East', () => {
    expect(isEast('East')).toBe(true)
  })
  it('should return true for french label Est', () => {
    setLocale('fr')
    expect(isEast('Est')).toBe(true)
  })
  it('should return false for other directions', () => {
    expect(isEast('N')).toBe(false)
    expect(isEast('S')).toBe(false)
    expect(isEast('W')).toBe(false)
  })
  it('should return false if dir is not a string', () => {
    expect(isEast(null)).toBe(false)
  })
})

describe('isWest', () => {
  it('should return true for symbol W', () => {
    expect(isWest('W')).toBe(true)
  })
  it('should return true for label West', () => {
    expect(isWest('West')).toBe(true)
  })
  it('should return true for french symbol O', () => {
    setLocale('fr')
    expect(isWest('O')).toBe(true)
  })
  it('should return true for french label Ouest', () => {
    setLocale('fr')
    expect(isWest('Ouest')).toBe(true)
  })
  it('should still accept W in french locale via the en fallback', () => {
    setLocale('fr')
    expect(isWest('W')).toBe(true)
  })
  it('should return false for other directions', () => {
    expect(isWest('N')).toBe(false)
    expect(isWest('S')).toBe(false)
    expect(isWest('E')).toBe(false)
  })
  it('should return false if dir is not a string', () => {
    expect(isWest(null)).toBe(false)
  })
})

describe('getDirectionAxis', () => {
  it('should return LONGITUDE for E', () => {
    expect(getDirectionAxis('E')).toBe(AXES.LONGITUDE)
  })
  it('should return LONGITUDE for W', () => {
    expect(getDirectionAxis('W')).toBe(AXES.LONGITUDE)
  })
  it('should return LATITUDE for N', () => {
    expect(getDirectionAxis('N')).toBe(AXES.LATITUDE)
  })
  it('should return LATITUDE for S', () => {
    expect(getDirectionAxis('S')).toBe(AXES.LATITUDE)
  })
  it('should return LONGITUDE for East label', () => {
    expect(getDirectionAxis('East')).toBe(AXES.LONGITUDE)
  })
  it('should return LATITUDE for North label', () => {
    expect(getDirectionAxis('North')).toBe(AXES.LATITUDE)
  })
  it('should work with french locale', () => {
    setLocale('fr')
    expect(getDirectionAxis('O')).toBe(AXES.LONGITUDE)
    expect(getDirectionAxis('Nord')).toBe(AXES.LATITUDE)
  })
  it('should throw if dir is not a valid direction', () => {
    expect(() => getDirectionAxis('X')).toThrow()
    expect(() => getDirectionAxis(null)).toThrow()
  })
})

describe('getDirectionSymbols', () => {
  it('should return the symbols of all axes', () => {
    expect(getDirectionSymbols().sort()).toEqual(['E', 'N', 'S', 'W'])
  })
  it('should restrict to the symbols of an axis', () => {
    expect(getDirectionSymbols(AXES.LATITUDE).sort()).toEqual(['N', 'S'])
    expect(getDirectionSymbols(AXES.LONGITUDE).sort()).toEqual(['E', 'W'])
  })
  it('should merge current and fallback locale symbols without duplicates', () => {
    setLocale('fr')
    expect(getDirectionSymbols().sort()).toEqual(['E', 'N', 'O', 'S', 'W'])
  })
  it('should return an empty array for altitude axis', () => {
    expect(getDirectionSymbols(AXES.ALTITUDE)).toEqual([])
  })
  it('should throw if axis is not a valid axis', () => {
    expect(() => getDirectionSymbols('UNKNOWN')).toThrow()
  })
})

describe('getDirectionPattern', () => {
  it('should join the symbols of all axes', () => {
    expect(getDirectionPattern().split('|').sort()).toEqual(['E', 'N', 'S', 'W'])
  })
  it('should restrict to the symbols of an axis', () => {
    expect(getDirectionPattern(AXES.LATITUDE).split('|').sort()).toEqual(['N', 'S'])
    expect(getDirectionPattern(AXES.LONGITUDE).split('|').sort()).toEqual(['E', 'W'])
  })
  it('should include the current and fallback locale symbols', () => {
    setLocale('fr')
    expect(getDirectionPattern(AXES.LONGITUDE).split('|').sort()).toEqual(['E', 'O', 'W'])
  })
  it('should return an empty pattern for altitude axis', () => {
    expect(getDirectionPattern(AXES.ALTITUDE)).toBe('')
  })
  it('should throw if axis is not a valid axis', () => {
    expect(() => getDirectionPattern('UNKNOWN')).toThrow()
  })
})
