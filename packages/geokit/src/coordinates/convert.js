import { getLogger } from '@logtape/logtape'
import { is } from '@kalisio/check'

const logger = getLogger('geokit', 'convert')

/**
 * Converts Degrees, Minutes, Seconds to Decimal Degrees
 * @param {number} deg - degrees
 * @param {number} [min=0] - minutes
 * @param {number} [sec=0] - seconds
 * @param {'N'|'S'|'E'|'W'} [dir] - optional direction
 * @returns {number} decimal degrees, positive for N/E, negative for S/W
 */
export function convertFromSexagesimal (deg, min = 0, sec = 0, dir) {
  if (!is.number(deg)) {
    logger.error('Invalid argument: \'deg\', must be a number')
    return null
  }
  if (!is.number(min)) {
    logger.error('Invalid argument: \'min\', must be a number')
    return null
  }
  if (!is.number(sec)) {
    logger.error('Invalid argument: \'sec\', must be a number')
    return null
  }
  const result = Math.abs(deg) + (min / 60) + (sec / 3600)
  if (is.string(dir)) {
    const d = dir.toUpperCase()
    if (d === 'S' || d === 'W') return -result
    if (d !== 'N' && d !== 'E') {
      logger.error('Invalid argument: \'dir\' must be one of \'N\', \'S\', \'E\', \'W\'')
      return null
    }
  }
  return result
}
