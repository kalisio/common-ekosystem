---
title: fix
description: Automatic correction of common GeoJSON geometry issues (winding order, self-intersection).
---

# fix

## fixGeoJson

### Signature

```js
fixGeoJson (geoJson, options)
```

### Description

Fixes what it can in a GeoJSON object — a geometry, a `Feature`, or a `FeatureCollection` — driven by a previously computed `validateGeoJson` result rather than blindly reprocessing everything. It never validates internally: you must run `validateGeoJson` first and pass the result in via `options.validation`.

Only two issue types are currently fixable: `INVALID_WINDING_ORDER` and `SELF_INTERSECTION`, and only on `Polygon` and `MultiPolygon` geometries. Everything else — invalid bbox, invalid CRS, out-of-range positions, self-intersecting `LineString` (which is valid GeoJSON), etc. — is left untouched and reported back so the caller can decide what to do with it.

For a `FeatureCollection`, each feature's geometry is fixed independently and `corrections`/`unfixed` are returned as a flat list, with `path` identifying which feature each entry belongs to (e.g. `/features/2/geometry`).

The object is **mutated in place**; the returned `fixed` is the same reference as `geoJson`.

#### Result shape

```js
{
  fixed: object,          // the input object, mutated in place
  corrections: {          // issues that were actually fixed
    code: string,
    path: string
  }[],
  unfixed: {               // issues that were not fixed, for any reason
    code: string,
    path?: string,
    index?: number,
    params?: object
  }[]
}
```

`unfixed` contains three kinds of entries, all treated the same way:
- issues with a code outside `fix`'s scope (e.g. `INVALID_BBOX_LENGTH`, `INVALID_CRS_TYPE`)
- fixable issues that were skipped because the corresponding option was disabled
- fixable issues where the fix was attempted but did not succeed (e.g. the buffer operation failed on a degenerate geometry)

`fixGeoJson` never claims a correction it didn't actually make — if a code doesn't end up in `corrections`, it ends up in `unfixed`.

#### Winding order

An outer ring with clockwise winding, or a hole with counter-clockwise winding, is reversed in place.

```js
const geoJson = {
  type: 'Polygon',
  coordinates: [[[0, 0], [0, 1], [1, 1], [1, 0], [0, 0]]] // outer ring is clockwise
}
const validation = validateGeoJson(geoJson)
fixGeoJson(geoJson, { validation })
// { fixed: geoJson, corrections: [{ code: 'INVALID_WINDING_ORDER', path: '' }], unfixed: [] }
```

#### Self-intersection

Self-intersecting `Polygon`/`MultiPolygon` rings are corrected with a dilate-then-erode buffer of the same tiny amount (`precision`, default `1e-9` degrees). This is gentler than a zero-width buffer: it resolves self-intersections without collapsing small legitimate loops. `LineString` and `MultiLineString` self-intersections are never touched — they're valid GeoJSON.

```js
const geoJson = {
  type: 'Polygon',
  coordinates: [[[0, 0], [2, 2], [0, 2], [2, 0], [0, 0]]] // bowtie shape
}
const validation = validateGeoJson(geoJson)
fixGeoJson(geoJson, { validation })
// { fixed: geoJson, corrections: [{ code: 'SELF_INTERSECTION', path: '' }], unfixed: [] }
```

#### Unfixable issues are reported, not silently dropped

```js
const geoJson = {
  type: 'Polygon',
  coordinates: [[[0, 0], [0, 1], [1, 1], [1, 0], [0, 0]]], // clockwise outer ring
  bbox: [200, -200, 210, -190] // also invalid, but out of fix's scope
}
const validation = validateGeoJson(geoJson)
fixGeoJson(geoJson, { validation })
// {
//   fixed: geoJson,
//   corrections: [{ code: 'INVALID_WINDING_ORDER', path: '' }],
//   unfixed: [{ code: 'INVALID_BBOX_LATITUDE_ORDER', path: '/bbox', params: { south: -200, north: -190 } }]
// }
```

#### Disabling a correction

```js
const validation = validateGeoJson(geoJson)
fixGeoJson(geoJson, { validation, windingOrder: false })
// winding order issue moves to `unfixed` instead of `corrections`
```

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `geoJson` | `object` | yes | Any GeoJSON object: a geometry, a `Feature`, or a `FeatureCollection` |
| `options` | `object` | yes | See below |
| `options.validation` | `object` | yes | The result of `validateGeoJson(geoJson)`. Must correspond to the `geoJson` passed in |
| `options.windingOrder` | `boolean` | no | Whether to fix winding order issues (default: `true`) |
| `options.selfIntersection` | `boolean` | no | Whether to fix self-intersection issues (default: `true`) |
| `options.precision` | `number` | no | Buffer distance, in degrees, used to resolve self-intersections (default: `1e-9`) |

### Returns

| Type | Description |
|------|-------------|
| `object` | `{ fixed, corrections, unfixed }` — see [Result shape](#result-shape) |

### Throws

Throws if `geoJson` is not a GeoJson-like object, or if `options` does not match the expected shape (in particular, if `options.validation` is missing).

### Examples

```js
import { validateGeoJson, fixGeoJson } from '@kalisio/common-geospatial'

const geoJson = {
  type: 'Polygon',
  coordinates: [[[0, 0], [0, 1], [1, 1], [1, 0], [0, 0]]]
}

const validation = validateGeoJson(geoJson)
const { fixed, corrections, unfixed } = fixGeoJson(geoJson, { validation })
// corrections: [{ code: 'INVALID_WINDING_ORDER', path: '' }]
// unfixed: []

// A Feature — corrections are reported under /geometry
const feature = {
  type: 'Feature',
  properties: {},
  geometry: { type: 'Polygon', coordinates: [[[0, 0], [0, 1], [1, 1], [1, 0], [0, 0]]] }
}
fixGeoJson(feature, { validation: validateGeoJson(feature) })
// corrections: [{ code: 'INVALID_WINDING_ORDER', path: '/geometry' }]

// A FeatureCollection — only the feature that needs it is touched
const collection = {
  type: 'FeatureCollection',
  features: [
    { type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]] } },
    { type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [[[0, 0], [0, 1], [1, 1], [1, 0], [0, 0]]] } }
  ]
}
fixGeoJson(collection, { validation: validateGeoJson(collection) })
// corrections: [{ code: 'INVALID_WINDING_ORDER', path: '/features/1/geometry' }]

// Disabling self-intersection fixing
fixGeoJson(geoJson, { validation, selfIntersection: false })

// Custom precision for the self-intersection buffer
fixGeoJson(geoJson, { validation, precision: 1e-7 })
```
