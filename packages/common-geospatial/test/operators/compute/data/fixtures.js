// test/operators/fixtures.js

// ── Points ───────────────────────────────────────────────────────────────────

export const pointParis = {
  type: 'Point',
  coordinates: [2.349, 48.864]
}

export const pointNYC = {
  type: 'Point',
  coordinates: [-73.985, 40.748]
}

// ── LineStrings ───────────────────────────────────────────────────────────────

export const lineStringTwoPoints = {
  type: 'LineString',
  coordinates: [[2.349, 48.864], [12.496, 41.902]]
}

export const lineStringCoastline = {
  type: 'LineString',
  coordinates: [
    [-73.985, 40.748],
    [-70.939, 42.360],
    [-66.107, 43.161],
    [-60.155, 46.233],
    [-52.707, 47.561]
  ]
}

export const lineStringCollinear = {
  type: 'LineString',
  coordinates: [[0, 0], [1, 1], [2, 2], [3, 3]]
}

export const lineString3D = {
  type: 'LineString',
  coordinates: [
    [6.865, 45.832, 1034],
    [7.265, 45.923, 1224],
    [7.742, 45.921, 672],
    [7.315, 45.074, 250]
  ]
}

// ── Polygons ──────────────────────────────────────────────────────────────────

export const polygonFrance = {
  type: 'Polygon',
  coordinates: [[
    [-4.795, 48.376],
    [2.551, 51.089],
    [8.233, 48.978],
    [7.440, 43.766],
    [3.159, 42.428],
    [-1.779, 43.363],
    [-4.795, 48.376]
  ]]
}

export const polygonWithHole = {
  type: 'Polygon',
  coordinates: [
    [[-10, -10], [10, -10], [10, 10], [-10, 10], [-10, -10]],
    [[-5, -5], [5, -5], [5, 5], [-5, 5], [-5, -5]]
  ]
}

export const polygonWith3DRing = {
  type: 'Polygon',
  coordinates: [[
    [0, 0, 100],
    [10, 0, 150],
    [10, 10, 200],
    [0, 10, 120],
    [0, 0, 100]
  ]]
}

// ── MultiPoints ───────────────────────────────────────────────────────────────

export const multiPointScattered = {
  type: 'MultiPoint',
  coordinates: [
    [2.349, 48.864], // Paris
    [12.496, 41.902], // Rome
    [37.617, 55.755], // Moscow
    [-43.172, -22.906] // Rio
  ]
}

export const multiPointCollinear = {
  type: 'MultiPoint',
  coordinates: [[0, 0], [1, 1], [2, 2], [3, 3]]
}

export const multiPointSingleLocation = {
  type: 'MultiPoint',
  coordinates: [[2.349, 48.864], [2.349, 48.864], [2.349, 48.864]]
}

// ── MultiLineStrings ──────────────────────────────────────────────────────────

export const multiLineStringRoads = {
  type: 'MultiLineString',
  coordinates: [
    [[2.349, 48.864], [4.835, 45.764], [5.369, 43.297]], // Paris → Lyon → Marseille
    [[-3.704, 40.416], [-0.376, 39.470], [2.154, 41.385]] // Madrid → Valencia → Barcelona
  ]
}

// ── MultiPolygons ─────────────────────────────────────────────────────────────

export const multiPolygonCountries = {
  type: 'MultiPolygon',
  coordinates: [
    [[[-4.795, 48.376], [2.551, 51.089], [8.233, 48.978], [7.440, 43.766], [-4.795, 48.376]]],
    [[[12.457, 47.695], [17.161, 48.006], [18.756, 46.423], [13.806, 45.452], [12.457, 47.695]]]
  ]
}

// ── GeometryCollections ───────────────────────────────────────────────────────

