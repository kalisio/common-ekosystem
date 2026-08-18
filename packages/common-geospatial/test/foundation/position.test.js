import { describe, it, expect } from 'vitest'
// TODO adjust to the real module path.
import { parsePosition } from '../../src/foundation/position.js'

// Hemisphere-suffixed decimal-degree literals.
// Adjust these four if parseCoordinate expects a different textual form
// (e.g. '2.35 E', 'E2.35', or a DMS notation).
const N = (d) => `${d}N`
const S = (d) => `${d}S`
const E = (d) => `${d}E`
const W = (d) => `${d}W`

describe('parsePosition', () => {
  describe('input guard', () => {
    it('throws on a non-string pattern', () => {
      expect(() => parsePosition(42)).toThrow(/pattern/)
      expect(() => parsePosition(null)).toThrow(/pattern/)
      expect(() => parsePosition(undefined)).toThrow(/pattern/)
      expect(() => parsePosition({})).toThrow(/pattern/)
      expect(() => parsePosition([])).toThrow(/pattern/)
    })
    it('throws on an empty string', () => {
      expect(() => parsePosition('')).toThrow(/pattern/)
    })
  })

  describe('separators and arity', () => {
    it('returns null when the pattern has a single field', () => {
      expect(parsePosition(N(48.85))).toBeNull()
    })
    it('returns null when the pattern has more than two fields', () => {
      expect(parsePosition('1,2,3')).toBeNull()
      expect(parsePosition(`${E(2.35)},${N(48.85)},${N(1)}`)).toBeNull()
    })
    it('splits on comma, semicolon and pipe', () => {
      const expected = [2.35, 48.85]
      expect(parsePosition(`${E(2.35)},${N(48.85)}`)).toEqual(expected)
      expect(parsePosition(`${E(2.35)};${N(48.85)}`)).toEqual(expected)
      expect(parsePosition(`${E(2.35)}|${N(48.85)}`)).toEqual(expected)
    })
    it('tolerates whitespace around fields', () => {
      // parsePosition itself does not trim; this asserts parseCoordinate does.
      expect(parsePosition(` ${E(2.35)} , ${N(48.85)} `)).toEqual([2.35, 48.85])
    })
  })

  describe('unparseable fields', () => {
    it('returns null when neither field parses', () => {
      expect(parsePosition('foo,bar')).toBeNull()
    })
    it('returns null when only one field parses', () => {
      expect(parsePosition(`nope,${N(48.85)}`)).toBeNull()
      expect(parsePosition(`${E(2.35)},nope`)).toBeNull()
    })
  })

  describe('both axes explicit', () => {
    it('keeps [lon, lat] when given in [lon, lat] order', () => {
      expect(parsePosition(`${E(2.35)},${N(48.85)}`)).toEqual([2.35, 48.85])
    })
    it('reorders to [lon, lat] when given in [lat, lon] order', () => {
      expect(parsePosition(`${N(48.85)},${E(2.35)}`)).toEqual([2.35, 48.85])
    })
  })

  describe('hemisphere signing', () => {
    it('negates a western longitude', () => {
      expect(parsePosition(`${W(2.35)},${N(48.85)}`)).toEqual([-2.35, 48.85])
    })
    it('negates a southern latitude', () => {
      expect(parsePosition(`${E(2.35)},${S(48.85)}`)).toEqual([2.35, -48.85])
    })
    it('negates both when west and south', () => {
      expect(parsePosition(`${W(2.35)},${S(48.85)}`)).toEqual([-2.35, -48.85])
    })
    it('applies signing regardless of field order', () => {
      expect(parsePosition(`${S(48.85)},${W(2.35)}`)).toEqual([-2.35, -48.85])
    })
  })

  describe('one axis explicit, one inferred', () => {
    it('keeps order when the first field is an explicit longitude', () => {
      expect(parsePosition(`${E(2.35)},48.85`)).toEqual([2.35, 48.85])
    })
    it('swaps when the first field is an explicit latitude', () => {
      expect(parsePosition(`${N(48.85)},2.35`)).toEqual([2.35, 48.85])
    })
    it('keeps [lon, lat] when the second field is an explicit longitude', () => {
      expect(parsePosition(`48.85,${E(2.35)}`)).toEqual([2.35, 48.85])
    })
    it('keeps order when the second field is an explicit latitude', () => {
      expect(parsePosition(`2.35,${N(48.85)}`)).toEqual([2.35, 48.85])
    })
    it('carries the sign of the explicit field through inference', () => {
      expect(parsePosition(`${W(2.35)},48.85`)).toEqual([-2.35, 48.85])
    })
  })

  describe('magnitude-based longitude inference', () => {
    // Depends on guessCoordinateAxis treating |value| > 90 as longitude and
    // leaving a sub-90 magnitude ambiguous. If that heuristic differs, these
    // inputs fall through to the ambiguous-pair branch instead.
    it('treats an out-of-latitude-range first field as longitude', () => {
      expect(parsePosition('120.5,45.2')).toEqual([120.5, 45.2])
    })
    it('treats an out-of-latitude-range second field as longitude', () => {
      expect(parsePosition('45.2,120.5')).toEqual([120.5, 45.2])
    })
  })

  describe('fully ambiguous input', () => {
    it('returns both candidate orderings when neither axis can be determined', () => {
      expect(parsePosition('2.35,48.85')).toEqual([
        [2.35, 48.85],
        [48.85, 2.35]
      ])
    })
  })

  describe('contradictory axes', () => {
    // Two fields resolving to the SAME axis cannot form a position and are
    // rejected like any other invalid input: null, not a partial result.
    it('returns null for two explicit longitudes', () => {
      expect(parsePosition(`${E(2.35)},${E(3.40)}`)).toBeNull()
    })
    it('returns null for two explicit latitudes', () => {
      expect(parsePosition(`${N(45)},${N(46)}`)).toBeNull()
    })
    it('returns null for two magnitude-inferred longitudes', () => {
      expect(parsePosition('120,130')).toBeNull()
    })
  })
})
