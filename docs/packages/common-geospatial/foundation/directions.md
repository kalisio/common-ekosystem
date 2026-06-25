---
title: directions
description: Locale-aware cardinal direction helpers for geographic coordinates.
---

# directions

Direction labels and symbols are locale-aware — they depend on the current locale set via [`setLocale`](./localization.md). Each direction has a `label` (full name) and a `symbol` (abbreviated form), and comparisons are case-insensitive.

Two behaviours differ across this module:

- **Display helpers** (`getDirections`, `getNorth`, `getSouth`, `getEast`, `getWest`) use the **current locale only**.
- **Validation predicates** (`isDirection`, `isNorth`, `isSouth`, `isEast`, `isWest`, `getDirectionAxis`) accept the current locale **plus** the fallback (`en`). A hard-coded `'W'` is therefore a valid direction even under the `fr` locale (where West is displayed as `'O'`). See [`getActiveLocales`](./localization.md) for the exact set considered.

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

setLocale('fr')
getWest()    // { label: 'Ouest', symbol: 'O' }
```

## isDirection

### Signature

```js
isDirection (dir)
```

### Description

Returns `true` if `dir` matches any cardinal direction (North, South, East, or West), either by label or symbol, in the current locale **or** the fallback (`en`). The comparison is case-insensitive.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `dir` | `string` | yes | Value to check |

### Returns

| Type | Description |
|------|-------------|
| `boolean` | `true` if the value is a recognized direction |

### Throws

Throws if `dir` is not a string.

### Examples

```js
isDirection('N')      // true
isDirection('North')  // true
isDirection('north')  // true
isDirection('X')      // false

setLocale('fr')
isDirection('O')      // true — current locale (Ouest)
isDirection('W')      // true — en fallback
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

Returns `true` if `dir` matches the corresponding cardinal direction, either by label or symbol, in the current locale **or** the fallback (`en`). The comparison is case-insensitive.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `dir` | `string` | yes | Value to check |

### Returns

| Type | Description |
|------|-------------|
| `boolean` | `true` if the value matches the direction |

### Throws

Throws if `dir` is not a string.

### Examples

```js
isNorth('N')       // true
isNorth('North')   // true
isNorth('north')   // true
isNorth('S')       // false

isSouth('S')       // true
isEast('E')        // true
isWest('W')        // true

setLocale('fr')
isWest('O')        // true — current locale (Ouest)
isWest('W')        // true — en fallback
```

## getDirectionAxis

### Signature

```js
getDirectionAxis (dir)
```

### Description

Returns the axis associated with a cardinal direction. East and West map to `AXES.LONGITUDE`, North and South map to `AXES.LATITUDE`. Recognizes directions from the current locale or the fallback (`en`).

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

setLocale('fr')
getDirectionAxis('O')   // 'LON' — Ouest
```