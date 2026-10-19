import { assertSupportedVersion, zoomTemplate } from '../../src/connectors/helpers.js'

describe('zoomTemplate', () => {
  it('supports a single zoom level', () => {
    expect(zoomTemplate(['EPSG:900913:5'])).toEqual({ template: 'EPSG:900913:{z}', minZoom: 5, maxZoom: 5 })
  })
  it('rejects descending and duplicated levels', () => {
    expect(zoomTemplate(['2', '1', '0'])).toBeUndefined()
    expect(zoomTemplate(['0', '1', '1'])).toBeUndefined()
  })
  it('maps prefixed consecutive levels to a zoom placeholder', () => {
    expect(zoomTemplate(['0', '1', '2'])).toEqual({ template: '{z}', minZoom: 0, maxZoom: 2 })
    expect(zoomTemplate(['EPSG:900913:3', 'EPSG:900913:4'])).toEqual({ template: 'EPSG:900913:{z}', minZoom: 3, maxZoom: 4 })
  })
  it('is purely syntactic: the numbers are whatever the identifiers end with', () => {
    // Nothing says these are zoom levels 5 and 6: callers must check that
    // against what the protocol advertises.
    expect(zoomTemplate(['https://example.com/map/5', 'https://example.com/map/6']))
      .toEqual({ template: 'https://example.com/map/{z}', minZoom: 5, maxZoom: 6 })
    // Trailing digits are all taken as the level.
    expect(zoomTemplate(['level10', 'level11'])).toEqual({ template: 'level{z}', minZoom: 10, maxZoom: 11 })
  })
  it('refuses levels a zoom number cannot rebuild', () => {
    expect(zoomTemplate([])).toBeUndefined()
    expect(zoomTemplate(['coarse', 'fine'])).toBeUndefined()
    expect(zoomTemplate(['0', '2'])).toBeUndefined()
    expect(zoomTemplate(['00', '01'])).toBeUndefined()
    expect(zoomTemplate(['a:0', 'b:1'])).toBeUndefined()
  })
})

describe('assertSupportedVersion', () => {
  it('accepts supported versions, as written', () => {
    expect(() => assertSupportedVersion('WMS', '1.3.0', ['1.1.1', '1.3.0'])).not.toThrow()
  })

  it('rejects anything else with UNSUPPORTED_VERSION', () => {
    for (const value of ['1.0.0', '1.3', '2.0.0', 'latest', undefined]) {
      expect(() => assertSupportedVersion('WMS', value, ['1.1.1', '1.3.0']))
        .toThrow(expect.objectContaining({ code: 'UNSUPPORTED_VERSION' }))
    }
  })
})
