import { lineStrings } from './linestring.fixtures.js'
import { polygons } from './polygon.fixtures.js'
import { multiLineStrings } from './multi-linestring.fixtures.js'

export const geometryCollections = {
  valid: {
    type: 'GeometryCollection',
    geometries: [
      { type: 'Point', coordinates: [2.3522, 48.8566] },
      { type: 'LineString', coordinates: [[2.3522, 48.8566], [4.8357, 45.7640], [5.3698, 43.2965]] },
      {
        type: 'Polygon',
        coordinates: [[
          [10, 0], [7.071, 7.071], [0, 10], [-7.071, 7.071],
          [-10, 0], [-7.071, -7.071], [0, -10], [7.071, -7.071], [10, 0]
        ]]
      },
      { type: 'MultiPoint', coordinates: [[12.4964, 41.9028], [-3.7038, 40.4168], [37.6173, 55.7558]] }
    ]
  },
  empty: {
    type: 'GeometryCollection',
    geometries: []
  },
  invalid: {
    type: 'GeometryCollection',
    geometries: [
      { type: 'Point', coordinates: [2.3522, 48.8566] },
      { type: 'Point', coordinates: [200, 0] },
      { type: 'LineString', coordinates: [[0, 0], [1, 1], [2, 2]] }
    ]
  },
  nullGeometry: {
    type: 'GeometryCollection',
    geometries: [
      { type: 'Point', coordinates: [2.3522, 48.8566] },
      { type: 'LineString', coordinates: [[0, 0], [1, 1]] },
      null
    ]
  },
  simplifiable: {
    type: 'GeometryCollection',
    geometries: [
      { ...lineStrings.simplifiable },
      { ...polygons.simplifiable },
      { ...multiLineStrings.simplifiable }
    ]
  },
  mixed: {
    type: 'GeometryCollection',
    geometries: [
      { type: 'Point', coordinates: [2.349, 48.864] },
      { type: 'LineString', coordinates: [[-73.985, 40.748], [-87.623, 41.881], [-118.243, 34.052]] },
      { type: 'Polygon', coordinates: [[[-80, -5], [-70, -5], [-70, 5], [-80, 5], [-80, -5]]] },
      { type: 'MultiPoint', coordinates: [[55.270, 25.204], [55.330, 25.250], [55.400, 25.180]] }
    ]
  }
}
