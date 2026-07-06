---
title: truncate
description: Truncate the coordinates of any GeoJSON object and remove duplicate polygon vertices.
---

# truncate

## truncateGeoJson

### Signature

```js
truncateGeoJson(geoJson, options = {})
```

### Description

Truncates every coordinate of a GeoJSON object to a fixed decimal precision, and removes duplicate consecutive vertices from polygon rings. It accepts any GeoJSON type: a geometry, a `GeometryCollection`, a `Feature`, or a `FeatureCollection`. Bounding boxes found at any level are truncated as well.

Rounding coordinates can bring two distinct vertices onto the same point. On polygon rings this produces duplicate consecutive positions, which invalidate a geometry for MongoDB's `2dsphere` index (S2). To prevent this, `truncateGeoJson` deduplicates consecutive positions on each polygon ring after truncation, and re-closes the ring when the closing point was among those dropped.

Deduplication applies **only** to polygon rings (`Polygon` and `MultiPolygon`). Positions of `LineString`, `MultiLineString` and `MultiPoint` are truncated but never deduplicated, since a line may legitimately revisit the same point and S2 rejects duplicates only on rings.

This operator normalizes precision; it does not repair topology. If deduplication leaves a ring with fewer than four positions, the ring is left as is: detecting and repairing a degenerate ring is the responsibility of the `validate` and `fix` operators.

::: warning Mutation
`truncateGeoJson` mutates the input object in place and returns the same reference.
:::

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `geoJson` | `object` | yes | Any valid GeoJSON object |
| `options.precision` | `number` | no | Number of decimal digits to keep, in range `[0, MAX_COORDINATE_PRECISION]` (default: `DEFAULT_COORDINATE_PRECISION`) |
| `options.consider3D` | `boolean` | no | When `true`, altitude is taken into account when deduplicating ring vertices (default: `false`) |

::: tip Note on `consider3D`
By default (`consider3D: false`), two ring vertices sharing the same longitude and latitude are treated as duplicates even if their altitudes differ, and one is dropped. This matches how S2 indexes geometry, using longitude and latitude only. Set `consider3D: true` to keep vertices that differ solely in altitude. This option is forwarded to `isSamePosition`.
:::

### Returns

| Type | Description |
|------|-------------|
| `object` | The same GeoJSON object, mutated |

### Throws

Throws if `geoJson` is not a valid GeoJSON object, or if `precision` is not in range `[0, MAX_COORDINATE_PRECISION]`.

### Examples

Truncating a point geometry:

```js
truncateGeoJson({ type: 'Point', coordinates: [10.123456789, 20.987654321] })
// { type: 'Point', coordinates: [10.1234568, 20.9876543] }
```

Custom precision through options:

```js
truncateGeoJson(geometry, { precision: 3 })
```

Deduplicating collapsed ring vertices:

```js
const polygon = {
  type: 'Polygon',
  coordinates: [[
    [0, 0],
    [2, 0.0001],
    [2, 0.0002],
    [2, 1],
    [0, 1],
    [0, 0]
  ]]
}
truncateGeoJson(polygon, { precision: 3 })
// The two middle vertices both round to [2, 0]; one is removed and the ring stays closed.
```

Keeping altitude-distinct vertices:

```js
truncateGeoJson(polygon3D, { consider3D: true })
// Vertices equal in lon/lat but differing in altitude are preserved.
```