import { assert, is } from '@kalisio/common-core/predicates'
import {
  hasProjection,
  isWGS84Projection,
  reprojectPosition,
  reprojectPositions
} from '../foundation/index.js'
import {
  FEATURE_TYPES,
  GEOMETRY_TYPES,
  isLikeGeoJson
} from './is-like.js'
import { extractGeoJsonCRS } from './extract/index.js'

function crsToUrn (crs) {
  const epsg = crs.match(/^EPSG:(\d+)$/i)
  return epsg ? `urn:ogc:def:crs:EPSG::${epsg[1]}` : crs
}

function reprojectGeometry (geometry, source, target) {
  switch (geometry.type) {
    case GEOMETRY_TYPES.POINT:
      geometry.coordinates = reprojectPosition(geometry.coordinates, source, target)
      break
    case GEOMETRY_TYPES.MULTI_POINT:
    case GEOMETRY_TYPES.LINESTRING:
      geometry.coordinates = reprojectPositions(geometry.coordinates, source, target)
      break
    case GEOMETRY_TYPES.MULTI_LINESTRING:
    case GEOMETRY_TYPES.POLYGON:
      geometry.coordinates = geometry.coordinates.map(
        positions => reprojectPositions(positions, source, target)
      )
      break
    case GEOMETRY_TYPES.MULTI_POLYGON:
      geometry.coordinates = geometry.coordinates.map(
        polygon => polygon.map(
          ring => reprojectPositions(ring, source, target)
        )
      )
      break
    case GEOMETRY_TYPES.GEOMETRY_COLLECTION:
      for (const g of geometry.geometries) {
        reprojectGeometry(g, source, target)
      }
      break
  }
  delete geometry.bbox
  delete geometry.crs
  return geometry
}

function reprojectFeature (feature, source, target) {
  if (feature.type === FEATURE_TYPES.FEATURE) {
    if (feature.geometry) reprojectGeometry(feature.geometry, source, target)
  } else {
    for (const f of feature.features) {
      reprojectFeature(f, source, target)
    }
  }
  delete feature.bbox
  delete feature.crs
  return feature
}

export function reprojectGeoJson (geoJson, target) {
  assert.that(geoJson, isLikeGeoJson, 'geoJson must be a GeoJson object')
  const source = extractGeoJsonCRS(geoJson)
  assert.all([
    { value: source, validator: hasProjection, message: `unknown source projection: ${source}` },
    { value: target, validator: hasProjection, message: `unknown target projection: ${target}` }
  ])
  if (is.oneOf(geoJson.type, Object.values(GEOMETRY_TYPES))) {
    reprojectGeometry(geoJson, source, target)
  } else {
    reprojectFeature(geoJson, source, target)
  }
  if (isWGS84Projection(target)) {
    delete geoJson.crs
  } else {
    geoJson.crs = {
      type: 'name',
      properties: { name: crsToUrn(target) }
    }
  }
  return geoJson
}
