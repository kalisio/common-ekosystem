import { describe, it, expect } from 'vitest'
import { BBox } from '../../src/geometry/bbox.js'
import { Coords } from '../../src/geometry/coords.js'

describe('BBox', () => {
  describe('constructor', () => {
    it('creates a valid bbox from a 2D array', () => {
      const bb = BBox([[1, 10], [5, 20]])
      expect(bb.isValid).toBe(true)
    })

    it('creates a valid bbox from a 3D array', () => {
      const bb = BBox([[1, 10, 0], [5, 20, 100]])
      expect(bb.isValid).toBe(true)
    })

    it('creates a valid bbox from a { min, max } object', () => {
      const bb = BBox({ min: [1, 10], max: [5, 20] })
      expect(bb.isValid).toBe(true)
    })

    it('creates an invalid bbox without argument', () => {
      expect(BBox().isValid).toBe(false)
    })

    it('creates an invalid bbox with incorrect coords', () => {
      expect(BBox([[null, 10], [5, 20]]).isValid).toBe(false)
    })

    it('creates an invalid bbox with an array of incorrect length', () => {
      expect(BBox([[1, 10]]).isValid).toBe(false)
    })
  })

  describe('dimension', () => {
    it('returns 2 for a 2D bbox', () => {
      expect(BBox([[1, 10], [5, 20]]).dimension).toBe(2)
    })

    it('returns 3 for a 3D bbox', () => {
      expect(BBox([[1, 10, 0], [5, 20, 100]]).dimension).toBe(3)
    })

    it('returns 0 if invalid', () => {
      expect(BBox().dimension).toBe(0)
    })
  })

  describe('min / max', () => {
    it('exposes min with correct coordinates', () => {
      const bb = BBox([[1.5, 10.2], [5.8, 20.6]])
      expect(bb.min.longitude).toBe(1.5)
      expect(bb.min.latitude).toBe(10.2)
    })

    it('exposes max with correct coordinates', () => {
      const bb = BBox([[1.5, 10.2], [5.8, 20.6]])
      expect(bb.max.longitude).toBe(5.8)
      expect(bb.max.latitude).toBe(20.6)
    })

    it('exposes min/max with altitude in 3D', () => {
      const bb = BBox([[1, 10, 50], [5, 20, 150]])
      expect(bb.min.altitude).toBe(50)
      expect(bb.max.altitude).toBe(150)
    })

    it('min and max are read-only', () => {
      const bb = BBox([[1, 10], [5, 20]])
      expect(() => { bb.min = null }).toThrow()
      expect(() => { bb.max = null }).toThrow()
    })
  })

  describe('truncate', () => {
    it('truncates min and max to the given precision', () => {
      // 1.123456789 truncated to 4 decimal places → 1.1235
      // 10.987654321 truncated to 4 decimal places → 10.9877
      // 5.111111111 truncated to 4 decimal places → 5.1111
      // 20.555555555 truncated to 4 decimal places → 20.5556
      const bb = BBox([[1.123456789, 10.987654321], [5.111111111, 20.555555555]])
      bb.truncate(4)
      expect(bb.min.longitude).toBe(1.1235)
      expect(bb.min.latitude).toBe(10.9877)
      expect(bb.max.longitude).toBe(5.1111)
      expect(bb.max.latitude).toBe(20.5556)
    })

    it('returns this for chaining', () => {
      const bb = BBox([[1, 10], [5, 20]])
      expect(bb.truncate()).toBe(bb)
    })

    it('throws if precision is out of range', () => {
      const bb = BBox([[1, 10], [5, 20]])
      expect(() => bb.truncate(9)).toThrow()
      expect(() => bb.truncate(-1)).toThrow()
    })

    it('throws if bbox is invalid', () => {
      expect(() => BBox().truncate()).toThrow()
    })
  })

  describe('extend', () => {
    it('extends the bbox toward the top-right', () => {
      const bb = BBox([[1, 10], [5, 20]])
      bb.extend(Coords([8, 25]))
      expect(bb.max.longitude).toBe(8)
      expect(bb.max.latitude).toBe(25)
      expect(bb.min.longitude).toBe(1)
      expect(bb.min.latitude).toBe(10)
    })

    it('extends the bbox toward the bottom-left', () => {
      const bb = BBox([[1, 10], [5, 20]])
      bb.extend(Coords([-2, 5]))
      expect(bb.min.longitude).toBe(-2)
      expect(bb.min.latitude).toBe(5)
      expect(bb.max.longitude).toBe(5)
      expect(bb.max.latitude).toBe(20)
    })

    it('does not extend if the point is inside', () => {
      const bb = BBox([[1, 10], [5, 20]])
      bb.extend(Coords([3, 15]))
      expect(bb.min.longitude).toBe(1)
      expect(bb.min.latitude).toBe(10)
      expect(bb.max.longitude).toBe(5)
      expect(bb.max.latitude).toBe(20)
    })

    it('extends altitude in 3D', () => {
      const bb = BBox([[1, 10, 0], [5, 20, 100]])
      bb.extend(Coords([3, 15, 200]))
      expect(bb.max.altitude).toBe(200)
      expect(bb.min.altitude).toBe(0)
    })

    it('uses 0 if altitude is absent in 3D', () => {
      const bb = BBox([[1, 10, 50], [5, 20, 100]])
      bb.extend(Coords([3, 15, 0]))
      expect(bb.min.altitude).toBe(0)
    })

    it('returns this for chaining', () => {
      const bb = BBox([[1, 10], [5, 20]])
      expect(bb.extend(Coords([3, 15]))).toBe(bb)
    })

    it('throws if coords are invalid', () => {
      const bb = BBox([[1, 10], [5, 20]])
      expect(() => bb.extend(Coords())).toThrow()
    })

    it('throws if bbox is invalid', () => {
      expect(() => BBox().extend(Coords([3, 15]))).toThrow()
    })
  })

  describe('merge', () => {
    it('merges two disjoint bboxes', () => {
      const bb1 = BBox([[1, 10], [5, 20]])
      const bb2 = BBox([[8, 25], [12, 35]])
      bb1.merge(bb2)
      expect(bb1.min.longitude).toBe(1)
      expect(bb1.min.latitude).toBe(10)
      expect(bb1.max.longitude).toBe(12)
      expect(bb1.max.latitude).toBe(35)
    })

    it('merges two overlapping bboxes', () => {
      const bb1 = BBox([[1, 10], [5, 20]])
      const bb2 = BBox([[3, 15], [8, 25]])
      bb1.merge(bb2)
      expect(bb1.min.longitude).toBe(1)
      expect(bb1.min.latitude).toBe(10)
      expect(bb1.max.longitude).toBe(8)
      expect(bb1.max.latitude).toBe(25)
    })

    it('merges two 3D bboxes', () => {
      const bb1 = BBox([[1, 10, 0], [5, 20, 100]])
      const bb2 = BBox([[2, 12, 50], [8, 25, 200]])
      bb1.merge(bb2)
      expect(bb1.min.altitude).toBe(0)
      expect(bb1.max.altitude).toBe(200)
    })

    it('returns this for chaining', () => {
      const bb1 = BBox([[1, 10], [5, 20]])
      const bb2 = BBox([[8, 25], [12, 35]])
      expect(bb1.merge(bb2)).toBe(bb1)
    })

    it('throws if the argument bbox is invalid', () => {
      const bb = BBox([[1, 10], [5, 20]])
      expect(() => bb.merge(BBox())).toThrow()
    })

    it('throws if the current bbox is invalid', () => {
      expect(() => BBox().merge(BBox([[1, 10], [5, 20]]))).toThrow()
    })
  })

  describe('toArray', () => {
    it('returns [[minLon, minLat], [maxLon, maxLat]] in 2D', () => {
      expect(BBox([[1.5, 10.2], [5.8, 20.6]]).toArray()).toEqual([[1.5, 10.2], [5.8, 20.6]])
    })

    it('returns [[minLon, minLat, minAlt], [maxLon, maxLat, maxAlt]] in 3D', () => {
      expect(BBox([[1, 10, 50], [5, 20, 150]]).toArray()).toEqual([[1, 10, 50], [5, 20, 150]])
    })

    it('returns null if invalid', () => {
      expect(BBox().toArray()).toBeNull()
    })
  })

  describe('toJSON', () => {
    it('returns { min, max } in 2D', () => {
      expect(BBox([[1.5, 10.2], [5.8, 20.6]]).toJSON()).toEqual({
        min: { lon: 1.5, lat: 10.2 },
        max: { lon: 5.8, lat: 20.6 }
      })
    })

    it('returns { min, max } with alt in 3D', () => {
      expect(BBox([[1, 10, 50], [5, 20, 150]]).toJSON()).toEqual({
        min: { lon: 1, lat: 10, alt: 50 },
        max: { lon: 5, lat: 20, alt: 150 }
      })
    })

    it('returns null if invalid', () => {
      expect(BBox().toJSON()).toBeNull()
    })
  })

  describe('toGeoJSON', () => {
    it('returns { bbox: [minLon, minLat, maxLon, maxLat] } in 2D', () => {
      expect(BBox([[1.5, 10.2], [5.8, 20.6]]).toGeoJSON()).toEqual({ bbox: [1.5, 10.2, 5.8, 20.6] })
    })

    it('returns { bbox: [minLon, minLat, minAlt, maxLon, maxLat, maxAlt] } in 3D', () => {
      expect(BBox([[1, 10, 50], [5, 20, 150]]).toGeoJSON()).toEqual({ bbox: [1, 10, 50, 5, 20, 150] })
    })

    it('returns null if invalid', () => {
      expect(BBox().toGeoJSON()).toBeNull()
    })
  })
})
