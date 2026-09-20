import { fileURLToPath } from 'node:url'
import { readGeoJson } from '../../src/io/geojson.js'

const fixture = (name) => fileURLToPath(
  new URL(`./fixtures/${name}`, import.meta.url)
)

describe('readGeoJson', () => {
  it('reads a valid GeoJSON file', async () => {
    const result = await readGeoJson(fixture('valid.geojson'))
    expect(result.valid).toBe(true)
    expect(result.errors).toEqual([])
    expect(result.geojson).toMatchObject({
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [2.3522, 48.8566]
          }
        }
      ]
    })
  })
  it('reports an invalid GeoJSON document', async () => {
    const result = await readGeoJson(fixture('invalid.geojson'))
    expect(result.valid).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
  })
  it('throws PARSE_FAILED for malformed JSON', async () => {
    await expect(readGeoJson(fixture('malformed.geojson'))).rejects.toMatchObject({
      code: 'PARSE_FAILED'
    })
  })
  it('throws READ_FAILED when the file does not exist', async () => {
    await expect(readGeoJson(fixture('missing.geojson'))).rejects.toMatchObject({
      code: 'READ_FAILED'
    })
  })
  it('throws when source is undefined', async () => {
    await expect(readGeoJson(undefined)).rejects.toThrow()
  })
  it('throws UNSUPPORTED_SOURCE for an unsupported source', async () => {
    await expect(readGeoJson({ foo: 'bar' })).rejects.toMatchObject({
      code: 'UNSUPPORTED_SOURCE'
    })
  })
  it('throws for invalid options', async () => {
    await expect(
      readGeoJson(fixture('valid.geojson'), { encoding: 42 })
    ).rejects.toThrow()
  })
})
