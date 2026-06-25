---
title: localization
description: Locale management for direction labels and symbols.
---

# localization

Manages the active locale used by direction helpers. Two locales are built in (`en` and `fr`). Additional locales can be registered at runtime. The default locale is `en`.

## Active locale and fallback

The active locale is mutable (`setLocale`) and drives **display**: helpers that return labels or symbols (e.g. `getNorth`, `getDirections`) use the active locale only.

**Validation**, on the other hand, accepts the active locale **plus** a fallback (`en`). This means a hard-coded `'W'` stays a valid direction even when the active locale is `fr` (where West is `'O'`). The set of locales considered for validation is exposed by `getActiveLocales`.

## Locale schema

Each locale must conform to the following schema. Note that `symbol` must be a **single character**.

```js
{
  DIRECTIONS: {
    NORTH: { label: string, symbol: char },
    SOUTH: { label: string, symbol: char },
    EAST:  { label: string, symbol: char },
    WEST:  { label: string, symbol: char }
  }
}
```

## listLocales

### Signature

```js
listLocales()
```

### Description

Returns the list of registered locale codes.

### Returns

| Type | Description |
|------|-------------|
| `string[]` | Array of locale codes |

### Examples

```js
listLocales()   // ['en', 'fr']
```

## registerLocale

### Signature

```js
registerLocale(code, content)
```

### Description

Registers a new locale. The locale code must not already exist. The content must be a plain object conforming to the locale schema.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `code` | `string` | yes | Unique locale code (e.g. `'de'`) |
| `content` | `object` | yes | Locale content conforming to the locale schema |

### Throws

Throws if `code` is not a string, if `code` is already registered, if `content` is not a plain object, or if `content` does not conform to the locale schema (including a `symbol` that is not a single character).

### Examples

```js
registerLocale('de', {
  DIRECTIONS: {
    NORTH: { label: 'Nord', symbol: 'N' },
    SOUTH: { label: 'Süd', symbol: 'S' },
    EAST:  { label: 'Ost', symbol: 'O' },
    WEST:  { label: 'West', symbol: 'W' }
  }
})

listLocales()   // ['en', 'fr', 'de']
```

## setLocale

### Signature

```js
setLocale(code)
```

### Description

Sets the active locale. Affects all locale-aware functions such as direction helpers.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `code` | `string` | yes | A registered locale code |

### Throws

Throws if `code` is not a string or if `code` is not a registered locale.

### Examples

```js
setLocale('fr')
getLocale()   // 'fr'
```

## getLocale

### Signature

```js
getLocale()
```

### Description

Returns the currently active locale code. Resolve its content with `getLocaleByCode`.

### Returns

| Type | Description |
|------|-------------|
| `string` | The active locale code |

### Examples

```js
getLocale()                      // 'en'
getLocaleByCode(getLocale())     // the active locale content
```

## getLocaleByCode

### Signature

```js
getLocaleByCode(code)
```

### Description

Returns the content of a registered locale by its code. Independent of the active locale.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `code` | `string` | yes | A registered locale code |

### Returns

| Type | Description |
|------|-------------|
| `object` | The locale content conforming to the locale schema |

### Throws

Throws if `code` is not a string or if `code` is not a registered locale.

### Examples

```js
getLocaleByCode('en')
// {
//   DIRECTIONS: {
//     NORTH: { label: 'North', symbol: 'N' },
//     SOUTH: { label: 'South', symbol: 'S' },
//     EAST:  { label: 'East',  symbol: 'E' },
//     WEST:  { label: 'West',  symbol: 'W' }
//   }
// }
```

## getActiveLocales

### Signature

```js
getActiveLocales ()
```

### Description

Returns the locale codes considered for validation: the active locale plus the fallback (`en`), deduplicated. Resolve each to its content with `getLocaleByCode`.

### Returns

| Type | Description |
|------|-------------|
| `string[]` | Active locale codes (current + fallback) |

### Examples

```js
setLocale('fr')
getActiveLocales()   // ['fr', 'en']

setLocale('en')
getActiveLocales()   // ['en'] — current equals fallback, deduplicated
```

## getLatitudeSymbols

### Signature

```js
getLatitudeSymbols ()
```

### Description

Returns the distinct latitude symbols (NORTH/SOUTH) across the active locales (current + fallback).

### Returns

| Type | Description |
|------|-------------|
| `string[]` | Distinct latitude symbols |

### Examples

```js
setLocale('en')
getLatitudeSymbols()   // ['N', 'S']
```

## getLongitudeSymbols

### Signature

```js
getLongitudeSymbols ()
```

### Description

Returns the distinct longitude symbols (EAST/WEST) across the active locales (current + fallback).

### Returns

| Type | Description |
|------|-------------|
| `string[]` | Distinct longitude symbols |

### Examples

```js
setLocale('fr')
getLongitudeSymbols()   // ['E', 'O', 'W'] — fr (E, O) plus en fallback (W)
```

## getAllDirectionSymbols

### Signature

```js
getAllDirectionSymbols ()
```

### Description

Returns the distinct direction symbols for both axes across the active locales (current + fallback).

### Returns

| Type | Description |
|------|-------------|
| `string[]` | Distinct direction symbols |

### Examples

```js
setLocale('fr')
getAllDirectionSymbols()   // ['N', 'S', 'E', 'O', 'W']
```