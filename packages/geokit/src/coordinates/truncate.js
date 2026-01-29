import { is } from '@kalisio/check'

// Precompute factors to speedup processing
const FACTORS = Array.from({ length: 9 }, (_, i) => 10 ** i)

export function truncateCoordinates (longitude, latitude, precision = 7) {
  /*
  * ┌───────────┬─────────────────────┬──────────────────────┐
  * │ Precision │ Approximate distance│ Typical usage        │
  * ├───────────┼─────────────────────┼──────────────────────┤
  * │     0     │ ~111 km             │ Country/region       │
  * │     1     │ ~11 km              │ Large city           │
  * │     2     │ ~1.1 km             │ Neighborhood         │
  * │     3     │ ~110 m              │ Village              │
  * │     4     │ ~11 m               │ Parcel/field         │
  * │     5     │ ~1.1 m              │ Street/building      │
  * │     6     │ ~0.11 m (11 cm)     │ GPS precision        │
  * │     7     │ ~1.1 cm             │ Geodesy (default)    │
  * │     8     │ ~1.1 mm             │ Topography           │
  * └───────────┴─────────────────────┴──────────────────────┘
  */
  if (!is.number(longitude) || !is.number(latitude)) {
    return null
  }
  if (!is.integer(precision) || !is.inRange(precision, 0, 8)) {
    return null
  }
  const factor = FACTORS[precision]
  return {
    longitude: Math.round(longitude * factor) / factor,
    latitude: Math.round(latitude * factor) / factor
  }
}
