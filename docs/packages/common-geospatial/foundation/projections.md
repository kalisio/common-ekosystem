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

| Type       | Description                          |
| ---------- | ------------------------------------ |
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

| Name         | Type               | Required | Description                                  |
| ------------ | ------------------ | -------- | -------------------------------------------- |
| `name`       | `string`           | yes      | Projection name (for example `EPSG:2154`)    |
| `definition` | `string \| object` | yes      | Proj4 definition string or definition object |

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

isWGS84Projection('UNKNOWN')
// false
```
