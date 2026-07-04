export const multiPoints = {
  valid: {
    type: 'MultiPoint',
    coordinates: [
      [2.3522, 48.8566], [12.4964, 41.9028], [-3.7038, 40.4168], [37.6173, 55.7558], [-43.1729, -22.9068]
    ]
  },
  empty: { type: 'MultiPoint', coordinates: [] },
  invalid: {
    type: 'MultiPoint',
    coordinates: [[2.3522, 48.8566], [200, 0], [12.4964, 41.9028]]
  },
  simplifiable: {
    type: 'MultiPoint',
    coordinates: [[2.3522, 48.8566], [2.3600, 48.8620], [2.3680, 48.8680]]
  },
  scattered: {
    type: 'MultiPoint',
    coordinates: [[2.349, 48.864], [12.496, 41.902], [37.617, 55.755], [-43.172, -22.906]]
  },
  collinear: {
    type: 'MultiPoint',
    coordinates: [[0, 0], [1, 1], [2, 2], [3, 3]]
  },
  singleLocation: {
    type: 'MultiPoint',
    coordinates: [[2.349, 48.864], [2.349, 48.864], [2.349, 48.864]]
  }
}
