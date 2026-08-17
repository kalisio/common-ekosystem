import proj4 from 'proj4'
import { assert, is } from '@kalisio/common-core/predicates'

export const WGS84 = 'WGS84'

const WGS84_DEFINITION = '+proj=longlat +datum=WGS84 +no_defs'

const DEFAULT_PROJECTIONS = {
  WGS84: WGS84_DEFINITION,
  'CRS:84': WGS84_DEFINITION,
  CRS84: WGS84_DEFINITION,
  'urn:ogc:def:crs:OGC:1.3:CRS84': WGS84_DEFINITION,
  'urn:ogc:def:crs:OGC:2:84': WGS84_DEFINITION,
  'urn:ogc:def:crs:EPSG::4326': WGS84_DEFINITION,
  'EPSG:2154': '+proj=lcc +lat_1=49 +lat_2=44 +lat_0=46.5 +lon_0=3 +x_0=700000 +y_0=6600000 +ellps=GRS80 +units=m +no_defs'
}

for (const [name, definition] of Object.entries(DEFAULT_PROJECTIONS)) {
  if (!proj4.defs(name)) proj4.defs(name, definition)
}

const EPSG_URN_REGEXP = /^urn:ogc:def:crs:EPSG::(\d+)$/i

export function normalizeCrsName (name) {
  assert.that(name, is.nonEmptyString, 'name must be a non empty string')
  const match = name.match(EPSG_URN_REGEXP)
  return match ? `EPSG:${match[1]}` : name
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
  const definition = proj4.defs(name)
  if (!definition) return false
  const wgs84 = proj4.defs('EPSG:4326')
  return definition.projName === wgs84.projName &&
    definition.datumCode === wgs84.datumCode
}
