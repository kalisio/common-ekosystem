import { assert, is } from '@kalisio/common-core/predicates'
import {
  hasProjection,
  reprojectPosition,
  reprojectPositions
} from '../foundation/index.js'
import {
  FEATURE_TYPES,
  GEOMETRY_TYPES,
  isLikeGeoJson
} from './is-like.js'

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
      geometry.coordinates = geometry.coordinates.map((positions) => reprojectPositions(positions, source, target))
      break
    case GEOMETRY_TYPES.MULTI_POLYGON:
      geometry.coordinates = geometry.coordinates.map((polygon) =>
        polygon.map((ring) => reprojectPositions(ring, source, target))
      )
      break
    case GEOMETRY_TYPES.GEOMETRY_COLLECTION:
      for (const g of geometry.geometries) reprojectGeometry(g, source, target)
      break
  }
  delete geometry.bbox
  return geometry
}

function reprojectFeature (feature, source, target) {
  if (feature.type === FEATURE_TYPES.FEATURE) {
    if (feature.geometry) reprojectGeometry(feature.geometry, source, target)
  } else {
    for (const f of feature.features) reprojectFeature(f, source, target)
  }
  delete feature.bbox
  return feature
}

export function reprojectGeoJson (geoJson, source, target) {
  assert.all([
    {
      value: geoJson,
      validator: isLikeGeoJson,
      message: 'geoJson must be a valid GeoJson'
    },
    { value: source, validator: hasProjection, message: `unknown source projection: ${source}` },
    { value: target, validator: hasProjection, message: `unknown target projection: ${target}` }
  ])
  if (is.oneOf(geoJson.type, Object.values(GEOMETRY_TYPES))) return reprojectGeometry(geoJson, source, target)
  return reprojectFeature(geoJson, source, target)
}
