import { describe, expect, it } from 'vitest'
import { fileURLToPath } from 'node:url'
import { readCsv } from '../../src/io/csv.js'

const fixture = (name) => fileURLToPath(
  new URL(`./fixtures/${name}`, import.meta.url)
)

describe('readCsv', () => {
  it('reads a valid CSV file using default coordinate columns', async () => {
    const result = await readCsv(fixture('valid.csv'))
    expect(result.valid).toBe(true)
    expect(result.errors).toEqual([])
    expect(result.validationErrors).toEqual([])
    expect(result.parseErrors).toEqual([])
    expect(result.geojson).toEqual({
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [2.3522, 48.8566]
          },
          properties: {
            name: 'Paris',
            longitude: 2.3522,
            latitude: 48.8566
          }
        },
        {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [4.8357, 45.764]
          },
          properties: {
            name: 'Lyon',
            longitude: 4.8357,
            latitude: 45.764
          }
        }
      ]
    })
  })
  it('exposes parsed fields through parseMeta', async () => {
    const result = await readCsv(fixture('valid.csv'))
    expect(result.parseMeta.fields).toEqual([
      'name',
      'longitude',
      'latitude'
    ])
  })
  it('reads custom coordinate columns', async () => {
    const result = await readCsv(fixture('custom-coordinates.csv'), {
      coordinates: {
        longitude: 'lon',
        latitude: 'lat'
      }
    })
    expect(result.valid).toBe(true)
    expect(result.validationErrors).toEqual([])
    expect(result.geojson.features[0]).toEqual({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [2.3522, 48.8566]
      },
      properties: {
        name: 'Paris',
        lon: 2.3522,
        lat: 48.8566
      }
    })
  })
  it('preserves coordinate columns by default', async () => {
    const result = await readCsv(fixture('valid.csv'))
    expect(result.geojson.features[0].properties).toEqual({
      name: 'Paris',
      longitude: 2.3522,
      latitude: 48.8566
    })
  })
  it('removes coordinate columns when preserveCoordinates is false', async () => {
    const result = await readCsv(fixture('valid.csv'), {
      preserveCoordinates: false
    })
    expect(result.valid).toBe(true)
    expect(result.geojson.features[0].properties).toEqual({
      name: 'Paris'
    })
    expect(result.geojson.features[1].properties).toEqual({
      name: 'Lyon'
    })
  })
  it('supports a custom header', async () => {
    const result = await readCsv(fixture('no-header.csv'), {
      header: ['name', 'longitude', 'latitude']
    })
    expect(result.valid).toBe(true)
    expect(result.parseMeta.fields).toEqual([
      'name',
      'longitude',
      'latitude'
    ])
    expect(result.geojson.features[0].geometry.coordinates).toEqual([
      2.3522,
      48.8566
    ])
  })
  it('forwards parser options', async () => {
    const result = await readCsv(fixture('semicolon.csv'), {
      parser: {
        delimiter: ';',
        skipEmptyLines: true
      }
    })
    expect(result.valid).toBe(true)
    expect(result.parseMeta.delimiter).toBe(';')
    expect(result.geojson.features[0].geometry.coordinates).toEqual([
      2.3522,
      48.8566
    ])
  })
  it('composes a user rowSchema with the coordinate schema', async () => {
    const result = await readCsv(fixture('valid.csv'), {
      rowSchema: {
        type: 'object',
        properties: {
          name: { type: 'string' }
        },
        required: ['name']
      }
    })
    expect(result.valid).toBe(true)
    expect(result.validationErrors).toEqual([])
  })
  it('reports user rowSchema validation errors', async () => {
    const result = await readCsv(fixture('valid.csv'), {
      rowSchema: {
        type: 'object',
        properties: {
          name: {
            enum: ['Toulouse']
          }
        },
        required: ['name']
      }
    })
    expect(result.validationErrors).toHaveLength(2)
    expect(result.geojson.features).toHaveLength(2)
  })
  it('reports a missing longitude through row validation', async () => {
    const result = await readCsv(fixture('missing-longitude.csv'))
    expect(result.validationErrors).toHaveLength(1)
    expect(result.validationErrors[0].row).toBe(0)
    expect(result.validationErrors[0].errors.some((error) => error.keyword === 'required')).toBe(true)
    expect(result.valid).toBe(false)
  })
  it('reports a missing latitude through row validation', async () => {
    const result = await readCsv(fixture('missing-latitude.csv'))
    expect(result.validationErrors).toHaveLength(1)
    expect(result.validationErrors[0].row).toBe(0)
    expect(result.validationErrors[0].errors.some((error) => error.keyword === 'required')).toBe(true)
    expect(result.valid).toBe(false)
  })
  it('reports a non-numeric longitude through row validation', async () => {
    const result = await readCsv(fixture('invalid-longitude.csv'))
    expect(result.validationErrors).toHaveLength(1)
    expect(result.validationErrors[0].row).toBe(0)
    expect(result.validationErrors[0].errors.some((error) => error.instancePath === '/longitude')).toBe(true)
    expect(result.valid).toBe(false)
  })
  it('reports a non-numeric latitude through row validation', async () => {
    const result = await readCsv(fixture('invalid-latitude.csv'))
    expect(result.validationErrors).toHaveLength(1)
    expect(result.validationErrors[0].row).toBe(0)
    expect(result.validationErrors[0].errors.some((error) => error.instancePath === '/latitude')).toBe(true)
    expect(result.valid).toBe(false)
  })
  it('reports an out-of-range longitude through GeoJSON validation', async () => {
    const result = await readCsv(fixture('longitude-out-of-range.csv'))
    expect(result.validationErrors).toEqual([])
    expect(result.valid).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
  })
  it('reports an out-of-range latitude through GeoJSON validation', async () => {
    const result = await readCsv(fixture('latitude-out-of-range.csv'))
    expect(result.validationErrors).toEqual([])
    expect(result.valid).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
  })
  it('preserves CSV parse errors', async () => {
    const result = await readCsv(fixture('ragged.csv'))
    expect(result.parseErrors.length).toBeGreaterThan(0)
    expect(result.parseErrors.some((error) => error.code === 'TooFewFields')).toBe(true)
  })
  it('rejects dynamicTyping because a coordinate rowSchema is always used', async () => {
    await expect(readCsv(fixture('valid.csv'), {
      parser: {
        dynamicTyping: true
      }
    })).rejects.toThrowError('dynamicTyping cannot be used with rowSchema')
  })
  it('allows dynamicTyping false', async () => {
    const result = await readCsv(fixture('valid.csv'), {
      parser: {
        dynamicTyping: false
      }
    })
    expect(result.valid).toBe(true)
    expect(result.validationErrors).toEqual([])
  })
  it('throws READ_FAILED when the file does not exist', async () => {
    await expect(readCsv(fixture('missing.csv'))).rejects.toMatchObject({
      code: 'READ_FAILED'
    })
  })
  it('throws when source is undefined', async () => {
    await expect(readCsv(undefined)).rejects.toThrow()
  })
  it('throws UNSUPPORTED_SOURCE for an unsupported source', async () => {
    await expect(readCsv({ foo: 'bar' })).rejects.toMatchObject({
      code: 'UNSUPPORTED_SOURCE'
    })
  })
  it('throws for invalid coordinates options', async () => {
    await expect(readCsv(fixture('valid.csv'), {
      coordinates: {
        longitude: 'longitude'
      }
    })).rejects.toThrow()
  })
  it('throws for invalid preserveCoordinates option', async () => {
    await expect(readCsv(fixture('valid.csv'), {
      preserveCoordinates: 'true'
    })).rejects.toThrow()
  })
  it('throws for invalid header option', async () => {
    await expect(readCsv(fixture('valid.csv'), {
      header: false
    })).rejects.toThrow()
  })
  it('throws for invalid parser option', async () => {
    await expect(readCsv(fixture('valid.csv'), {
      parser: 'invalid'
    })).rejects.toThrow()
  })
  it('throws for invalid rowSchema option', async () => {
    await expect(readCsv(fixture('valid.csv'), {
      rowSchema: 'invalid'
    })).rejects.toThrow()
  })
})
