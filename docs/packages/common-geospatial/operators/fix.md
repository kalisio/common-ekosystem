---
title: fix
description: Automatic correction of common GeoJSON geometry issues (winding order, self-intersection, hole/shell intersection, duplicate positions).
---

# fix

## fixGeoJson

### Signature

```js
fixGeoJson (geoJson, options)
```

### Description

Fixes what it can in a GeoJSON object — a geometry, a `Feature`, or a `FeatureCollection` — driven by a previously
computed `validateGeoJson` result rather than blindly reprocessing everything.

It never validates internally: you must run `validateGeoJson` first and pass the result via `options.validation`.

Four issue types are currently fixable:

- `INVALID_WINDING_ORDER`
- `SELF_INTERSECTION`
- `HOLE_INTERSECTS_SHELL`
- `DUPLICATE_POSITION`

Winding order, self-intersection, and hole/shell intersection only apply to `Polygon` and `MultiPolygon`. Duplicate position
removal also applies to `LineString` and `MultiLineString`.

Everything else — invalid bbox, invalid CRS, out-of-range positions, self-intersecting `LineString` (which is valid GeoJSON),
etc. — is left untouched and reported back so the caller can decide what to do with it.

For a `FeatureCollection`, each feature's geometry is fixed independently and `corrections` / `unfixed` are returned as flat
lists, with `path` identifying which feature each entry belongs to (for example `/features/2/geometry`).

The object is **mutated in place**; the returned `fixed` is the same reference as `geoJson`.

#### Result shape

```js
{
  fixed: object,          // the input object, mutated in place
  corrections: {         // issues that were actually fixed
    code: string,
    path: string
  }[],
  unfixed: {             // issues that were not fixed, for any reason
    code: string,
    path?: string,
    index?: number,
    params?: object
  }[]
}
```

`unfixed` contains three kinds of entries:

- issues with a code outside `fix`'s scope;
- fixable issues skipped because the corresponding option was disabled;
- fixable issues for which a repair was attempted but did not succeed.

`fixGeoJson` never reports a correction it did not actually make: if a code does not end up in `corrections`, it ends
up in `unfixed`.

#### Winding order

An outer ring with clockwise winding, or a hole with counter-clockwise winding, is reversed in place.

```js
const geoJson = {
  type: 'Polygon',
  coordinates: [[[0, 0], [0, 1], [1, 1], [1, 0], [0, 0]]]
}

const validation = validateGeoJson(geoJson)
fixGeoJson(geoJson, { validation })

// {
//   fixed: geoJson,
//   corrections: [{ code: 'INVALID_WINDING_ORDER', path: '' }],
//   unfixed: []
// }
```

#### Self-intersection and hole/shell intersection

Self-intersections and intersections between a polygon shell and one of its holes are repaired through a zero-width
buffer (`buffer(0)`).

This performs a topological rebuild of the polygon and can resolve a broad range of invalid polygon configurations.

The repair is attempted only when the corresponding issue was reported by validation and is still present after
duplicate removal and winding-order correction.

The rebuilt geometry is accepted only if the defects that triggered the repair are no longer detected. Otherwise
the original geometry is kept and the issue remains in `unfixed`.

::: warning
The `buffer(0)` repair is planar while validation uses spherical intersection tests. Some configurations, notably
around the antimeridian, may therefore remain unfixable.
:::

```js
const geoJson = {
  type: 'Polygon',
  coordinates: [[[0, 0], [2, 2], [0, 2], [2, 0], [0, 0]]]
}

const validation = validateGeoJson(geoJson)
fixGeoJson(geoJson, { validation })

// {
//   fixed: geoJson,
//   corrections: [{ code: 'SELF_INTERSECTION', path: '' }],
//   unfixed: []
// }
```

A hole intersecting its shell is handled by the same topological rebuild:

```js
const validation = validateGeoJson(geoJson)

fixGeoJson(geoJson, {
  validation,
  holeIntersectsShell: true
})
```

#### Duplicate positions

Consecutive duplicate positions are removed, keeping the first occurrence of each run.

This applies to:

- `LineString`
- `MultiLineString`
- `Polygon`
- `MultiPolygon`

The `precision` option controls when two positions are considered identical during deduplication.

```js
const geoJson = {
  type: 'LineString',
  coordinates: [[0, 0], [1, 1], [1, 1], [2, 2]]
}

const validation = validateGeoJson(geoJson)
fixGeoJson(geoJson, { validation })

// {
//   fixed: geoJson,
//   corrections: [{ code: 'DUPLICATE_POSITION', path: '' }],
//   unfixed: []
// }
```

