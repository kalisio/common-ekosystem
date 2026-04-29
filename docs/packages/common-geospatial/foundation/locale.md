---
title: locale
description: Locale management for direction labels and symbols.
---

# locale

Manages the active locale used by direction helpers. Two locales are built in (`en` and `fr`). Additional locales can be registered at runtime. The default locale is `en`.

Each locale must conform to the following schema:

```js
{
  DIRECTIONS: {
    NORTH: { label: string, symbol: string },
    SOUTH: { label: string, symbol: string },
    EAST:  { label: string, symbol: string },
    WEST:  { label: string, symbol: string }
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

Throws if `code` is not a string, if `code` is already registered, if `content` is not a plain object, or if `content` does not conform to the locale schema.

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
getLocale().code   // 'fr'
```

## getLocale

### Signature

```js
getLocale()
```

### Description

Returns the currently active locale code and its content.

### Returns

| Type | Description |
|------|-------------|
| `object` | Object with `code` and `content` properties |
| `result.code` | `string` — the active locale code |
| `result.content` | `object` — the locale content conforming to the locale schema |

### Examples

```js
getLocale()
// {
//   code: 'en',
//   content: {
//     DIRECTIONS: {
//       NORTH: { label: 'North', symbol: 'N' },
//       SOUTH: { label: 'South', symbol: 'S' },
//       EAST:  { label: 'East',  symbol: 'E' },
//       WEST:  { label: 'West',  symbol: 'W' }
//     }
//   }
// }
```