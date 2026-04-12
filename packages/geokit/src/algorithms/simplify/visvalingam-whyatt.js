class MinHeap {
  constructor (compare) {
    this._data = []
    this._compare = compare
  }

  push (val) {
    this._data.push(val)
    this._bubbleUp(this._data.length - 1)
  }

  pop () {
    const top = this._data[0]
    const last = this._data.pop()
    if (this._data.length > 0) {
      this._data[0] = last
      this._sinkDown(0)
    }
    return top
  }

  peek () { return this._data[0] }
  get size () { return this._data.length }
  _bubbleUp (i) {
    while (i > 0) {
      const parent = (i - 1) >> 1
      if (this._compare(this._data[i], this._data[parent]) < 0) {
        ;[this._data[i], this._data[parent]] = [this._data[parent], this._data[i]]
        i = parent
      } else break
    }
  }

  _sinkDown (i) {
    const n = this._data.length
    while (true) {
      let min = i
      const l = 2 * i + 1; const r = 2 * i + 2
      if (l < n && this._compare(this._data[l], this._data[min]) < 0) min = l
      if (r < n && this._compare(this._data[r], this._data[min]) < 0) min = r
      if (min === i) break
      ;[this._data[i], this._data[min]] = [this._data[min], this._data[i]]
      i = min
    }
  }
}

function triangleArea (a, b, c) {
  return Math.abs(
    (a[0] * (b[1] - c[1]) +
     b[0] * (c[1] - a[1]) +
     c[0] * (a[1] - b[1])) / 2
  )
}

export function simplify (coords, { tolerance = 0, getWeight = () => 1 } = {}) {
  if (coords.length <= 2) return coords

  // Doubly linked list for O(1) removal
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

  // Initialize heap with interior points
  const heap = new MinHeap((a, b) => a.area - b.area)
  for (let i = 1; i < pts.length - 1; i++) {
    pts[i].area = computeArea(pts[i])
    heap.push(pts[i])
  }

  let maxArea = 0

  while (heap.size > 0) {
    const node = heap.pop()
    // Skip if already removed or stale (area recomputed since push)
    if (node.removed) continue
    if (node.area !== node._currentArea) continue
    if (node.area < maxArea) node.area = maxArea
    else maxArea = node.area

    if (node.area >= tolerance) break // remaining points are all above threshold

    // Remove node from linked list
    node.removed = true
    if (node.prev) node.prev.next = node.next
    if (node.next) node.next.prev = node.prev

    // Recompute area for neighbors and push updated versions
    if (node.prev && node.prev.prev) {
      node.prev.area = computeArea(node.prev)
      heap.push(node.prev)
    }
    if (node.next && node.next.next) {
      node.next.area = computeArea(node.next)
      heap.push(node.next)
    }
  }

  // Collect remaining points in order
  const result = []
  let cur = pts[0]
  while (cur) {
    if (!cur.removed) result.push(cur.coord)
    cur = cur.next
  }
  return result
}
