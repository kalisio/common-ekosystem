import { describe, it, expect, beforeEach } from 'vitest'
import proj4 from 'proj4'
import {
  listProjections,
  defineProjection,
  hasProjection,
  getProjection,
  isWGS84Projection,
  normalizeCrsName,
  denormalizeCrsName
} from '../../src/foundation/projections.js'

const EPSG_3857_DEF = '+proj=merc +a=6378137 +b=6378137 +lat_ts=0 +lon_0=0 +x_0=0 +y_0=0 +k=1 +units=m +nadgrids=@null +wktext +no_defs'
const LAMBERT_93_DEF = '+proj=lcc +lat_1=49 +lat_2=44 +lat_0=46.5 +lon_0=3 +x_0=700000 +y_0=6600000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs'

// Isolate tests: remove any projection defined during a previous test
beforeEach(() => {
  for (const key of Object.keys(proj4.defs)) {
    if (key.startsWith('TEST:')) {
      delete proj4.defs[key]
    }
  }
})

describe('listProjections', () => {
  it('returns an array', () => {
    expect(Array.isArray(listProjections())).toBe(true)
  })
  it('contains the built-in WGS84 projection', () => {
    expect(listProjections()).toContain('EPSG:4326')
  })
  it('contains the defined WGS84 aliases', () => {
    expect(listProjections()).toContain('CRS84')
    expect(listProjections()).toContain('WGS84')
  })
  it('reflects a newly defined projection', () => {
    proj4.defs('TEST:CUSTOM', EPSG_3857_DEF)
    expect(listProjections()).toContain('TEST:CUSTOM')
  })
})

describe('defineProjection', () => {
  describe('valid inputs', () => {
    it('registers a projection with a proj4 string definition', () => {
      defineProjection('TEST:STRING', EPSG_3857_DEF)
      expect(listProjections()).toContain('TEST:STRING')
    })
    it('registers a projection with an object definition', () => {
      const objDef = proj4.defs('EPSG:4326')
      defineProjection('TEST:OBJECT', objDef)
      expect(listProjections()).toContain('TEST:OBJECT')
    })
  })

  describe('invalid name', () => {
    it('throws when name is an empty string', () => {
      expect(() => defineProjection('', EPSG_3857_DEF)).toThrow('name must be a non empty string')
    })
    it('throws when name is null', () => {
      expect(() => defineProjection(null, EPSG_3857_DEF)).toThrow('name must be a non empty string')
    })
    it('throws when name is a number', () => {
      expect(() => defineProjection(42, EPSG_3857_DEF)).toThrow('name must be a non empty string')
    })
  })

  describe('invalid definition', () => {
    it('throws when def is an empty string', () => {
      expect(() => defineProjection('TEST:BAD', '')).toThrow('definition must be a non empty string or a non empty object')
    })
    it('throws when def is null', () => {
      expect(() => defineProjection('TEST:BAD', null)).toThrow('definition must be a non empty string or a non empty object')
    })
    it('throws when def is an empty object', () => {
      expect(() => defineProjection('TEST:BAD', {})).toThrow('definition must be a non empty string or a non empty object')
    })
    it('throws when def is a number', () => {
      expect(() => defineProjection('TEST:BAD', 42)).toThrow('definition must be a non empty string or a non empty object')
    })
  })
})

describe('hasProjection', () => {
  it('returns true for a built-in projection', () => {
    expect(hasProjection('EPSG:4326')).toBe(true)
  })
  it('returns true after registering a projection', () => {
    defineProjection('TEST:HAS', EPSG_3857_DEF)
    expect(hasProjection('TEST:HAS')).toBe(true)
  })
  it('returns false for an unknown projection', () => {
    expect(hasProjection('TEST:UNKNOWN')).toBe(false)
  })
  it('throws when name is an empty string', () => {
    expect(() => hasProjection('')).toThrow('name must be a non empty string')
  })
  it('throws when name is null', () => {
    expect(() => hasProjection(null)).toThrow('name must be a non empty string')
  })
})

describe('getProjection', () => {
  it('returns the definition for a built-in projection', () => {
    expect(getProjection('EPSG:4326')).toBeDefined()
  })
  it('returns the definition for a defined projection', () => {
    defineProjection('TEST:GET', EPSG_3857_DEF)
    expect(getProjection('TEST:GET')).toBeDefined()
  })
  it('returns undefined for an unknown projection', () => {
    expect(getProjection('TEST:UNKNOWN')).toBeUndefined()
  })
  it('throws when name is an empty string', () => {
    expect(() => getProjection('')).toThrow('name must be a non empty string')
  })
  it('throws when name is null', () => {
    expect(() => getProjection(null)).toThrow('name must be a non empty string')
  })
})

