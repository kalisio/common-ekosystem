// Generic, type-agnostic geometry cases: unknown/missing type, bbox forwarding.
// Type-specific fixtures (Point, LineString, Polygon...) live in their own files.

export const geometries = {
  missingType: { coordinates: [0, 0] },
  unknownType: { type: 'Triangle', coordinates: [] },
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
