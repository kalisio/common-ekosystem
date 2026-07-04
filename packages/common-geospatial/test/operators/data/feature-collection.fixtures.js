import { lineStrings } from './linestring.fixtures.js'
import { polygons } from './polygon.fixtures.js'
import { multiLineStrings } from './multi-linestring.fixtures.js'

export const featureCollections = {
  valid: {
    type: 'FeatureCollection',
    features: [
      { type: 'Feature', geometry: { type: 'Point', coordinates: [0, 0] }, properties: {} },
      { type: 'Feature', geometry: { type: 'Point', coordinates: [1, 1] }, properties: {} }
    ]
  },
  empty: { type: 'FeatureCollection', features: [] },
  notAnArray: { type: 'FeatureCollection', features: 'not-an-array' },
  withInvalidFeature: {
    type: 'FeatureCollection',
    features: [
      { type: 'Feature', geometry: { type: 'Point', coordinates: [0, 0] }, properties: {} },
      { type: 'Feature', geometry: { type: 'Point', coordinates: [200, 0] }, properties: {} }
    ]
  },
  withValidBBox: {
    type: 'FeatureCollection',
    features: [{ type: 'Feature', geometry: { type: 'Point', coordinates: [0, 0] }, properties: {} }],
    bbox: [-5, -5, 5, 5]
  },
  withValidCRS: {
    type: 'FeatureCollection',
    features: [{ type: 'Feature', geometry: { type: 'Point', coordinates: [0, 0] }, properties: {} }],
    crs: { type: 'name', properties: { name: 'urn:ogc:def:crs:OGC:1.3:CRS84' } }
  },
  withInvalidCRS: {
    type: 'FeatureCollection',
    features: [{ type: 'Feature', geometry: { type: 'Point', coordinates: [0, 0] }, properties: {} }],
    crs: { type: 'unknown' }
  },
  simplifiable: {
    type: 'FeatureCollection',
    features: [
      { type: 'Feature', properties: { name: 'Route A' }, geometry: { ...lineStrings.simplifiable } },
      { type: 'Feature', properties: { name: 'Zone B' }, geometry: { ...polygons.simplifiable } },
      { type: 'Feature', properties: { name: 'Multi-route C' }, geometry: { ...multiLineStrings.simplifiable } },
      { type: 'Feature', properties: { name: 'Empty feature' }, geometry: null }
    ]
  },
  europeanCities: {
    type: 'FeatureCollection',
    features: [
      { type: 'Feature', geometry: { type: 'Point', coordinates: [2.349, 48.864] }, properties: { name: 'Paris' } },
      { type: 'Feature', geometry: { type: 'Point', coordinates: [12.496, 41.902] }, properties: { name: 'Rome' } },
      { type: 'Feature', geometry: { type: 'Point', coordinates: [-3.704, 40.416] }, properties: { name: 'Madrid' } },
      { type: 'Feature', geometry: { type: 'Point', coordinates: [18.068, 59.330] }, properties: { name: 'Stockholm' } },
      { type: 'Feature', geometry: { type: 'Point', coordinates: [28.979, 41.015] }, properties: { name: 'Istanbul' } }
    ]
  },
  mixedGeometries: {
    type: 'FeatureCollection',
    features: [
      { type: 'Feature', geometry: polygons.france, properties: { name: 'France' } },
      { type: 'Feature', geometry: multiLineStrings.roads, properties: { name: 'Roads' } },
      { type: 'Feature', geometry: { type: 'Point', coordinates: [37.617, 55.755] }, properties: { name: 'Moscow' } }
    ]
  },
  noGeometries: {
    type: 'FeatureCollection',
    features: [
      { type: 'Feature', geometry: null, properties: {} },
      { type: 'Feature', geometry: null, properties: {} }
    ]
  },
  withNullGeometry: {
    type: 'FeatureCollection',
    features: [
      { type: 'Feature', geometry: { type: 'Point', coordinates: [2.349, 48.864] }, properties: {} },
      { type: 'Feature', geometry: null, properties: {} },
      { type: 'Feature', geometry: { type: 'Point', coordinates: [12.496, 41.902] }, properties: {} }
    ]
  },
  collinear: {
    type: 'FeatureCollection',
    features: [
      { type: 'Feature', geometry: { type: 'Point', coordinates: [0, 0] }, properties: {} },
      { type: 'Feature', geometry: { type: 'Point', coordinates: [1, 1] }, properties: {} },
      { type: 'Feature', geometry: { type: 'Point', coordinates: [2, 2] }, properties: {} }
    ]
  },
  threeDPoints: {
    type: 'FeatureCollection',
    features: [
      { type: 'Feature', geometry: { type: 'Point', coordinates: [0, 0, 100] }, properties: {} },
      { type: 'Feature', geometry: { type: 'Point', coordinates: [10, 0, 200] }, properties: {} },
      { type: 'Feature', geometry: { type: 'Point', coordinates: [5, 10, 500] }, properties: {} }
    ]
  }
}
