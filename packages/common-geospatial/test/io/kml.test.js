import { describe, expect, it } from 'vitest'
import { fileURLToPath } from 'node:url'
import { readKml } from '../../src/io/kml.js'

const fixture = (name) => fileURLToPath(
  new URL(`./fixtures/${name}`, import.meta.url)
)

describe('readKml', () => {
  it('reads a valid KML file', async () => {
    const result = await readKml(fixture('valid.kml'))

    expect(result.valid).toBe(true)
    expect(result.errors).toEqual([])
    expect(result.geojson.type).toBe('FeatureCollection')
    expect(result.geojson.features).toHaveLength(1)
    expect(result.geojson.features[0]).toMatchObject({
      type: 'Feature',
      properties: { name: 'Paris' },
      geometry: {
        type: 'Point',
        coordinates: [2.3522, 48.8566]
      }
    })
  })

  it('throws PARSE_FAILED for malformed XML', async () => {
    await expect(readKml(fixture('malformed.kml'))).rejects.toMatchObject({
      code: 'PARSE_FAILED'
    })
  })

  it('throws READ_FAILED when the file does not exist', async () => {
    await expect(readKml(fixture('missing.kml'))).rejects.toMatchObject({
      code: 'READ_FAILED'
    })
  })

  it('throws when source is undefined', async () => {
    await expect(readKml(undefined)).rejects.toThrow()
  })

  it('throws UNSUPPORTED_SOURCE for an unsupported source', async () => {
    await expect(readKml({ foo: 'bar' })).rejects.toMatchObject({
      code: 'UNSUPPORTED_SOURCE'
    })
  })

  it('throws for invalid options', async () => {
    await expect(readKml(fixture('valid.kml'), { encoding: 42 })).rejects.toThrow()
  })
})
