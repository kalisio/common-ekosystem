---
title: projections
description: Registration and lookup of coordinate reference system projections via proj4.
---

# projections

Wraps [proj4](https://github.com/proj4js/proj4js) to manage coordinate reference system (CRS) projection definitions. Projections can be registered by name and retrieved or checked later.

## listProjections

### Signature

```js
listProjections()
```

### Description

Returns the list of all registered projection names, including those built into proj4.

### Returns

| Type | Description |
|------|-------------|
| `string[]` | Array of projection names |

### Examples

```js
listProjections()   // ['WGS84', 'EPSG:4326', ...]
```

## registerProjection

### Signature

```js
registerProjection(name, def)
```

### Description

Registers a new projection definition under the given name. The definition can be a proj4 string or a configuration object.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `name` | `string` | yes | Unique projection name (e.g. `'EPSG:2154'`) |
| `def` | `string \| object` | yes | proj4 definition string or configuration object |

### Throws

Throws if `name` is not a non-empty string, or if `def` is neither a non-empty string nor a non-empty object.

### Examples

```js
// Register with a proj4 string
registerProjection('EPSG:2154', '+proj=lcc +lat_1=49 +lat_2=44 ...')

// Register with an object
registerProjection('EPSG:2154', { proj: 'lcc', lat1: 49, lat2: 44, ... })
```

## hasProjection

### Signature

```js
hasProjection(name)
```

### Description

Returns `true` if a projection with the given name is registered.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `name` | `string` | yes | Projection name to look up |

### Returns

| Type | Description |
|------|-------------|
| `boolean` | `true` if the projection is registered |

### Throws

Throws if `name` is not a non-empty string.

### Examples

```js
hasProjection('WGS84')      // true
hasProjection('EPSG:2154')  // true — if previously registered
hasProjection('unknown')    // false
```

## getProjection

### Signature

```js
getProjection(name)
```

### Description

Returns the proj4 definition object for the given projection name, or `undefined` if not found.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `name` | `string` | yes | Projection name to retrieve |

### Returns

| Type | Description |
|------|-------------|
| `object \| undefined` | The proj4 definition object, or `undefined` if not registered |

### Throws

Throws if `name` is not a non-empty string.

### Examples

```js
getProjection('WGS84')
// { projName: 'longlat', datum: 'WGS84', ... }

getProjection('unknown')
// undefined
```