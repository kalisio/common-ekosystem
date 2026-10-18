import {
  WGS84,
  isValidPositions,
  deduplicatePositions,
  truncatePositions,
  reprojectPositions
} from '../../src/foundation/index.js'

const SOURCE = 'EPSG:4326'
const TARGET = 'EPSG:3857'

// proj4-verified: [2.35, 48.85] EPSG:4326 -> EPSG:3857
const PROJECTED = [261600.8034, 6249447.7528]

function expectPositionsClose (actual, expected, digits = 6) {
  expect(actual).toHaveLength(expected.length)
  actual.forEach((position, i) => {
    expect(position).toHaveLength(expected[i].length)
    position.forEach((value, j) => expect(value).toBeCloseTo(expected[i][j], digits))
  })
}

describe('isValidPositions', () => {
  it('accepts an empty array (count-agnostic)', () => {
    // Regression guard: positions level carries no cardinality constraint.
    expect(isValidPositions([])).toBe(true)
  })
  it('accepts an array of valid 2D/3D positions', () => {
    expect(isValidPositions([[2.35, 48.85], [2.40, 48.90, 100]])).toBe(true)
  })
  it('rejects when any position is invalid', () => {
    expect(isValidPositions([[2.35, 48.85], [NaN, 5]])).toBe(false)
    expect(isValidPositions([[2.35, 48.85], [1]])).toBe(false)
    expect(isValidPositions([[2.35, 48.85], [1, 2, 3, 4]])).toBe(false)
    expect(isValidPositions([[2.35, 48.85], ['a', 'b']])).toBe(false)
  })
  it('rejects a non-array', () => {
    expect(isValidPositions('nope')).toBe(false)
    expect(isValidPositions(undefined)).toBe(false)
    expect(isValidPositions(null)).toBe(false)
  })
})

describe('deduplicatePositions', () => {
  it('returns an empty array unchanged', () => {
    expect(deduplicatePositions([])).toEqual([])
  })
  it('returns a single position unchanged', () => {
    expect(deduplicatePositions([[1, 1]])).toEqual([[1, 1]])
  })
  it('removes consecutive duplicates only', () => {
    expect(deduplicatePositions([[1, 1], [1, 1], [2, 2]])).toEqual([[1, 1], [2, 2]])
  })
  it('keeps non-consecutive equal positions', () => {
    // [1,1] reappears but not back-to-back -> preserved
    expect(deduplicatePositions([[1, 1], [2, 2], [1, 1]])).toEqual([[1, 1], [2, 2], [1, 1]])
  })
  it('preserves a closed ring (first == last, non-consecutive)', () => {
    const ring = [[0, 0], [1, 0], [1, 1], [0, 0]]
    expect(deduplicatePositions(ring)).toEqual(ring)
  })
  it('collapses a run of identical positions to one', () => {
    expect(deduplicatePositions([[1, 1], [1, 1], [1, 1]])).toEqual([[1, 1]])
  })
  it('keeps the first occurrence reference of a duplicate pair', () => {
    const first = [1, 1]
    const result = deduplicatePositions([first, [1, 1]])
    expect(result[0]).toBe(first)
  })
  it('treats positions equal within precision as duplicates', () => {
    expect(deduplicatePositions([[1.111, 1], [1.113, 1]], { precision: 2 })).toHaveLength(1)
    expect(deduplicatePositions([[1.111, 1], [1.113, 1]], { precision: 3 })).toHaveLength(2)
  })
  it('honours consider3D when comparing', () => {
    const positions = [[1, 1, 5], [1, 1, 9]]
    expect(deduplicatePositions(positions, { consider3D: false })).toHaveLength(1)
    expect(deduplicatePositions(positions, { consider3D: true })).toHaveLength(2)
  })
  it('rejects invalid options', () => {
    expect(() => deduplicatePositions([[1, 1]], { precision: 'x' })).toThrow(/options/)
  })
})

