import { describe, it, expect, beforeEach } from 'vitest'
import {
  truncateCoordinate,
  normalizeCoordinate,
  guessCoordinateAxis,
  convertCoordinate,
  parseCoordinate,
  COORDINATE_FORMATS,
  COORDINATE_MODELS
} from '../../src/core/coordinate.js'
import { AXES } from '../../src/core/axes.js'
import { setLocale } from '../../src/core/locale.js'

const { DD, DDM, DMS /*, /*DDM_AERO: DDMAero */ } = COORDINATE_MODELS

beforeEach(() => {
  setLocale('en')
})

describe('truncateCoordinate', () => {
  it('should throw if coord is not a number', () => {
    expect(() => truncateCoordinate('48', 2)).toThrow()
    expect(() => truncateCoordinate(null, 2)).toThrow()
  })

  it('should throw if precision is out of range', () => {
    expect(() => truncateCoordinate(48.8566, -1)).toThrow()
    expect(() => truncateCoordinate(48.8566, 9)).toThrow()
  })

  it('should truncate to 0 decimal places', () => {
    expect(truncateCoordinate(48.8566, 0)).toBe(49)
  })

  it('should truncate to 2 decimal places', () => {
    expect(truncateCoordinate(48.8566, 2)).toBe(48.86)
  })

  it('should truncate to 4 decimal places', () => {
    expect(truncateCoordinate(48.8566, 4)).toBe(48.8566)
  })

  it('should truncate a negative value', () => {
    expect(truncateCoordinate(-48.8566, 2)).toBe(-48.86)
  })

  it('should truncate 0', () => {
    expect(truncateCoordinate(0, 2)).toBe(0)
  })

  it('should accept precision 8', () => {
    expect(truncateCoordinate(48.12345678, 8)).toBe(48.12345678)
  })
})

describe('normalizeCoordinate', () => {
  it('should throw if coord is not a number', () => {
    expect(() => normalizeCoordinate('48', AXES.LATITUDE)).toThrow()
    expect(() => normalizeCoordinate(null, AXES.LATITUDE)).toThrow()
  })

  it('should throw if axis is not latitude or longitude', () => {
    expect(() => normalizeCoordinate(48, AXES.ALTITUDE)).toThrow()
    expect(() => normalizeCoordinate(48, 'UNKNOWN')).toThrow()
  })

  it('should clamp latitude above 90', () => {
    expect(normalizeCoordinate(91, AXES.LATITUDE)).toBe(90)
  })

  it('should clamp latitude below -90', () => {
    expect(normalizeCoordinate(-91, AXES.LATITUDE)).toBe(-90)
  })

  it('should keep latitude within range', () => {
    expect(normalizeCoordinate(48.8566, AXES.LATITUDE)).toBe(48.8566)
    expect(normalizeCoordinate(-48.8566, AXES.LATITUDE)).toBe(-48.8566)
  })

  it('should keep latitude at boundaries', () => {
    expect(normalizeCoordinate(90, AXES.LATITUDE)).toBe(90)
    expect(normalizeCoordinate(-90, AXES.LATITUDE)).toBe(-90)
  })

  it('should wrap longitude above 180', () => {
    expect(normalizeCoordinate(181, AXES.LONGITUDE)).toBe(-179)
  })

  it('should wrap longitude below -180', () => {
    expect(normalizeCoordinate(-181, AXES.LONGITUDE)).toBe(179)
  })

  it('should keep longitude within range', () => {
    expect(normalizeCoordinate(2.3522, AXES.LONGITUDE)).toBeCloseTo(2.3522)
    expect(normalizeCoordinate(-2.3522, AXES.LONGITUDE)).toBeCloseTo(-2.3522)
  })

  it('should normalize -180 to 180', () => {
    expect(normalizeCoordinate(-180, AXES.LONGITUDE)).toBe(180)
  })

  it('should normalize 360 to 0', () => {
    expect(normalizeCoordinate(360, AXES.LONGITUDE)).toBe(0)
  })

  it('should normalize -0 to 0', () => {
    expect(normalizeCoordinate(-0, AXES.LONGITUDE)).toBe(0)
  })
})