export const geometryCollectionMixed = {
  type: 'GeometryCollection',
  geometries: [
    { type: 'Point', coordinates: [2.349, 48.864] },
    { type: 'LineString', coordinates: [[-73.985, 40.748], [-87.623, 41.881], [-118.243, 34.052]] },
    { type: 'Polygon', coordinates: [[[-80, -5], [-70, -5], [-70, 5], [-80, 5], [-80, -5]]] },
    { type: 'MultiPoint', coordinates: [[55.270, 25.204], [55.330, 25.250], [55.400, 25.180]] }
  ]
}

// ── Features ──────────────────────────────────────────────────────────────────

export const featurePolygonFrance = {
  type: 'Feature',
  geometry: polygonFrance,
  properties: { name: 'France', population: 68000000 }
}

export const featureMultiPolygon = {
  type: 'Feature',
  geometry: multiPolygonCountries,
  properties: { name: 'Central Europe' }
}

export const featureNoGeometry = {
  type: 'Feature',
  geometry: null,
  properties: {}
}

export const featureLineString3D = {
  type: 'Feature',
  geometry: lineString3D,
  properties: { name: 'Alpine route' }
}

export const featureCollinear = {
  type: 'Feature',
  geometry: multiPointCollinear,
  properties: {}
}

// ── FeatureCollections ────────────────────────────────────────────────────────

export const fcEuropeanCities = {
  type: 'FeatureCollection',
  features: [
    { type: 'Feature', geometry: { type: 'Point', coordinates: [2.349, 48.864] }, properties: { name: 'Paris' } },
    { type: 'Feature', geometry: { type: 'Point', coordinates: [12.496, 41.902] }, properties: { name: 'Rome' } },
    { type: 'Feature', geometry: { type: 'Point', coordinates: [-3.704, 40.416] }, properties: { name: 'Madrid' } },
    { type: 'Feature', geometry: { type: 'Point', coordinates: [18.068, 59.330] }, properties: { name: 'Stockholm' } },
    { type: 'Feature', geometry: { type: 'Point', coordinates: [28.979, 41.015] }, properties: { name: 'Istanbul' } }
  ]
}

export const fcMixedGeometries = {
  type: 'FeatureCollection',
  features: [
    { type: 'Feature', geometry: polygonFrance, properties: { name: 'France' } },
    { type: 'Feature', geometry: multiLineStringRoads, properties: { name: 'Roads' } },
    { type: 'Feature', geometry: { type: 'Point', coordinates: [37.617, 55.755] }, properties: { name: 'Moscow' } }
  ]
}

export const fcEmpty = {
  type: 'FeatureCollection',
  features: []
}

export const fcNoGeometries = {
  type: 'FeatureCollection',
  features: [
    { type: 'Feature', geometry: null, properties: {} },
    { type: 'Feature', geometry: null, properties: {} }
  ]
}

export const fcWithNullGeometry = {
  type: 'FeatureCollection',
  features: [
    { type: 'Feature', geometry: { type: 'Point', coordinates: [2.349, 48.864] }, properties: {} },
    { type: 'Feature', geometry: null, properties: {} },
    { type: 'Feature', geometry: { type: 'Point', coordinates: [12.496, 41.902] }, properties: {} }
  ]
}

export const fcCollinear = {
  type: 'FeatureCollection',
  features: [
    { type: 'Feature', geometry: { type: 'Point', coordinates: [0, 0] }, properties: {} },
    { type: 'Feature', geometry: { type: 'Point', coordinates: [1, 1] }, properties: {} },
    { type: 'Feature', geometry: { type: 'Point', coordinates: [2, 2] }, properties: {} }
  ]
}

export const fc3DAlpineRoute = {
  type: 'FeatureCollection',
  features: [
    { type: 'Feature', geometry: { type: 'Point', coordinates: [0, 0, 100] }, properties: {} },
    { type: 'Feature', geometry: { type: 'Point', coordinates: [10, 0, 200] }, properties: {} },
    { type: 'Feature', geometry: { type: 'Point', coordinates: [5, 10, 500] }, properties: {} }
  ]
}
