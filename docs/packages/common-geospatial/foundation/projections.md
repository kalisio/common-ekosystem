---
title: projections
description: Registration and lookup of coordinate reference system (CRS) definitions using proj4.
---

# projections

This module wraps **proj4** to manage coordinate reference system (CRS) definitions.

In addition to the projections provided by proj4, several common WGS84 aliases used by GeoJSON and OGC specifications are automatically registered when the module is loaded.

## listProjections

### Signature

```js
listProjections()
```

### Description

Returns the names of all registered projections.

This includes the projections built into proj4 as well as any projections defined through `defineProjection()`.

### Returns

| Type | Description |
|------|-------------|
| `string[]` | Array of registered projection names |

### Examples

```js
listProjections()
// ['EPSG:4326', 'CRS:84', 'EPSG:3857', ...]
```

---

## defineProjection

### Signature

```js
defineProjection(name, definition)
```

### Description

Defines a projection under the given name.

The definition may be either a Proj4 definition string or a Proj4 definition object. If a projection with the same name already exists, it is replaced.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `name` | `string` | yes | Projection name (for example `EPSG:2154`) |
| `definition` | `string \| object` | yes | Proj4 definition string or definition object |

### Throws

Throws if `name` is not a non-empty string or if `definition` is neither a non-empty string nor a non-empty object.

### Examples

```js
defineProjection(
  'EPSG:2154',
  '+proj=lcc +lat_1=49 +lat_2=44 +lat_0=46.5 ...'
)

defineProjection(
  'MY_PROJECTION',
  {
    proj: 'merc',
    datumCode: 'WGS84'
  }
)
```

---

## hasProjection

### Signature

```js
hasProjection(name)
```

### Description

Returns whether a projection with the given name is defined.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `name` | `string` | yes | Projection name |

### Returns

| Type | Description |
|------|-------------|
| `boolean` | `true` if the projection exists |

### Throws

Throws if `name` is not a non-empty string.

### Examples

```js
hasProjection('EPSG:4326')
// true

hasProjection('EPSG:2154')
// true

hasProjection('UNKNOWN')
// false
```

---

## getProjection

### Signature

```js
getProjection(name)
```

### Description

Returns the Proj4 definition associated with the given projection name.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `name` | `string` | yes | Projection name |

### Returns

| Type | Description |
|------|-------------|
| `object \| undefined` | Projection definition, or `undefined` if the projection is not defined |

### Throws

Throws if `name` is not a non-empty string.

### Examples

```js
getProjection('EPSG:4326')
// { projName: 'longlat', datumCode: 'WGS84', ... }

getProjection('UNKNOWN')
// undefined
```

---

## isWGS84Projection

### Signature

```js
isWGS84Projection(name)
```

### Description

Returns whether the specified projection is equivalent to the WGS84 geographic coordinate reference system.

The comparison is performed against the registered `EPSG:4326` definition.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `name` | `string` | yes | Projection name |

### Returns

| Type | Description |
|------|-------------|
| `boolean` | `true` if the projection is equivalent to WGS84 |

### Throws

Throws if `name` is not a non-empty string.

### Examples

```js
isWGS84Projection('EPSG:4326')
// true

isWGS84Projection('CRS:84')
// true

isWGS84Projection('EPSG:3857')
// false

isWGS84Projection('UNKNOWN')
// false
```

::: tip WGS84 aliases
When this module is loaded, the following aliases are automatically defined if they are not already known by proj4:

- `CRS:84`
- `CRS84`
- `WGS84`
- `urn:ogc:def:crs:OGC:1.3:CRS84`
- `urn:ogc:def:crs:OGC:2:84`
- `urn:ogc:def:crs:EPSG::4326`

These aliases are all considered equivalent to `EPSG:4326`.
:::

## transformCoordinates

### Signature

```js
transformCoordinates(coordinates, source, target)
```

### Description

Transforms a coordinate tuple from one coordinate reference system (CRS) to another.

The source and target projections must be registered beforehand using `defineProjection()`. Built-in projections and registered WGS84 aliases are available automatically.

The function accepts both 2D (`[x, y]`) and 3D (`[x, y, z]`) coordinate tuples. When a third coordinate is present, it is preserved and transformed if supported by the underlying projection.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `coordinates` | `number[]` | yes | A coordinate tuple containing 2 or 3 finite numbers |
| `source` | `string` | yes | Source projection name |
| `target` | `string` | yes | Target projection name |

### Returns

| Type | Description |
|------|-------------|
| `number[]` | The transformed coordinate tuple |

### Throws

Throws if:

- `coordinates` is not a valid coordinate tuple;
- `source` is not a registered projection;
- `target` is not a registered projection.

### Examples

```js
transformCoordinates(
  [2.3522, 48.8566],
  'EPSG:4326',
  'EPSG:3857'
)
// [261845.7..., 6250564.3...]

transformCoordinates(
  [261845.7, 6250564.3],
  'EPSG:3857',
  'EPSG:4326'
)
// [2.3522, 48.8566]

transformCoordinates(
  [700000, 6600000],
  'EPSG:2154',
  'EPSG:4326'
)
// [3.0..., 46.5...]
```