describe('guessCoordinateAxis', () => {
  it('should throw if coord is not a number', () => {
    expect(() => guessCoordinateAxis('48')).toThrow()
    expect(() => guessCoordinateAxis(null)).toThrow()
  })

  it('should throw if dir is not a valid direction', () => {
    expect(() => guessCoordinateAxis(48, 'X')).toThrow()
  })

  it('should return LONGITUDE for E direction', () => {
    expect(guessCoordinateAxis(48, 'E')).toBe(AXES.LONGITUDE)
  })

  it('should return LONGITUDE for W direction', () => {
    expect(guessCoordinateAxis(48, 'W')).toBe(AXES.LONGITUDE)
  })

  it('should return LATITUDE for N direction', () => {
    expect(guessCoordinateAxis(48, 'N')).toBe(AXES.LATITUDE)
  })

  it('should return LATITUDE for S direction', () => {
    expect(guessCoordinateAxis(48, 'S')).toBe(AXES.LATITUDE)
  })

  it('should return LONGITUDE if coord is out of latitude range', () => {
    expect(guessCoordinateAxis(91)).toBe(AXES.LONGITUDE)
    expect(guessCoordinateAxis(-91)).toBe(AXES.LONGITUDE)
  })

  it('should return undefined if coord is ambiguous', () => {
    const result = guessCoordinateAxis(45)
    expect(result).toBeUndefined()
  })

  it('should return both for 0', () => {
    const result = guessCoordinateAxis(0)
    expect(result).toBeUndefined()
  })

  it('should return both for 90', () => {
    const result = guessCoordinateAxis(90)
    expect(result).toBeUndefined()
  })

  it('should work with french locale directions', () => {
    setLocale('fr')
    expect(guessCoordinateAxis(48, 'O')).toBe(AXES.LONGITUDE)
    expect(guessCoordinateAxis(48, 'Nord')).toBe(AXES.LATITUDE)
  })
})

describe('convertCoordinate', () => {
  it('should throw if from is not valid', () => {
    expect(() => convertCoordinate({ isValid: () => false }, 'DD')).toThrow()
  })

  it('should throw if target format is unknown', () => {
    const dd = DD({ degrees: 48.8566, direction: 'N' })
    expect(() => convertCoordinate(dd, 'UNKNOWN')).toThrow()
  })

  it('should return the same DD if format is already DD', () => {
    const dd = DD({ degrees: 48.5, direction: 'N' })
    const result = convertCoordinate(dd, 'DD')
    expect(result).toBe(dd)
  })

  it('should convert DD to DDM', () => {
    const dd = DD({ degrees: 48.5, direction: 'N' })
    const ddm = convertCoordinate(dd, 'DDM')
    expect(ddm.isValid()).toBe(true)
    expect(ddm.degrees).toBe(48)
    expect(ddm.minutes).toBeCloseTo(30)
    expect(ddm.direction).toBe('N')
  })

  it('should convert DD to DMS', () => {
    const dd = DD({ degrees: 48.5, direction: 'N' })
    const dms = convertCoordinate(dd, 'DMS')
    expect(dms.isValid()).toBe(true)
    expect(dms.degrees).toBe(48)
    expect(dms.minutes).toBe(30)
    expect(dms.seconds).toBeCloseTo(0)
    expect(dms.direction).toBe('N')
  })

  it('should convert DDM to DD', () => {
    const ddm = DDM({ degrees: 48, minutes: 30, direction: 'N' })
    const dd = convertCoordinate(ddm, 'DD')
    expect(dd.isValid()).toBe(true)
    expect(dd.degrees).toBeCloseTo(48.5)
    expect(dd.direction).toBe('N')
  })

  it('should convert DMS to DDM', () => {
    const dms = DMS({ degrees: 48, minutes: 30, seconds: 0, direction: 'N' })
    const ddm = convertCoordinate(dms, 'DDM')
    expect(ddm.isValid()).toBe(true)
    expect(ddm.degrees).toBe(48)
    expect(ddm.minutes).toBeCloseTo(30)
  })

  it('should convert DD to DDM_AERO', () => {
    const dd = DD({ degrees: 48.5, direction: 'N' })
    const aero = convertCoordinate(dd, 'DDM_AERO')
    expect(aero.isValid()).toBe(true)
    expect(aero.degrees).toBe(48)
    expect(aero.minutes).toBeCloseTo(30)
    expect(aero.direction).toBe('N')
  })
})

