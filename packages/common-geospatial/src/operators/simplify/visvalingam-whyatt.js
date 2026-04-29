import { Heap } from 'heap-js'

function triangleArea (a, b, c) {
  return Math.abs(
    (a[0] * (b[1] - c[1]) +
     b[0] * (c[1] - a[1]) +
     c[0] * (a[1] - b[1])) / 2
  )
}

export function simplify (coords, { tolerance = 0, getWeight = () => 1 } = {}) {
  if (coords.length <= 2) return coords

  const pts = coords.map((coord, i) => ({ coord, i, area: Infinity, removed: false, prev: null, next: null }))
  for (let i = 0; i < pts.length; i++) {
    if (i > 0) pts[i].prev = pts[i - 1]
    if (i < pts.length - 1) pts[i].next = pts[i + 1]
  }

  const computeArea = (node) => {
    if (!node.prev || !node.next) return Infinity
    const area = triangleArea(node.prev.coord, node.coord, node.next.coord)
    return area * getWeight(node.coord, node.i)
  }

  const heap = new Heap((a, b) => a.area - b.area)
  for (let i = 1; i < pts.length - 1; i++) {
    pts[i].area = computeArea(pts[i])
    pts[i]._currentArea = pts[i].area
    heap.push(pts[i])
  }

  let maxArea = 0

  while (heap.size() > 0) {
    const node = heap.pop()
    if (node.removed) continue
    if (node.area !== node._currentArea) continue
    if (node.area < maxArea) node.area = maxArea
    else maxArea = node.area

    if (node.area >= tolerance) break

    node.removed = true
    if (node.prev) node.prev.next = node.next
    if (node.next) node.next.prev = node.prev

    if (node.prev?.prev) {
      node.prev.area = computeArea(node.prev)
      node.prev._currentArea = node.prev.area
      heap.push(node.prev)
    }
    if (node.next?.next) {
      node.next.area = computeArea(node.next)
      node.next._currentArea = node.next.area
      heap.push(node.next)
    }
  }

  const result = []
  let cur = pts[0]
  while (cur) {
    if (!cur.removed) result.push(cur.coord)
    cur = cur.next
  }
  return result
}
