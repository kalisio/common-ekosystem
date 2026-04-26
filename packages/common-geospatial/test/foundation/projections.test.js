import { describe, it, expect, beforeEach } from 'vitest'
import proj4 from 'proj4'
import { listProjections, registerProjection, hasProjection, getProjection } from '../../src/foundation/projections'

const EPSG_3857_DEF = '+proj=merc +a=6378137 +b=6378137 +lat_ts=0 +lon_0=0 +x_0=0 +y_0=0 +k=1 +units=m +nadgrids=@null +wktext +no_defs'

// Isolate tests: remove any projection registered during a previous test
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

  it('contains built-in WGS84 projection', () => {
    expect(listProjections()).toContain('WGS84')
  })

  it('reflects a newly registered projection', () => {
    proj4.defs('TEST:CUSTOM', EPSG_3857_DEF)
    expect(listProjections()).toContain('TEST:CUSTOM')
  })
})

describe('registerProjection', () => {
  describe('valid inputs', () => {
    it('registers a projection with a proj4 string definition', () => {
      registerProjection('TEST:STRING', EPSG_3857_DEF)
      expect(listProjections()).toContain('TEST:STRING')
    })

    it('registers a projection with an object definition', () => {
      const objDef = proj4.defs('WGS84')
      registerProjection('TEST:OBJECT', objDef)
      expect(listProjections()).toContain('TEST:OBJECT')
    })
  })

  describe('invalid name', () => {
    it('throws when name is an empty string', () => {
      expect(() => registerProjection('', EPSG_3857_DEF)).toThrow('name must be a non empty string')
    })

    it('throws when name is null', () => {
      expect(() => registerProjection(null, EPSG_3857_DEF)).toThrow('name must be a non empty string')
    })

    it('throws when name is undefined', () => {
      expect(() => registerProjection(undefined, EPSG_3857_DEF)).toThrow('name must be a non empty string')
    })

    it('throws when name is a number', () => {
      expect(() => registerProjection(42, EPSG_3857_DEF)).toThrow('name must be a non empty string')
    })
  })

  describe('invalid definition', () => {
    it('throws when def is an empty string', () => {
      expect(() => registerProjection('TEST:BAD', '')).toThrow('def must be a non empty string or a non empty object')
    })

    it('throws when def is null', () => {
      expect(() => registerProjection('TEST:BAD', null)).toThrow('def must be a non empty string or a non empty object')
    })

    it('throws when def is an empty object', () => {
      expect(() => registerProjection('TEST:BAD', {})).toThrow('def must be a non empty string or a non empty object')
    })

    it('throws when def is a number', () => {
      expect(() => registerProjection('TEST:BAD', 42)).toThrow('def must be a non empty string or a non empty object')
    })

    it('throws when def is undefined', () => {
      expect(() => registerProjection('TEST:BAD', undefined)).toThrow('def must be a non empty string or a non empty object')
    })
  })
})

describe('hasProjection', () => {
  it('returns true for a built-in projection', () => {
    expect(hasProjection('WGS84')).toBe(true)
  })

  it('returns true after registering a projection', () => {
    registerProjection('TEST:HAS', EPSG_3857_DEF)
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

  it('throws when name is undefined', () => {
    expect(() => hasProjection(undefined)).toThrow('name must be a non empty string')
  })
})

describe('getProjection', () => {
  it('returns the definition for a built-in projection', () => {
    expect(getProjection('WGS84')).toBeDefined()
  })

  it('returns the definition for a registered projection', () => {
    registerProjection('TEST:GET', EPSG_3857_DEF)
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

  it('throws when name is undefined', () => {
    expect(() => getProjection(undefined)).toThrow('name must be a non empty string')
  })
})
