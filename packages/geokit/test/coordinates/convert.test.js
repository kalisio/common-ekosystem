import { describe, it, beforeEach, expect, vi } from 'vitest'
import { getLogger } from '@logtape/logtape'
import { convertFromSexagesimal } from '../../src/coordinates/convert.js'

describe('convertFromSexagesimal', () => {
  let loggerErrorSpy

  beforeEach(() => {
    const logger = getLogger('geokit', 'convert')
    loggerErrorSpy = vi.spyOn(logger, 'error').mockImplementation(() => {})
  })

  it('should convert degrees only', () => {
    expect(convertFromSexagesimal(10)).toBeCloseTo(10, 6)
    expect(convertFromSexagesimal(-10)).toBeCloseTo(10, 6)
  })

  it('should convert degrees and minutes', () => {
    expect(convertFromSexagesimal(10, 30)).toBeCloseTo(10.5, 6)
  })

  it('should convert degrees, minutes, and seconds', () => {
    expect(convertFromSexagesimal(48, 51, 24)).toBeCloseTo(48.8566667, 6)
    expect(convertFromSexagesimal(2, 21, 8)).toBeCloseTo(2.352222, 6)
  })

  it('should apply direction correctly', () => {
    expect(convertFromSexagesimal(48, 51, 24, 'N')).toBeCloseTo(48.8566667, 6)
    expect(convertFromSexagesimal(48, 51, 24, 'S')).toBeCloseTo(-48.8566667, 6)
    expect(convertFromSexagesimal(2, 21, 8, 'E')).toBeCloseTo(2.352222, 6)
    expect(convertFromSexagesimal(2, 21, 8, 'W')).toBeCloseTo(-2.352222, 6)
  })

  it('should be case-insensitive for direction', () => {
    expect(convertFromSexagesimal(48, 51, 24, 'n')).toBeCloseTo(48.8566667, 6)
    expect(convertFromSexagesimal(48, 51, 24, 's')).toBeCloseTo(-48.8566667, 6)
  })

  it('should return null for invalid deg/min/sec', () => {
    expect(convertFromSexagesimal('48', 51, 24)).toBeNull()
    expect(loggerErrorSpy).toHaveBeenCalledWith("Invalid argument: 'deg', must be a number")

    expect(convertFromSexagesimal(48, '51', 24)).toBeNull()
    expect(loggerErrorSpy).toHaveBeenCalledWith("Invalid argument: 'min', must be a number")

    expect(convertFromSexagesimal(48, 51, '24')).toBeNull()
    expect(loggerErrorSpy).toHaveBeenCalledWith("Invalid argument: 'sec', must be a number")
  })

  it('should return null for invalid direction', () => {
    expect(convertFromSexagesimal(48, 51, 24, 'X')).toBeNull()
    expect(loggerErrorSpy).toHaveBeenCalledWith(
      "Invalid argument: 'dir' must be one of 'N', 'S', 'E', 'W'"
    )
  })

  it('should return decimal even if no direction is provided', () => {
    expect(convertFromSexagesimal(48, 51, 24)).toBeCloseTo(48.8566667, 6)
  })
})
