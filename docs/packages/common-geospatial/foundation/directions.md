---
title: directions
description: Locale-aware cardinal direction helpers for geographic coordinates.
---

# directions

Direction labels and symbols are locale-aware. Initialize the locale registry and catalogs as described in [setup](../setup.md). Each direction has a `label` and a `symbol`.

Display helpers use the catalog resolved for the current locale. Predicates and symbol helpers use the catalogs resolved for all registered locales, with the registry's fallback rules. The examples assume English and French are registered, with English selected initially.

```js
import { getLocales } from '@kalisio/common-core/runtime'
```

## getDirections

### Signature

```js
getDirections (axis = null)
```

### Description

Returns the list of cardinal directions for a given axis, or all four directions if no axis is provided. Uses the current locale.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `axis` | `string` | no | An axis value from `AXES`. If provided, filters directions to that axis |

### Returns

| Type | Description |
|------|-------------|
| `object[]` | Array of direction objects, each with `label` and `symbol` properties |

### Throws

Throws if `axis` is provided but is not a valid axis.

### Examples

```js
// All directions
getDirections()
// [{ label: 'South', symbol: 'S' }, { label: 'North', symbol: 'N' }, { label: 'East', symbol: 'E' }, { label: 'West', symbol: 'W' }]

// Latitude directions only
getDirections(AXES.LATITUDE)
// [{ label: 'South', symbol: 'S' }, { label: 'North', symbol: 'N' }]

// Longitude directions only
getDirections(AXES.LONGITUDE)
// [{ label: 'East', symbol: 'E' }, { label: 'West', symbol: 'W' }]
```

## getNorth / getSouth / getEast / getWest

### Signature

```js
getNorth ()
getSouth ()
getEast ()
getWest ()
```

### Description

Returns the direction object for the corresponding cardinal direction in the current locale.

### Returns

| Type | Description |
|------|-------------|
| `object` | Direction object with `label` and `symbol` properties |

### Examples

```js
getNorth()   // { label: 'North', symbol: 'N' }
getSouth()   // { label: 'South', symbol: 'S' }
getEast()    // { label: 'East', symbol: 'E' }
getWest()    // { label: 'West', symbol: 'W' }

getLocales().setCurrent('fr')
getWest()    // { label: 'Ouest', symbol: 'O' }
```

## isValidDirection

### Signature

```js
isValidDirection (dir)
```

### Description

Returns `true` if `dir` matches any cardinal direction (North, South, East, or West), either by label or symbol, in the catalogs resolved for registered locales. The comparison is case-insensitive.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `dir` | `string` | yes | Value to check |

### Returns

| Type | Description |
|------|-------------|
| `boolean` | `true` if the value is a recognized direction |

### Examples

```js
isValidDirection('N')      // true
isValidDirection('North')  // true
isValidDirection('north')  // true
isValidDirection('X')      // false

getLocales().setCurrent('fr')
isValidDirection('O')      // true — current locale (Ouest)
isValidDirection('W')      // true — English is registered
```

## isNorth / isSouth / isEast / isWest

### Signature

```js
isNorth (dir)
isSouth (dir)
isEast (dir)
isWest (dir)
```

### Description

Returns `true` if `dir` matches the corresponding cardinal direction, either by label or symbol, in the catalogs resolved for registered locales. The comparison is case-insensitive.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `dir` | `string` | yes | Value to check |

### Returns

| Type | Description |
|------|-------------|
| `boolean` | `true` if the value matches the direction |

### Examples

```js
isNorth('N')       // true
isNorth('North')   // true
isNorth('north')   // true
isNorth('S')       // false

isSouth('S')       // true
isEast('E')        // true
isWest('W')        // true

getLocales().setCurrent('fr')
isWest('O')        // true — current locale (Ouest)
isWest('W')        // true — English is registered
```

## getDirectionAxis

### Signature

```js
getDirectionAxis (dir)
```

### Description

Returns the axis associated with a cardinal direction. East and West map to `AXES.LONGITUDE`, North and South map to `AXES.LATITUDE`. Recognizes directions from the catalogs resolved for registered locales.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `dir` | `string` | yes | A recognized cardinal direction label or symbol |

### Returns

| Type | Description |
|------|-------------|
| `string` | An axis value from `AXES` |

### Throws

Throws if `dir` is not a valid direction.

### Examples

```js
getDirectionAxis('N')   // 'LAT'
getDirectionAxis('S')   // 'LAT'
getDirectionAxis('E')   // 'LON'
getDirectionAxis('W')   // 'LON'

getLocales().setCurrent('fr')
getDirectionAxis('O')   // 'LON' — Ouest
```

## getDirectionSymbols

### Signature

```js
getDirectionSymbols(axis = null)
```

### Description

Returns the direction symbols recognized for the specified axis across the catalogs resolved for registered locales.

When no axis is specified, symbols for all directions are returned.

### Parameters

| Name   | Type             | Required | Description                                                                                     |
| ------ | ---------------- | -------- | ----------------------------------------------------------------------------------------------- |
| `axis` | `string \| null` | no       | Axis used to filter direction symbols (`AXES.LATITUDE` or `AXES.LONGITUDE`), or `null` for all directions |

### Returns

| Type       | Description                      |
| ---------- | -------------------------------- |
| `string[]` | The recognized direction symbols |

### Examples

```js
getDirectionSymbols(AXES.LONGITUDE)
// ['E', 'W', ...]

getDirectionSymbols(AXES.LATITUDE)
// ['N', 'S', ...]

getDirectionSymbols()
// ['N', 'S', 'E', 'W', ...]
```

## getDirectionPattern

### Signature

```js
getDirectionPattern(axis = null)
```

### Parameters

| Name | Type | Required | Description |
|---|---|---|---|
| `axis` | `string \| null` | no | Axis from `AXES`, or `null` for all directions. |

### Returns

| Type | Description |
|---|---|
| `string` | Recognized direction symbols escaped for use in a regular expression and joined with `\|`. The altitude axis returns an empty string. |

### Example

```js
getDirectionPattern(AXES.LATITUDE) // 'N|S' with the built-in catalogs
```
