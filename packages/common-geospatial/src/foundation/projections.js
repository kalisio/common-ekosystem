import proj4 from 'proj4'
import { assert, is } from '@kalisio/common-core/predicates'

export const WGS84 = 'EPSG:4326'

// Register the GeoJSON WGS84 aliases proj4 doesn't know natively
const WGS84_DEF = '+proj=longlat +datum=WGS84 +no_defs'
for (const alias of ['CRS:84', 'CRS84', 'WGS84',
  'urn:ogc:def:crs:OGC:1.3:CRS84',
  'urn:ogc:def:crs:OGC:2:84',
  'urn:ogc:def:crs:EPSG::4326']) {
  if (!proj4.defs(alias)) proj4.defs(alias, WGS84_DEF)
}

export function listProjections () {
  return Object.keys(proj4.defs)
}

export function defineProjection (name, definition) {
  assert.all([
    {
      value: name,
      validator: is.nonEmptyString,
      message: 'name must be a non empty string'
    },
    {
      value: definition,
      validator: v => is.nonEmptyString(v) || is.nonEmptyObject(v),
      message: 'definition must be a non empty string or a non empty object'
    }
  ])
  proj4.defs(name, definition)
}

export function hasProjection (name) {
  assert.that(name, is.nonEmptyString, 'name must be a non empty string')
  return is.defined(proj4.defs(name))
}

export function getProjection (name) {
  assert.that(name, is.nonEmptyString, 'name must be a non empty string')
  return proj4.defs(name)
}

export function isWGS84Projection (name) {
  assert.that(name, is.nonEmptyString, 'name must be a non empty string')
  const def = proj4.defs(name)
  if (!def) return false
  const ref = proj4.defs('EPSG:4326')
  return def.projName === ref.projName && def.datumCode === ref.datumCode
}
