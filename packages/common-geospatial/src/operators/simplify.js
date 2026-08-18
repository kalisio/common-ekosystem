import { Heap } from 'heap-js'
import { assert, is, optional, conform } from '@kalisio/common-core/predicates'
import { FEATURE_TYPES, GEOMETRY_TYPES, isLikeGeoJson } from './is-like.js'

const SIMPLIFY_OPTIONS_SCHEMA = {
  tolerance: optional(is.number),
  getWeight: optional(is.function)
}

function triangleArea (a, b, c) {
  return Math.abs(
    (a[0] * (b[1] - c[1]) +
     b[0] * (c[1] - a[1]) +
     c[0] * (a[1] - b[1])) / 2
  )
}

// Visvalingam-Whyatt simplification algorithm.
function visvalingam (coords, { tolerance = 0, getWeight = () => 1 } = {}) {
  if (coords.length <= 2) return coords
  const pts = coords.map((coord, i) => ({ coord, i, area: Infinity, removed: false, prev: null, next: null }))
  for (let i = 0; i < pts.length; i++) {
    if (i > 0) pts[i].prev = pts[i - 1]
    if (i < pts.length - 1) pts[i].next = pts[i + 1]
  }
  const computeArea = (node) => {
    if (!node.prev || !node.next) return Infinity
    return triangleArea(node.prev.coord, node.coord, node.next.coord) * getWeight(node.coord, node.i)
  }
  // Heap entries are immutable snapshots { node, area }, never reused after
  // push. A stale duplicate (left behind when a node's area is recomputed
  // after a neighbor is removed) is detected by comparing the entry's frozen
  // area to the node's current authoritative area, without ever mutating a
  // value the heap has already positioned internally.
  const heap = new Heap((a, b) => a.area - b.area)
  const pushNode = (node) => {
    node.area = computeArea(node)
    heap.push({ node, area: node.area })
  }
  for (let i = 1; i < pts.length - 1; i++) pushNode(pts[i])

  let maxArea = 0
  while (heap.size() > 0) {
    const entry = heap.pop()
    const node = entry.node
    if (node.removed) continue
    if (entry.area !== node.area) continue
    if (node.area < maxArea) node.area = maxArea
    else maxArea = node.area
    if (node.area >= tolerance) break
    node.removed = true
    if (node.prev) node.prev.next = node.next
    if (node.next) node.next.prev = node.prev
    if (node.prev?.prev) pushNode(node.prev)
    if (node.next?.next) pushNode(node.next)
  }
  const result = []
  let cur = pts[0]
  while (cur) {
    if (!cur.removed) result.push(cur.coord)
    cur = cur.next
  }
  return result
}

export function simplifyGeoJson (geoJson, options = {}) {
  assert.all([
    { value: geoJson, validator: isLikeGeoJson, message: 'geoJson must be a GeoJson object' },
    { value: options, validator: (v) => conform.schema(v, SIMPLIFY_OPTIONS_SCHEMA), message: 'options must be a valid options object' }
  ])
  if (geoJson.type === FEATURE_TYPES.FEATURE) {
    if (geoJson.geometry) simplifyGeoJson(geoJson.geometry, options)
    return geoJson
  }
  if (geoJson.type === FEATURE_TYPES.FEATURE_COLLECTION) {
    for (const feature of geoJson.features) simplifyGeoJson(feature, options)
    return geoJson
  }
  // Geometry
  switch (geoJson.type) {
    case GEOMETRY_TYPES.LINESTRING:
      geoJson.coordinates = visvalingam(geoJson.coordinates, options)
      break
    case GEOMETRY_TYPES.POLYGON:
    case GEOMETRY_TYPES.MULTI_LINESTRING:
      // getWeight receives an index local to each ring/line (each one is
      // simplified independently, restarting at 0), not a global index
      // across the whole geometry. This mirrors the fact that a ring is
      // itself a plain zero-indexed coordinate array.
      geoJson.coordinates = geoJson.coordinates.map(ring => visvalingam(ring, options))
      break
    case GEOMETRY_TYPES.MULTI_POLYGON:
      geoJson.coordinates = geoJson.coordinates.map(poly => poly.map(ring => visvalingam(ring, options)))
      break
    case GEOMETRY_TYPES.GEOMETRY_COLLECTION:
      geoJson.geometries.forEach(g => simplifyGeoJson(g, options))
      break
  }
  return geoJson
}