Duplicate removal is performed before topological repairs.

If removing a duplicate also resolves a previously reported self-intersection or hole/shell intersection,
that issue is reported as corrected without running `buffer(0)`.

```js
const geoJson = {
  type: 'Polygon',
  coordinates: [[[0, 0], [10, 0], [10, 0], [10, 10], [0, 10], [0, 0]]]
}

const validation = validateGeoJson(geoJson)
fixGeoJson(geoJson, { validation })

// {
//   fixed: geoJson,
//   corrections: [
//     { code: 'DUPLICATE_POSITION', path: '' },
//     { code: 'SELF_INTERSECTION', path: '' }
//   ],
//   unfixed: []
// }
```

#### Unfixable issues are reported, not silently dropped

```js
const geoJson = {
  type: 'Polygon',
  coordinates: [[[0, 0], [0, 1], [1, 1], [1, 0], [0, 0]]],
  bbox: [200, -200, 210, -190]
}

const validation = validateGeoJson(geoJson)
fixGeoJson(geoJson, { validation })

// {
//   fixed: geoJson,
//   corrections: [{ code: 'INVALID_WINDING_ORDER', path: '' }],
//   unfixed: [
//     {
//       code: 'INVALID_BBOX_LATITUDE_ORDER',
//       path: '/bbox',
//       params: { south: -200, north: -190 }
//     }
//   ]
// }
```

#### Disabling a correction

Each repair type can be disabled independently.

```js
const validation = validateGeoJson(geoJson)

fixGeoJson(geoJson, {
  validation,
  windingOrder: false
})

// winding order issue moves to `unfixed`
```

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `geoJson` | `object` | yes | Any GeoJSON object: a geometry, a `Feature`, or a `FeatureCollection` |
| `options` | `object` | yes | Fix options |
| `options.validation` | `object` | yes | Result of `validateGeoJson(geoJson)` |
| `options.windingOrder` | `boolean` | no | Whether to fix winding order issues (default: `true`) |
| `options.selfIntersection` | `boolean` | no | Whether to fix self-intersection issues (default: `true`) |
| `options.holeIntersectsShell` | `boolean` | no | Whether to fix hole/shell intersection issues (default: `true`) |
| `options.duplicatePosition` | `boolean` | no | Whether to remove consecutive duplicate positions (default: `true`) |
| `options.precision` | `number` | no | Coordinate precision used when comparing positions during deduplication (default: `DEFAULT_COORDINATE_PRECISION`) |

### Returns

| Type | Description |
|------|-------------|
| `object` | `{ fixed, corrections, unfixed }` |

### Throws

Throws if:

- `geoJson` is not a GeoJSON-like object;
- `options` does not match the expected shape;
- `options.validation` is missing.

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
```

A `Feature` reports corrections under `/geometry`:

```js
const feature = {
  type: 'Feature',
  properties: {},
  geometry: {
    type: 'Polygon',
    coordinates: [[[0, 0], [0, 1], [1, 1], [1, 0], [0, 0]]]
  }
}

fixGeoJson(feature, {
  validation: validateGeoJson(feature)
})

// corrections: [{ code: 'INVALID_WINDING_ORDER', path: '/geometry' }]
```

A `FeatureCollection` reports the path of each corrected geometry:

```js
const collection = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'Polygon',
        coordinates: [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]]
      }
    },
    {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'Polygon',
        coordinates: [[[0, 0], [0, 1], [1, 1], [1, 0], [0, 0]]]
      }
    }
  ]
}

fixGeoJson(collection, {
  validation: validateGeoJson(collection)
})

// corrections:
// [{ code: 'INVALID_WINDING_ORDER', path: '/features/1/geometry' }]
```

A `LineString` with a duplicate position:

```js
const line = {
  type: 'LineString',
  coordinates: [[0, 0], [1, 1], [1, 1], [2, 2]]
}

fixGeoJson(line, {
  validation: validateGeoJson(line)
})

// corrections: [{ code: 'DUPLICATE_POSITION', path: '' }]
```

Individual corrections can be disabled:

```js
fixGeoJson(geoJson, {
  validation,
  selfIntersection: false
})

fixGeoJson(geoJson, {
  validation,
  holeIntersectsShell: false
})

fixGeoJson(geoJson, {
  validation,
  duplicatePosition: false
})
```

A custom precision can be used for duplicate position comparison:

```js
fixGeoJson(geoJson, {
  validation,
  precision: 6
})
```
