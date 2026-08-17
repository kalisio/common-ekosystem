---
title: projections
description: Registration, normalization, and lookup of coordinate reference system (CRS) definitions using proj4.
---

# projections

This module wraps **proj4** to manage coordinate reference system (CRS) definitions.

The `WGS84` constant (`'WGS84'`) is the canonical name used by the library for the
WGS84 geographic coordinate reference system.

In addition to the projections provided by proj4, several common projections and
WGS84 aliases are automatically registered when the module is loaded.

The following projections are available by default:

| Name        | Description                  |
| ----------- | ---------------------------- |
| `WGS84`     | WGS84 geographic CRS         |
| `EPSG:4326` | WGS84 geographic CRS         |
| `CRS:84`    | OGC WGS84 geographic CRS     |
| `CRS84`     | Alias for `CRS:84`           |
| `EPSG:3857` | Web Mercator                 |
| `EPSG:2154` | RGF93 / Lambert-93            |

Common OGC URN aliases for WGS84 are also supported.

Additional projections can be registered using `defineProjection()`.

## normalizeCrsName

### Signature

```js
normalizeCrsName(name)
```

### Description

Normalizes an OGC EPSG URN to its short `EPSG:<code>` form.

Other CRS names are returned unchanged.

### Parameters

| Name   | Type     | Required | Description           |
| ------ | -------- | -------- | --------------------- |
| `name` | `string` | yes      | CRS name to normalize |

### Returns

| Type     | Description             |
| -------- | ----------------------- |
| `string` | The normalized CRS name |

### Throws

Throws if `name` is not a non-empty string.

### Examples

```js
normalizeCrsName('urn:ogc:def:crs:EPSG::2154')
// 'EPSG:2154'

normalizeCrsName('EPSG:2154')
// 'EPSG:2154'

normalizeCrsName('CRS:84')
// 'CRS:84'
```

## listProjections

### Signature

```js
listProjections()
```

### Description

Returns the names of all registered projections.

This includes projections provided by proj4, projections registered by
`common-geospatial`, and projections added through `defineProjection()`.

### Returns

| Type       | Description                          |
| ---------- | ------------------------------------ |
| `string[]` | Array of registered projection names |

### Examples

```js
listProjections()
// ['EPSG:4326', 'EPSG:3857', 'WGS84', 'CRS:84', 'EPSG:2154', ...]
```

## defineProjection

### Signature

```js
defineProjection(name, definition)
```

### Description

Defines a projection under the given name.

The definition may be either a Proj4 definition string or a Proj4 definition object.
If a projection with the same name already exists, it is replaced.

### Parameters

| Name         | Type               | Required | Description                                  |
| ------------ | ------------------ | -------- | -------------------------------------------- |
| `name`       | `string`           | yes      | Projection name, for example `EPSG:2154`     |
| `definition` | `string \| object` | yes      | Proj4 definition string or definition object |

### Throws

Throws if `name` is not a non-empty string or if `definition` is neither a non-empty string nor a non-empty object.

### Examples

```js
defineProjection(
  'EPSG:32631',
  '+proj=utm +zone=31 +datum=WGS84 +units=m +no_defs'
)
```

## hasProjection

### Signature

```js
hasProjection(name)
```

### Description

Returns whether a projection with the given name is defined.

### Parameters

| Name   | Type     | Required | Description     |
| ------ | -------- | -------- | --------------- |
| `name` | `string` | yes      | Projection name |

### Returns

| Type      | Description                     |
| --------- | ------------------------------- |
| `boolean` | `true` if the projection exists |

### Throws

Throws if `name` is not a non-empty string.

### Examples

```js
hasProjection('EPSG:2154')
// true

hasProjection('UNKNOWN')
// false
```

## getProjection

### Signature

```js
getProjection(name)
```

### Description

Returns the Proj4 definition associated with the given projection name.

### Parameters

| Name   | Type     | Required | Description     |
| ------ | -------- | -------- | --------------- |
| `name` | `string` | yes      | Projection name |

### Returns

| Type                  | Description                                                            |
| --------------------- | ---------------------------------------------------------------------- |
| `object \| undefined` | Projection definition, or `undefined` if the projection is not defined |

### Throws

Throws if `name` is not a non-empty string.

### Examples

```js
getProjection('EPSG:2154')
// { projName: 'lcc', ... }

getProjection('UNKNOWN')
// undefined
```

## isWGS84Projection

### Signature

```js
isWGS84Projection(name)
```

### Description

Returns whether the specified registered projection is equivalent to the WGS84 geographic coordinate reference system.

The comparison is performed against the registered `EPSG:4326` definition.

### Parameters

| Name   | Type     | Required | Description     |
| ------ | -------- | -------- | --------------- |
| `name` | `string` | yes      | Projection name |

### Returns

| Type      | Description                                     |
| --------- | ----------------------------------------------- |
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

isWGS84Projection('EPSG:2154')
// false

isWGS84Projection('UNKNOWN')
// false
```