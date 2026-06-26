// ---------------------------------------------------------------------------
// Positions
// ---------------------------------------------------------------------------

export const positions = {
  valid2D: [2.3522, 48.8566],
  valid3D: [2.3522, 48.8566, 35],
  atLonMin: [-180, 0],
  atLonMax: [180, 0],
  atLatMin: [0, -90],
  atLatMax: [0, 90],
  highPrecisionLon: [2.1234567, 48],
  highPrecisionLat: [2, 48.1234567],
  highPrecisionBoth: [2.1234567, 48.1234567],
  invalidLonHigh: [181, 0],
  invalidLonLow: [-181, 0],
  invalidLatHigh: [0, 91],
  invalidLatLow: [0, -91],
  invalidAltitude: [0, 0, 'high'],
  withNaNLon: [NaN, 0],
  withNaNLat: [0, NaN],
  withInfinityLon: [Infinity, 0],
  withNullInArray: [null, 0],
  withStringInArray: ['a', 0],
  tooShort: [1],
  tooLong: [1, 2, 3, 4],
  empty: []
}

// ---------------------------------------------------------------------------
// BBoxes
// ---------------------------------------------------------------------------

export const bboxes = {
  valid2D: [-5, 41, 9, 51],
  valid3D: [-10, -10, 0, 10, 10, 100],
  southEqualsNorth: [0, 10, 10, 10],
  antimeridian: [170, -10, -170, 10],
  highPrecision: [2.1234567, 48.1234567, 3.1234567, 49.1234567],
  southGtNorth: [0, 10, 10, 5],
  invalidWest: [-181, 0, 10, 10],
  invalidSouth: [0, -91, 10, 10],
  invalidEast: [0, 0, 181, 10],
  invalidNorth: [0, 0, 10, 91],
  wrongLength3: [0, 0, 0],
  wrongLength5: [0, 0, 0, 0, 0],
  wrongLength7: [0, 0, 0, 0, 0, 0, 0],
  withNaN: [NaN, 0, 10, 10],
  withNull: [null, 0, 10, 10]
}

// ---------------------------------------------------------------------------
// CRS objects
// ---------------------------------------------------------------------------

export const crsObjects = {
  validName: { type: 'name', properties: { name: 'urn:ogc:def:crs:OGC:1.3:CRS84' } },
  validLink: { type: 'link', properties: { href: 'https://example.com/crs', type: 'proj4' } },
  validLinkNoType: { type: 'link', properties: { href: 'https://example.com/crs' } },
  unknownType: { type: 'unknown' },
  missingType: { properties: { name: 'EPSG:4326' } },
  nameMissingProperties: { type: 'name' },
  nameEmptyString: { type: 'name', properties: { name: '' } },
  nameEmptyProperties: { type: 'name', properties: {} },
  nameNullProperties: { type: 'name', properties: null },
  linkMissingHref: { type: 'link', properties: {} },
  linkEmptyHref: { type: 'link', properties: { href: '' } },
  linkMissingProperties: { type: 'link' },
  linkNullProperties: { type: 'link', properties: null }
}

// ---------------------------------------------------------------------------
// Geometries
// ---------------------------------------------------------------------------