describe('isWGS84Projection', () => {
  describe('accepts every WGS84 designation', () => {
    it('accepts EPSG:4326', () => {
      expect(isWGS84Projection('EPSG:4326')).toBe(true)
    })
    it('accepts CRS:84', () => {
      expect(isWGS84Projection('CRS:84')).toBe(true)
    })
    it('accepts CRS84', () => {
      expect(isWGS84Projection('CRS84')).toBe(true)
    })
    it('accepts WGS84', () => {
      expect(isWGS84Projection('WGS84')).toBe(true)
    })
    it('accepts the OGC 1.3 CRS84 URN', () => {
      expect(isWGS84Projection('urn:ogc:def:crs:OGC:1.3:CRS84')).toBe(true)
    })
    it('accepts the OGC 2 CRS84 URN', () => {
      expect(isWGS84Projection('urn:ogc:def:crs:OGC:2:84')).toBe(true)
    })
    it('accepts the OGC 2 CRS84 URN', () => {
      expect(isWGS84Projection('urn:ogc:def:crs:EPSG::4326')).toBe(true)
    })
  })

  describe('rejects non-WGS84 projections', () => {
    it('rejects Web Mercator (EPSG:3857)', () => {
      // built-in, no registration needed
      expect(isWGS84Projection('EPSG:3857')).toBe(false)
    })
    it('rejects a defined Lambert-93', () => {
      defineProjection('TEST:LAMBERT93', LAMBERT_93_DEF)
      expect(isWGS84Projection('TEST:LAMBERT93')).toBe(false)
    })
  })

  describe('rejects unknown or malformed names', () => {
    it('returns false for an undefined name', () => {
      expect(isWGS84Projection('TEST:UNKNOWN')).toBe(false)
    })
    it('is case-sensitive: lowercase EPSG is not resolved', () => {
      // proj4 keys are case-sensitive; GeoJSON CRS names use canonical casing.
      expect(isWGS84Projection('epsg:4326')).toBe(false)
    })
    it('is case-sensitive: lowercased URN is not resolved', () => {
      expect(isWGS84Projection('urn:ogc:def:crs:ogc:1.3:crs84')).toBe(false)
    })
  })

  describe('invalid input', () => {
    it('throws when name is an empty string', () => {
      expect(() => isWGS84Projection('')).toThrow('name must be a non empty string')
    })
    it('throws when name is null', () => {
      expect(() => isWGS84Projection(null)).toThrow('name must be a non empty string')
    })
    it('throws when name is a number', () => {
      expect(() => isWGS84Projection(42)).toThrow('name must be a non empty string')
    })
  })
})

describe('normalizeCrsName', () => {
  describe('EPSG URN normalization', () => {
    it('normalizes an EPSG URN to its short EPSG:<code> form', () => {
      expect(normalizeCrsName('urn:ogc:def:crs:EPSG::2154')).toBe('EPSG:2154')
    })
    it('normalizes the EPSG URN case-insensitively', () => {
      expect(normalizeCrsName('urn:ogc:def:crs:epsg::3857')).toBe('EPSG:3857')
    })
    it('preserves multi-digit codes', () => {
      expect(normalizeCrsName('urn:ogc:def:crs:EPSG::32631')).toBe('EPSG:32631')
    })
  })

  describe('passthrough', () => {
    it('leaves a short EPSG name unchanged', () => {
      expect(normalizeCrsName('EPSG:4326')).toBe('EPSG:4326')
    })
    it('leaves the WGS84 alias unchanged', () => {
      expect(normalizeCrsName('WGS84')).toBe('WGS84')
    })
    it('leaves an OGC CRS84 URN unchanged', () => {
      expect(normalizeCrsName('urn:ogc:def:crs:OGC:1.3:CRS84')).toBe('urn:ogc:def:crs:OGC:1.3:CRS84')
    })
    it('leaves a non-EPSG URN unchanged', () => {
      expect(normalizeCrsName('urn:ogc:def:crs:IAU::49900')).toBe('urn:ogc:def:crs:IAU::49900')
    })
    it('does not normalize a malformed EPSG URN with a non-numeric code', () => {
      expect(normalizeCrsName('urn:ogc:def:crs:EPSG::abc')).toBe('urn:ogc:def:crs:EPSG::abc')
    })
  })

  describe('invalid input', () => {
    it('throws when name is an empty string', () => {
      expect(() => normalizeCrsName('')).toThrow('name must be a non empty string')
    })
    it('throws when name is null', () => {
      expect(() => normalizeCrsName(null)).toThrow('name must be a non empty string')
    })
    it('throws when name is a number', () => {
      expect(() => normalizeCrsName(42)).toThrow('name must be a non empty string')
    })
  })
})

describe('denormalizeCrsName', () => {
  it('converts an EPSG name to its URN form', () => {
    expect(denormalizeCrsName('EPSG:2154')).toBe('urn:ogc:def:crs:EPSG::2154')
  })
  it('is case-insensitive on the EPSG prefix', () => {
    expect(denormalizeCrsName('epsg:3857')).toBe('urn:ogc:def:crs:EPSG::3857')
  })
  it('leaves a non-EPSG name unchanged', () => {
    expect(denormalizeCrsName('WGS84')).toBe('WGS84')
  })
  it('leaves an already URN name unchanged', () => {
    expect(denormalizeCrsName('urn:ogc:def:crs:EPSG::2154')).toBe('urn:ogc:def:crs:EPSG::2154')
  })
  it('is the inverse of normalizeCrsName for EPSG names', () => {
    expect(normalizeCrsName(denormalizeCrsName('EPSG:2154'))).toBe('EPSG:2154')
  })
  it('throws when name is an empty string', () => {
    expect(() => denormalizeCrsName('')).toThrow('name must be a non empty string')
  })
})
