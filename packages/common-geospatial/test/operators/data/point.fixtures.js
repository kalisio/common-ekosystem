export const points = {
  valid: { type: 'Point', coordinates: [2.3522, 48.8566] },
  valid3D: { type: 'Point', coordinates: [2.3522, 48.8566, 35] },
  invalidLon: { type: 'Point', coordinates: [200, 48] },
  missingCoordinates: { type: 'Point' },
  nonArrayCoordinates: { type: 'Point', coordinates: 'not-an-array' },
  paris: { type: 'Point', coordinates: [2.349, 48.864] },
  nyc: { type: 'Point', coordinates: [-73.985, 40.748] }
}