export const geometries = {
  validPoint: { type: 'Point', coordinates: [2.3522, 48.8566] },
  validPoint3D: { type: 'Point', coordinates: [2.3522, 48.8566, 35] },
  invalidPointLon: { type: 'Point', coordinates: [200, 48] },

  validMultiPoint: { type: 'MultiPoint', coordinates: [[0, 0], [1, 1]] },
  emptyMultiPoint: { type: 'MultiPoint', coordinates: [] },
  invalidMultiPoint: { type: 'MultiPoint', coordinates: [[0, 0], [200, 0]] },

  validLineString: { type: 'LineString', coordinates: [[0, 0], [1, 1]] },
  tooShortLineString: { type: 'LineString', coordinates: [[0, 0]] },
  antimeridianLineString: { type: 'LineString', coordinates: [[170, 0], [-170, 0]] },

  validMultiLineString: {
    type: 'MultiLineString',
    coordinates: [[[0, 0], [1, 1]], [[2, 2], [3, 3]]]
  },
  emptyMultiLineString: { type: 'MultiLineString', coordinates: [] },

  // Outer ring CCW (valid winding)
  validPolygon: {
    type: 'Polygon',
    coordinates: [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]]
  },
  // Outer ring CW (wrong winding → warning)
  cwOuterPolygon: {
    type: 'Polygon',
    coordinates: [[[0, 0], [0, 1], [1, 1], [1, 0], [0, 0]]]
  },
  // Outer CCW + hole CCW (wrong winding for hole → warning)
  ccwHolePolygon: {
    type: 'Polygon',
    coordinates: [
      [[0, 0], [0, 10], [10, 10], [10, 0], [0, 0]],
      [[2, 2], [2, 8], [8, 8], [8, 2], [2, 2]]
    ]
  },
  unclosedPolygon: {
    type: 'Polygon',
    coordinates: [[[0, 0], [0, 1], [1, 1], [1, 0]]]
  },
  tooFewPositionsPolygon: {
    type: 'Polygon',
    coordinates: [[[0, 0], [1, 1], [0, 0]]]
  },
  emptyPolygon: { type: 'Polygon', coordinates: [] },
  selfIntersectingPolygon: {
    type: 'Polygon',
    coordinates: [[[0, 0], [2, 2], [0, 2], [2, 0], [0, 0]]]
  },

  validMultiPolygon: {
    type: 'MultiPolygon',
    coordinates: [
      [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]],
      [[[2, 2], [3, 2], [3, 3], [2, 3], [2, 2]]]
    ]
  },
  emptyMultiPolygon: { type: 'MultiPolygon', coordinates: [] },

  validGeometryCollection: {
    type: 'GeometryCollection',
    geometries: [
      { type: 'Point', coordinates: [0, 0] },
      { type: 'LineString', coordinates: [[0, 0], [1, 1]] }
    ]
  },
  emptyGeometryCollection: { type: 'GeometryCollection', geometries: [] },
  invalidGeometryCollection: {
    type: 'GeometryCollection',
    geometries: [
      { type: 'Point', coordinates: [0, 0] },
      { type: 'Point', coordinates: [200, 0] }
    ]
  },
  nullGeometryInCollection: {
    type: 'GeometryCollection',
    geometries: [
      { type: 'Point', coordinates: [0, 0] },
      null
    ]
  },

  missingCoordinates: { type: 'Point' },
  nonArrayCoordinates: { type: 'Point', coordinates: 'not-an-array' },
  unknownType: { type: 'Triangle', coordinates: [] },
  missingType: { coordinates: [0, 0] },

  withValidBBox: {
    type: 'Point',
    coordinates: [2, 48],
    bbox: [-5, 41, 9, 51]
  },
  withInvalidBBox: {
    type: 'Point',
    coordinates: [2, 48],
    bbox: [0, 10, 0, 5]
  },
  withAntimeridianBBox: {
    type: 'Point',
    coordinates: [175, 0],
    bbox: [170, -10, -170, 10]
  }
}

// ---------------------------------------------------------------------------
// Features
// ---------------------------------------------------------------------------

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
  }
}

// ---------------------------------------------------------------------------
// FeatureCollections
// ---------------------------------------------------------------------------

export const featureCollections = {
  valid: {
    type: 'FeatureCollection',
    features: [
      { type: 'Feature', geometry: { type: 'Point', coordinates: [0, 0] }, properties: {} },
      { type: 'Feature', geometry: { type: 'Point', coordinates: [1, 1] }, properties: {} }
    ]
  },
  empty: {
    type: 'FeatureCollection',
    features: []
  },
  notAnArray: {
    type: 'FeatureCollection',
    features: 'not-an-array'
  },
  withInvalidFeature: {
    type: 'FeatureCollection',
    features: [
      { type: 'Feature', geometry: { type: 'Point', coordinates: [0, 0] }, properties: {} },
      { type: 'Feature', geometry: { type: 'Point', coordinates: [200, 0] }, properties: {} }
    ]
  },
  withValidBBox: {
    type: 'FeatureCollection',
    features: [
      { type: 'Feature', geometry: { type: 'Point', coordinates: [0, 0] }, properties: {} }
    ],
    bbox: [-5, -5, 5, 5]
  },
  withValidCRS: {
    type: 'FeatureCollection',
    features: [
      { type: 'Feature', geometry: { type: 'Point', coordinates: [0, 0] }, properties: {} }
    ],
    crs: { type: 'name', properties: { name: 'urn:ogc:def:crs:OGC:1.3:CRS84' } }
  },
  withInvalidCRS: {
    type: 'FeatureCollection',
    features: [
      { type: 'Feature', geometry: { type: 'Point', coordinates: [0, 0] }, properties: {} }
    ],
    crs: { type: 'unknown' }
  }
}
