import { describe, it, expect } from 'vitest'
import { truncateGeometry } from '../../../src/operators/truncate/'

describe('truncateGeometry', () => {
  it('truncates a Point geometry', () => {
    const geometry = { type: 'Point', coordinates: [10.123456789, 20.987654321] }
    const result = truncateGeometry(geometry)
    expect(result.coordinates).toEqual([10.1234568, 20.9876543])
  })

  it('truncates a LineString geometry', () => {
    const geometry = {
      type: 'LineString',
      coordinates: [
        [10.123456789, 20.987654321],
        [30.111111111, 40.999999999]
      ]
    }
    const result = truncateGeometry(geometry)
    expect(result.coordinates[0]).toEqual([10.1234568, 20.9876543])
    expect(result.coordinates[1]).toEqual([30.1111111, 41])
  })

  it('truncates a Polygon geometry', () => {
    const geometry = {
      type: 'Polygon',
      coordinates: [[
        [0.123456789, 0.987654321],
        [1.123456789, 0.987654321],
        [1.123456789, 1.987654321],
        [0.123456789, 0.987654321]
      ]]
    }
    const result = truncateGeometry(geometry)
    expect(result.coordinates[0][0]).toEqual([0.1234568, 0.9876543])
  })

  it('truncates a GeometryCollection', () => {
    const geometry = {
      type: 'GeometryCollection',
      geometries: [
        { type: 'Point', coordinates: [10.123456789, 20.987654321] },
        { type: 'Point', coordinates: [30.111111111, 40.999999999] }
      ]
    }
    const result = truncateGeometry(geometry)
    expect(result.geometries[0].coordinates).toEqual([10.1234568, 20.9876543])
  })

  it('truncates bbox if present', () => {
    const geometry = {
      type: 'Point',
      coordinates: [10.123456789, 20.987654321],
      bbox: [10.123456789, 20.987654321, 10.123456789, 20.987654321]
    }
    const result = truncateGeometry(geometry)
    expect(result.bbox).toEqual([10.1234568, 20.9876543, 10.1234568, 20.9876543])
  })

  it('mutates the original geometry', () => {
    const geometry = { type: 'Point', coordinates: [10.123456789, 20.987654321] }
    const result = truncateGeometry(geometry)
    expect(result).toBe(geometry)
  })

  it('applies custom precision', () => {
    const geometry = { type: 'Point', coordinates: [10.123456789, 20.987654321] }
    const result = truncateGeometry(geometry, 3)
    expect(result.coordinates).toEqual([10.123, 20.988])
  })

  it('throws if geometry is invalid', () => {
    expect(() => truncateGeometry(null)).toThrow()
    expect(() => truncateGeometry({ type: 'Invalid' })).toThrow()
    expect(() => truncateGeometry('not a geometry')).toThrow()
  })

  it('throws if precision is out of range', () => {
    const geometry = { type: 'Point', coordinates: [1, 2] }
    expect(() => truncateGeometry(geometry, -1)).toThrow()
    expect(() => truncateGeometry(geometry, 9)).toThrow()
  })
})
