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