describe('parseCoordinate', () => {
  it('should throw if pattern is empty', () => {
    expect(() => parseCoordinate('')).toThrow()
  })

  it('should throw if pattern is not a string', () => {
    expect(() => parseCoordinate(null)).toThrow()
    expect(() => parseCoordinate(42)).toThrow()
    expect(() => parseCoordinate(undefined)).toThrow()
  })

  it('should return null for an unrecognized string', () => {
    expect(parseCoordinate('invalid')).toBe(null)
    expect(parseCoordinate('abc def')).toBe(null)
    expect(parseCoordinate('!@#$%')).toBe(null)
  })

  describe('DD', () => {
    it('should parse a positive value with N direction', () => {
      const coord = parseCoordinate('48.8566N')
      expect(coord).not.toBe(null)
      expect(coord.isValid()).toBe(true)
      expect(coord.format).toBe(COORDINATE_FORMATS.DD)
      expect(coord.degrees).toBeCloseTo(48.8566)
      expect(coord.direction).toBe('N')
    })

    it('should parse a positive value with S direction', () => {
      const coord = parseCoordinate('48.8566S')
      expect(coord.direction).toBe('S')
    })

    it('should parse a positive value with E direction', () => {
      const coord = parseCoordinate('2.3522E')
      expect(coord.direction).toBe('E')
      expect(coord.degrees).toBeCloseTo(2.3522)
    })

    it('should parse a positive value with W direction', () => {
      const coord = parseCoordinate('73.9857W')
      expect(coord.direction).toBe('W')
    })

    it('should parse a value with degree symbol and direction', () => {
      const coord = parseCoordinate('48.8566°N')
      expect(coord).not.toBe(null)
      expect(coord.isValid()).toBe(true)
      expect(coord.format).toBe(COORDINATE_FORMATS.DD)
    })

    it('should parse a signed negative value', () => {
      const coord = parseCoordinate('-48.8566')
      expect(coord).not.toBe(null)
      expect(coord.isValid()).toBe(true)
      expect(coord.degrees).toBeCloseTo(-48.8566)
      expect(coord.direction).toBe(null)
    })

    it('should parse a signed positive value', () => {
      const coord = parseCoordinate('48.8566')
      expect(coord).not.toBe(null)
      expect(coord.isValid()).toBe(true)
      expect(coord.degrees).toBeCloseTo(48.8566)
      expect(coord.direction).toBe(null)
    })

    it('should parse an integer value', () => {
      const coord = parseCoordinate('48N')
      expect(coord).not.toBe(null)
      expect(coord.degrees).toBe(48)
    })

    it('should parse ignoring whitespace', () => {
      const coord = parseCoordinate('48.8566 ° N')
      expect(coord).not.toBe(null)
      expect(coord.isValid()).toBe(true)
    })
  })

  describe('DDM', () => {
    it('should parse a value with direction', () => {
      const coord = parseCoordinate("48°51.396'N")
      expect(coord).not.toBe(null)
      expect(coord.isValid()).toBe(true)
      expect(coord.format).toBe(COORDINATE_FORMATS.DDM)
      expect(coord.degrees).toBe(48)
      expect(coord.minutes).toBeCloseTo(51.396)
      expect(coord.direction).toBe('N')
    })

    it('should parse a signed value', () => {
      const coord = parseCoordinate("-48°51.396'")
      expect(coord).not.toBe(null)
      expect(coord.isValid()).toBe(true)
      expect(coord.format).toBe(COORDINATE_FORMATS.DDM)
      expect(coord.degrees).toBe(-48)
      expect(coord.minutes).toBeCloseTo(51.396)
    })

    it('should parse without the minute symbol', () => {
      const coord = parseCoordinate('48°51.396')
      expect(coord).not.toBe(null)
      expect(coord.isValid()).toBe(true)
    })

    it('should parse all directions', () => {
      expect(parseCoordinate("48°30'S").direction).toBe('S')
      expect(parseCoordinate("48°30'E").direction).toBe('E')
      expect(parseCoordinate("48°30'W").direction).toBe('W')
    })

    it('should parse ignoring whitespace', () => {
      const coord = parseCoordinate("48° 51.396' N")
      expect(coord).not.toBe(null)
      expect(coord.isValid()).toBe(true)
    })
  })

  describe('DMS', () => {
    it('should parse a value with direction', () => {
      const coord = parseCoordinate("48°51'23.76\"N")
      expect(coord).not.toBe(null)
      expect(coord.isValid()).toBe(true)
      expect(coord.format).toBe(COORDINATE_FORMATS.DMS)
      expect(coord.degrees).toBe(48)
      expect(coord.minutes).toBe(51)
      expect(coord.seconds).toBeCloseTo(23.76)
      expect(coord.direction).toBe('N')
    })

    it('should parse a signed value', () => {
      const coord = parseCoordinate("-48°51'23.76\"")
      expect(coord).not.toBe(null)
      expect(coord.isValid()).toBe(true)
      expect(coord.degrees).toBe(-48)
    })

    it('should parse without the second symbol', () => {
      const coord = parseCoordinate("48°51'23.76")
      expect(coord).not.toBe(null)
      expect(coord.isValid()).toBe(true)
    })

    it('should parse all directions', () => {
      expect(parseCoordinate("48°51'23\"S").direction).toBe('S')
      expect(parseCoordinate("48°51'23\"E").direction).toBe('E')
      expect(parseCoordinate("48°51'23\"W").direction).toBe('W')
    })

    it('should parse ignoring whitespace', () => {
      const coord = parseCoordinate("48° 51' 23.76\" N")
      expect(coord).not.toBe(null)
      expect(coord.isValid()).toBe(true)
    })
  })

  describe('DDMAero', () => {
    it('should parse a latitude string', () => {
      const coord = parseCoordinate('48510N')
      expect(coord).not.toBe(null)
      expect(coord.isValid()).toBe(true)
      expect(coord.format).toBe(COORDINATE_FORMATS.DDM_AERO)
      expect(coord.degrees).toBe(48)
      expect(coord.minutes).toBeCloseTo(51)
      expect(coord.direction).toBe('N')
    })

    it('should parse a S direction', () => {
      expect(parseCoordinate('48510S').direction).toBe('S')
    })

    it('should parse a longitude string', () => {
      const coord = parseCoordinate('002209E')
      expect(coord).not.toBe(null)
      expect(coord.isValid()).toBe(true)
      expect(coord.degrees).toBe(2)
      expect(coord.minutes).toBeCloseTo(20.9)
      expect(coord.direction).toBe('E')
    })

    it('should parse a W direction', () => {
      expect(parseCoordinate('002209W').direction).toBe('W')
    })
  })

  describe('ambiguous cases', () => {
    it('should prefer DD over DDMAero for simple numeric strings', () => {
      const coord = parseCoordinate('48.8566')
      expect(coord.format).toBe(COORDINATE_FORMATS.DD)
    })

    it('should prefer DDM over DD for degree-minute strings', () => {
      const coord = parseCoordinate("48°30'N")
      expect(coord.format).toBe(COORDINATE_FORMATS.DDM)
    })

    it('should prefer DMS over DDM for degree-minute-second strings', () => {
      const coord = parseCoordinate("48°51'23\"N")
      expect(coord.format).toBe(COORDINATE_FORMATS.DMS)
    })
  })
})
