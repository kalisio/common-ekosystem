export const lineStrings = {
  valid: {
    type: 'LineString',
    coordinates: [[2.3522, 48.8566], [4.8357, 45.7640], [5.3698, 43.2965], [7.2620, 43.7102]]
  },
  tooShort: { type: 'LineString', coordinates: [[0, 0]] },
  antimeridian: {
    type: 'LineString',
    coordinates: [[150, -10], [170, -15], [-175, -18], [-170, -20], [-160, -22]]
  },
  simplifiable: {
    type: 'LineString',
    coordinates: [
      [2.3522, 48.8566], [2.3530, 48.8570], [2.3545, 48.8580],
      [2.3550, 48.8581], [2.3552, 48.8582], [2.3560, 48.8590],
      [2.3575, 48.8600], [2.3578, 48.8601], [2.3580, 48.8602],
      [2.3600, 48.8620], [2.3625, 48.8640], [2.3650, 48.8660],
      [2.3652, 48.8661], [2.3655, 48.8663], [2.3680, 48.8680]
    ]
  },
  twoPoints: { type: 'LineString', coordinates: [[2.349, 48.864], [12.496, 41.902]] },
  withDuplicate: {
    type: 'LineString',
    coordinates: [
      [2.3522, 48.8566], [4.8357, 45.7640], [4.8357, 45.7640], [5.3698, 43.2965]
    ]
  },
  coastline: {
    type: 'LineString',
    coordinates: [
      [-73.985, 40.748], [-70.939, 42.360], [-66.107, 43.161], [-60.155, 46.233], [-52.707, 47.561]
    ]
  },
  collinear: { type: 'LineString', coordinates: [[0, 0], [1, 1], [2, 2], [3, 3]] },
  threeD: {
    type: 'LineString',
    coordinates: [
      [6.865, 45.832, 1034], [7.265, 45.923, 1224], [7.742, 45.921, 672], [7.315, 45.074, 250]
    ]
  }
}
