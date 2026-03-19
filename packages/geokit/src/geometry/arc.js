import { asserts } from '@kalisio/check'
import { isPoint } from './point.js'

const ARC_ORIENTATION = {
  CCW: 'CCW',
  CW: 'CW',
  ALIGNED: 'ALIGNED'
}

export function computeArcOrientation (point1, point2, point3, epsilon = 1e-8) {
  asserts.all([
    { value: point1, validator: (v) => isPoint(v) && v.isValid(), message: 'point1 must be a point' },
    { value: point2, validator: (v) => isPoint(v) && v.isValid(), message: 'point2 must be a point' },
    { value: point3, validator: (v) => isPoint(v) && v.isValid(), message: 'point3 must be a point' }
  ])
  const d = (point3.longitude - point1.longitude) * (point2.latitude - point1.latitude) -
            (point2.longitude - point1.longitude) * (point3.latitude - point1.latitude)
  if (Math.abs(d) < epsilon) return ARC_ORIENTATION.ALIGNED
  return d > 0 ? ARC_ORIENTATION.CCW : ARC_ORIENTATION.CW
}
