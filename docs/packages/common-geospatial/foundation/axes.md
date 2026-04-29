---
title: axes
description: Constants and validators for geographic coordinate axes.
---

# axes

## Constants

### AXES

Enum-like object of supported coordinate axis identifiers.

```js
AXES = {
  LATITUDE: 'LAT',
  LONGITUDE: 'LON',
  ALTITUDE: 'ALT'
}
```

## isAxis

### Signature

```js
isAxis(axis)
```

### Description

Returns `true` if `axis` is a recognized axis value from `AXES`.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `axis` | `string` | yes | Value to check |

### Returns

| Type | Description |
|------|-------------|
| `boolean` | `true` if the value is a valid axis |

### Throws

Throws if `axis` is not a string.

### Examples

```js
isAxis('LAT')     // true
isAxis('LON')     // true
isAxis('ALT')     // true
isAxis('X')       // false
```

## isLatitude

### Signature

```js
isLatitude(axis)
```

### Description

Returns `true` if `axis` is the latitude axis (`'LAT'`).

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `axis` | `string` | yes | Value to check |

### Returns

| Type | Description |
|------|-------------|
| `boolean` | `true` if the axis is latitude |

### Throws

Throws if `axis` is not a string.

### Examples

```js
isLatitude('LAT')   // true
isLatitude('LON')   // false
```

## isLongitude

### Signature

```js
isLongitude(axis)
```

### Description

Returns `true` if `axis` is the longitude axis (`'LON'`).

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `axis` | `string` | yes | Value to check |

### Returns

| Type | Description |
|------|-------------|
| `boolean` | `true` if the axis is longitude |

### Throws

Throws if `axis` is not a string.

### Examples

```js
isLongitude('LON')   // true
isLongitude('LAT')   // false
```

## isAltitude

### Signature

```js
isAltitude(axis)
```

### Description

Returns `true` if `axis` is the altitude axis (`'ALT'`).

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `axis` | `string` | yes | Value to check |

### Returns

| Type | Description |
|------|-------------|
| `boolean` | `true` if the axis is altitude |

### Throws

Throws if `axis` is not a string.

### Examples

```js
isAltitude('ALT')   // true
isAltitude('LAT')   // false
```