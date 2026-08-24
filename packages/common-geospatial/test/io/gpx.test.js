import { describe, expect, it } from 'vitest'
import { fileURLToPath } from 'node:url'
import { readGpx } from '../../src/io/gpx.js'

const fixture = (name) => fileURLToPath(
  new URL(`./fixtures/${name}`, import.meta.url)
)

describe('readGpx', () => {
  it('reads a valid GPX file', async () => {
    const result = await readGpx(fixture('valid.gpx'))

    expect(result.valid).toBe(true)
    expect(result.errors).toEqual([])
    expect(result.geojson.type).toBe('FeatureCollection')
    expect(result.geojson.features).toHaveLength(1)
    expect(result.geojson.features[0]).toMatchObject({
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: [
          [2.3522, 48.8566],
          [2.353, 48.857]
        ]
      }
    })
  })

  it('throws PARSE_FAILED for malformed XML', async () => {
    await expect(readGpx(fixture('malformed.gpx'))).rejects.toMatchObject({
      code: 'PARSE_FAILED'
    })
  })

  it('throws READ_FAILED when the file does not exist', async () => {
    await expect(readGpx(fixture('missing.gpx'))).rejects.toMatchObject({
      code: 'READ_FAILED'
    })
  })

  it('throws when source is undefined', async () => {
    await expect(readGpx(undefined)).rejects.toThrow()
  })

  it('throws UNSUPPORTED_SOURCE for an unsupported source', async () => {
    await expect(readGpx({ foo: 'bar' })).rejects.toMatchObject({
      code: 'UNSUPPORTED_SOURCE'
    })
  })

  it('throws for invalid options', async () => {
    await expect(readGpx(fixture('valid.gpx'), { encoding: 42 })).rejects.toThrow()
  })
})
