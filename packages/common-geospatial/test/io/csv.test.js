import { fileURLToPath } from 'node:url'
import { readCsv } from '../../src/io/csv.js'

const fixture = (name) => fileURLToPath(
  new URL(`./fixtures/${name}`, import.meta.url)
)
const blob = (content) => new Blob([content], { type: 'text/csv' })

describe('readCsv', () => {
  it('reads a valid CSV file as a GeoJSON FeatureCollection', async () => {
    const result = await readCsv(fixture('valid.csv'))
    expect(result.valid).toBe(true)
    expect(result.errors).toEqual([])
    expect(result.parseErrors).toEqual([])
    expect(result.validationErrors).toEqual([])
    expect(result.parseMeta.fields).toEqual(['name', 'longitude', 'latitude'])
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
  it('reads CSV content from a Blob', async () => {
    const result = await readCsv(blob('name,longitude,latitude\nParis,2.3522,48.8566'))
    expect(result.valid).toBe(true)
    expect(result.parseErrors).toEqual([])
    expect(result.validationErrors).toEqual([])
    expect(result.geojson.features).toHaveLength(1)
    expect(result.geojson.features[0].geometry.coordinates).toEqual([2.3522, 48.8566])
  })
  it('preserves coordinate properties by default', async () => {
    const result = await readCsv(fixture('valid.csv'))
    expect(result.geojson.features[0].properties).toEqual({
      name: 'Paris',
      longitude: 2.3522,
      latitude: 48.8566
    })
  })
  it('removes coordinate properties when preserveCoordinates is false', async () => {
    const result = await readCsv(fixture('valid.csv'), {
      preserveCoordinates: false
    })
    expect(result.valid).toBe(true)
    expect(result.geojson.features[0].properties).toEqual({ name: 'Paris' })
    expect(result.geojson.features[0].geometry.coordinates).toEqual([2.3522, 48.8566])
  })
  it('supports custom coordinate column names', async () => {
    const result = await readCsv(blob('name,lon,lat\nParis,2.3522,48.8566'), {
      coordinates: {
        longitude: 'lon',
        latitude: 'lat'
      }
    })
    expect(result.valid).toBe(true)
    expect(result.validationErrors).toEqual([])
    expect(result.geojson.features[0].geometry.coordinates).toEqual([2.3522, 48.8566])
    expect(result.geojson.features[0].properties).toEqual({
      name: 'Paris',
      lon: 2.3522,
      lat: 48.8566
    })
  })
  it('supports custom coordinate names without preserving them', async () => {
    const result = await readCsv(blob('name,lon,lat\nParis,2.3522,48.8566'), {
      coordinates: {
        longitude: 'lon',
        latitude: 'lat'
      },
      preserveCoordinates: false
    })
    expect(result.valid).toBe(true)
    expect(result.geojson.features[0].properties).toEqual({ name: 'Paris' })
    expect(result.geojson.features[0].geometry.coordinates).toEqual([2.3522, 48.8566])
  })
  it('supports an explicit header for CSV without column names', async () => {
    const result = await readCsv(blob('Paris,2.3522,48.8566\nLyon,4.8357,45.764'), {
      header: ['name', 'longitude', 'latitude']
    })
    expect(result.valid).toBe(true)
    expect(result.parseErrors).toEqual([])
    expect(result.validationErrors).toEqual([])
    expect(result.parseMeta.fields).toEqual(['name', 'longitude', 'latitude'])
    expect(result.geojson.features).toHaveLength(2)
    expect(result.geojson.features[0].geometry.coordinates).toEqual([2.3522, 48.8566])
    expect(result.geojson.features[1].geometry.coordinates).toEqual([4.8357, 45.764])
  })
  it('forwards parser options to the CSV reader', async () => {
    const result = await readCsv(blob('name;longitude;latitude\nParis;2.3522;48.8566'), {
      parser: { delimiter: ';' }
    })
    expect(result.valid).toBe(true)
    expect(result.parseErrors).toEqual([])
    expect(result.geojson.features[0].geometry.coordinates).toEqual([2.3522, 48.8566])
    expect(result.geojson.features[0].properties.name).toBe('Paris')
  })
  it('accepts rows matching a custom row schema', async () => {
    const result = await readCsv(fixture('valid.csv'), {
      rowSchema: {
        type: 'object',
        properties: {
          name: { type: 'string', minLength: 3 }
        },
        required: ['name']
      }
    })
    expect(result.valid).toBe(true)
    expect(result.validationErrors).toEqual([])
    expect(result.geojson.features).toHaveLength(2)
  })
  it('reports rows violating a custom row schema', async () => {
    const result = await readCsv(fixture('valid.csv'), {
      rowSchema: {
        type: 'object',
        properties: {
          name: { type: 'string', minLength: 6 }
        },
        required: ['name']
      }
    })
    expect(result.validationErrors).toHaveLength(2)
    expect(result.validationErrors.map(error => error.row)).toEqual([0, 1])
    expect(result.validationErrors[0].errors[0].keyword).toBe('minLength')
    expect(result.valid).toBe(true)
    expect(result.geojson.features).toHaveLength(2)
  })
  it('coerces numeric coordinate strings to numbers', async () => {
    const result = await readCsv(fixture('valid.csv'))
    const feature = result.geojson.features[0]
    expect(feature.geometry.coordinates).toEqual([2.3522, 48.8566])
    expect(typeof feature.properties.longitude).toBe('number')
    expect(typeof feature.properties.latitude).toBe('number')
  })
  it('reports invalid coordinate values', async () => {
    const result = await readCsv(blob('name,longitude,latitude\nParis,invalid,48.8566'))
    expect(result.validationErrors).toHaveLength(1)
    expect(result.validationErrors[0].row).toBe(0)
    expect(result.validationErrors[0].errors.length).toBeGreaterThan(0)
    expect(result.valid).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
  })
  it('reports missing coordinate columns', async () => {
    const result = await readCsv(blob('name,longitude\nParis,2.3522'))
    expect(result.validationErrors).toHaveLength(1)
    expect(result.validationErrors[0].row).toBe(0)
    expect(result.valid).toBe(false)
  })
  it('reports rows with too few fields', async () => {
    const result = await readCsv(blob('name,longitude,latitude\nParis,2.3522'))
    expect(result.parseErrors).toEqual([
      expect.objectContaining({
        type: 'FieldMismatch',
        code: 'TooFewFields',
        row: 0
      })
    ])
    expect(result.validationErrors).toHaveLength(1)
  })
  it('reports rows with too many fields', async () => {
    const result = await readCsv(blob('name,longitude,latitude\nParis,2.3522,48.8566,extra'))
    expect(result.parseErrors).toEqual([
      expect.objectContaining({
        type: 'FieldMismatch',
        code: 'TooManyFields',
        row: 0
      })
    ])
    expect(result.geojson.features[0].properties.__parsed_extra).toEqual(['extra'])
  })
  it('returns an empty FeatureCollection for an empty CSV', async () => {
    const result = await readCsv(blob(''))
    expect(result.geojson).toEqual({
      type: 'FeatureCollection',
      features: []
    })
    expect(result.valid).toBe(true)
    expect(result.validationErrors).toEqual([])
  })
  it('rejects dynamicTyping because coordinate validation uses a row schema', async () => {
    await expect(readCsv(fixture('valid.csv'), {
      parser: { dynamicTyping: true }
    })).rejects.toThrow('dynamicTyping cannot be used with rowSchema')
  })
})

describe('readCsv options validation', () => {
  it('rejects an invalid options object', async () => {
    await expect(readCsv(fixture('valid.csv'), null))
      .rejects.toThrow()
  })
  it('rejects header set to false', async () => {
    await expect(readCsv(fixture('valid.csv'), { header: false }))
      .rejects.toThrow('options must be a valid options object')
  })
  it('rejects an empty custom header', async () => {
    await expect(readCsv(fixture('valid.csv'), { header: [] }))
      .rejects.toThrow('options must be a valid options object')
  })
  it('rejects duplicate custom header names', async () => {
    await expect(readCsv(fixture('valid.csv'), {
      header: ['name', 'longitude', 'longitude']
    })).rejects.toThrow('options must be a valid options object')
  })
  it('rejects an invalid parser option', async () => {
    await expect(readCsv(fixture('valid.csv'), { parser: 'invalid' }))
      .rejects.toThrow('options must be a valid options object')
  })
  it('rejects an invalid row schema option', async () => {
    await expect(readCsv(fixture('valid.csv'), { rowSchema: 'invalid' }))
      .rejects.toThrow('options must be a valid options object')
  })
  it('rejects incomplete coordinate configuration', async () => {
    await expect(readCsv(fixture('valid.csv'), {
      coordinates: { longitude: 'lon' }
    })).rejects.toThrow('options must be a valid options object')
  })
  it('rejects invalid preserveCoordinates option', async () => {
    await expect(readCsv(fixture('valid.csv'), {
      preserveCoordinates: 'false'
    })).rejects.toThrow('options must be a valid options object')
  })
})

describe('readCsv source validation', () => {
  it('rejects an undefined source', async () => {
    await expect(readCsv())
      .rejects.toThrow('source must be defined')
  })
  it('throws READ_FAILED when the file does not exist', async () => {
    await expect(readCsv(fixture('missing.csv'))).rejects.toMatchObject({
      code: 'READ_FAILED'
    })
  })
  it('rejects an unsupported source type', async () => {
    await expect(readCsv(123)).rejects.toMatchObject({
      code: 'UNSUPPORTED_SOURCE'
    })
  })
})
