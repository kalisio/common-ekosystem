import { lineStrings } from './linestring.fixtures.js'
import { polygons } from './polygon.fixtures.js'
import { multiPolygons } from './multi-polygon.fixtures.js'
import { multiPoints } from './multi-point.fixtures.js'

export const features = {
  valid: {
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [2.3522, 48.8566] },
    properties: {}
  },
  noGeometry: {
    type: 'Feature',
    geometry: null,
    properties: {}
  },
  noProperties: {
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [0, 0] }
  },
  invalidGeometry: {
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [200, 0] },
    properties: {}
  },
  withValidBBox: {
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [2, 48] },
    properties: {},
    bbox: [-5, 41, 9, 51]
  },
  withInvalidBBox: {
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [2, 48] },
    properties: {},
    bbox: [0, 10, 0, 5]
  },
  withCRS: {
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [2, 48] },
    properties: {},
    crs: { type: 'name', properties: { name: 'urn:ogc:def:crs:OGC:1.3:CRS84' } }
  },
  simplifiable: {
    type: 'Feature',
    properties: { name: 'Test route' },
    geometry: { ...lineStrings.simplifiable }
  },
  franceCountry: {
    type: 'Feature',
    geometry: polygons.france,
    properties: { name: 'France', population: 68000000 }
  },
  centralEurope: {
    type: 'Feature',
    geometry: multiPolygons.countries,
    properties: { name: 'Central Europe' }
  },
  alpineRoute: {
    type: 'Feature',
    geometry: lineStrings.threeD,
    properties: { name: 'Alpine route' }
  },
  collinear: {
    type: 'Feature',
    geometry: multiPoints.collinear,
    properties: {}
  }
}
