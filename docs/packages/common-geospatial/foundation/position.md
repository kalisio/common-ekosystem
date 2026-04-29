---
title: parsePosition
description: Parse a coordinate pair string into a GeoJSON position.
---

# parsePosition

## Signature

```js
parsePosition(pattern)
```

## Description

Parses a string containing two coordinate values separated by a delimiter (`,`, `;`, or `|`) and returns a GeoJSON position `[longitude, latitude]`. Each part is parsed independently using `parseCoordinate`, and the axis of each value is inferred using `guessCoordinateAxis`.

If both axes can be determined unambiguously, the coordinates are reordered to `[longitude, latitude]` regardless of the input order. If neither axis can be determined (both values are in the `[-90, 90]` range with no direction hint), two candidate positions are returned.

Returns `null` if the pattern cannot be parsed.

## Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `pattern` | `string` | yes | A non-empty string containing two coordinate values separated by `,`, `;`, or `|` |

## Returns

| Type | Description |
|------|-------------|
| `number[]` | A GeoJSON position `[longitude, latitude]` |
| `number[][]` | Two candidate positions if the axis of both values is ambiguous |
| `null` | If the pattern cannot be parsed or does not contain exactly two values |

## Throws

Throws if `pattern` is not a non-empty string.

## Examples

```js
// Latitude, longitude with direction symbols
parsePosition('48.8566N, 2.3522E')
// [2.3522, 48.8566]
```

```js
// Longitude first
parsePosition('2.3522E, 48.8566N')
// [2.3522, 48.8566]
```

```js
// Plain decimal, unambiguous — one value > 90 is treated as longitude
parsePosition('48.8566, 120.5')
// [120.5, 48.8566]
```

```js
// Semicolon delimiter
parsePosition('48.8566N; 2.3522E')
// [2.3522, 48.8566]
```

```js
// Pipe delimiter
parsePosition('48.8566N | 2.3522E')
// [2.3522, 48.8566]
```

```js
// South and West directions produce negative values
parsePosition('34.6037S, 58.3816W')
// [-58.3816, -34.6037]
```

```js
// Ambiguous — both values in [-90, 90], no direction hint
parsePosition('45, 12')
// [[45, 12], [12, 45]]
```

```js
// Invalid — only one part
parsePosition('48.8566')
// null
```

```js
// Invalid — unparseable coordinate
parsePosition('abc, def')
// null
```