import truncate from '@turf/truncate'
// import { is } from '@kalisio/check'

export function truncateGeometry (geometry, precision = 7) {
  return truncate(geometry, precision)
}