describe('truncatePositions', () => {
  it('returns an empty array unchanged', () => {
    // Regression guard: total transformer, no cardinality constraint.
    expect(truncatePositions([])).toEqual([])
  })
  it('truncates each position to the given precision', () => {
    expectPositionsClose(truncatePositions([[2.111, 48.222]], { precision: 1 }), [[2.1, 48.2]], 6)
  })
  it('applies a default precision when options are omitted', () => {
    const result = truncatePositions([[2.35, 48.85]])
    expect(result).toHaveLength(1)
    expect(result[0]).toHaveLength(2)
  })
  it('deduplicates after truncation when requested', () => {
    // Both collapse to [1.11, 1] at precision 2, then dedup -> single position
    expect(truncatePositions([[1.111, 1], [1.113, 1]], { precision: 2, deduplicate: true })).toHaveLength(1)
  })
  it('does not deduplicate by default', () => {
    expect(truncatePositions([[1, 1], [1, 1], [2, 2]], { precision: 2 })).toHaveLength(3)
  })
  it('returns a new outer array', () => {
    const input = [[2.35, 48.85]]
    expect(truncatePositions(input, { precision: 2 })).not.toBe(input)
  })
  it('rejects a non-array', () => {
    expect(() => truncatePositions('nope')).toThrow(/must be an array/)
  })
  it('rejects invalid options', () => {
    expect(() => truncatePositions([[1, 1]], { precision: 'x' })).toThrow(/options/)
  })
})

describe('reprojectPositions', () => {
  it('returns an empty array unchanged', () => {
    // Regression guard: total transformer.
    expect(reprojectPositions([], SOURCE, TARGET)).toEqual([])
  })
  it('should default to WGS84 when target is omitted', () => {
    const result = reprojectPositions([
      [222638.98159, 6106854.83489],
      [333958.47238, 6274861.39401]
    ], 'EPSG:3857')
    expect(result).toHaveLength(2)
    expect(result[0][0]).toBeCloseTo(2, 6)
    expect(result[0][1]).toBeCloseTo(48, 6)
    expect(result[1][0]).toBeCloseTo(3, 6)
    expect(result[1][1]).toBeCloseTo(49, 6)
  })
  it('should preserve positions when source matches the default target', () => {
    const positions = [[2, 48], [3, 49, 100]]
    const result = reprojectPositions(positions, WGS84)
    expect(result).toEqual(positions)
    expect(result).not.toBe(positions)
    expect(result[0]).not.toBe(positions[0])
    expect(result[1]).not.toBe(positions[1])
  })
  it('should accept an empty array with the default target', () => {
    expect(reprojectPositions([], 'EPSG:3857')).toEqual([])
  })
  it('should validate the source projection even for an empty array', () => {
    expect(() => reprojectPositions([], 'EPSG:999999')).toThrow()
  })
  it('reprojects each position to the expected projected values', () => {
    const [point] = reprojectPositions([[2.35, 48.85]], SOURCE, TARGET)
    expect(point[0]).toBeCloseTo(PROJECTED[0], 3)
    expect(point[1]).toBeCloseTo(PROJECTED[1], 3)
  })
  it('round-trips back to the source', () => {
    const original = [[2.35, 48.85], [2.40, 48.90]]
    const there = reprojectPositions(original, SOURCE, TARGET)
    expectPositionsClose(reprojectPositions(there, TARGET, SOURCE), original)
  })
  it('preserves the z component', () => {
    const [point] = reprojectPositions([[2.35, 48.85, 100]], SOURCE, TARGET)
    expect(point).toHaveLength(3)
    expect(point[2]).toBeCloseTo(100, 6)
  })
  it('does not mutate the input positions', () => {
    const input = [[2.35, 48.85]]
    reprojectPositions(input, SOURCE, TARGET)
    expect(input).toEqual([[2.35, 48.85]])
  })
  it('rejects a non-array', () => {
    expect(() => reprojectPositions('nope', SOURCE, TARGET)).toThrow(/must be an array/)
  })
  it('propagates leaf validation for a non-finite coordinate', () => {
    expect(() => reprojectPositions([[2.35, 48.85], [NaN, 5]], SOURCE, TARGET)).toThrow(/position must be a valid position/)
  })
})
