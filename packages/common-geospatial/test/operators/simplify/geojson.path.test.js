import path from 'node:path'
import fs from 'node:fs'
import { describe, it, expect } from 'vitest'
import { simplifyGeoJson } from '../../../src/operators'
import chroma from 'chroma-js'

let geojsonPath

describe('simplifyPath', () => {
  it('loads geoJson path file', () => {
    const filePath = path.resolve(__dirname, './data/path.geojson')
    geojsonPath = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
    const geometry = geojsonPath.geometry
    expect(geometry.type).toBe('LineString')
    expect(geometry.coordinates.length).toBe(495)
  })

  it('simplifies the path with a tolerance of 1e-6 without vertex weights', () => {
    const simplifiedPath = simplifyGeoJson(geojsonPath, {
      tolerance: 1e-6
    })
    const geometry = simplifiedPath.geometry
    expect(geometry.type).toBe('LineString')
    expect(geometry.coordinates.length).toBe(402)
  })

  it('simplifies the path with a tolerance of 1e-6 with vertex weights', () => {
    const { gradient } = geojsonPath.properties
    const simplifiedPath = simplifyGeoJson(geojsonPath, {
      tolerance: 1e-6,
      getWeight: (coord, index) => {
        if (index === 0 || index === gradient.length - 1) return 1
        // Measure color break: how different is this point from both its neighbors
        const deltaPrev = chroma.deltaE(gradient[index - 1], gradient[index]) / 100
        const deltaNext = chroma.deltaE(gradient[index], gradient[index + 1]) / 100
        return 1 + deltaPrev + deltaNext
      }
    })
    const geometry = simplifiedPath.geometry
    expect(geometry.type).toBe('LineString')
    expect(geometry.coordinates.length).toBe(390)
  })

  it('simplifies the path with a tolerance of 1e-4 with vertex weights', () => {
    const { gradient } = geojsonPath.properties
    const simplifiedPath = simplifyGeoJson(geojsonPath, {
      tolerance: 1e-4,
      getWeight: (coord, index) => {
        if (index === 0 || index === gradient.length - 1) return 1
        // Measure color break: how different is this point from both its neighbors
        const deltaPrev = chroma.deltaE(gradient[index - 1], gradient[index]) / 100
        const deltaNext = chroma.deltaE(gradient[index], gradient[index + 1]) / 100
        return 1 + deltaPrev + deltaNext
      }
    })
    const geometry = simplifiedPath.geometry
    expect(geometry.type).toBe('LineString')
    expect(geometry.coordinates.length).toBe(324)
  })
})
