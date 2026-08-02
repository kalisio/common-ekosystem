---
title: localization
description: Locale and localized message management.
---

# localization

This module manages the localization of the library.

Two locales are built in (`en` and `fr`). Each locale contains localized resources such as direction labels, symbols and validation messages. Additional locales can be registered at runtime.

The default locale is `en`.

## Active locale and fallback

The active locale is mutable (`setLocale`) and controls the language used by locale-aware functions.

When a localized resource is requested, the active locale is used first. If the resource is not available, the fallback locale (`en`) is used automatically.

The ordered list of locales considered during lookup is exposed by `getActiveLocales()`.

## Locale schema

Each locale must conform to the following schema.

```js
{
  DIRECTIONS: {
    NORTH: { label: string, symbol: char },
    SOUTH: { label: string, symbol: char },
    EAST:  { label: string, symbol: char },
    WEST:  { label: string, symbol: char }
  },

  VALIDATION: {
    EMPTY_OBJECT: string,
    UNKNOWN_TYPE: string,
    MISSING_GEOMETRY: string,
    ...
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
listLocales()
// ['en', 'fr']
```

---

## registerMessages

### Signature

```js
registerMessages(code, messages)
```

### Description

Registers the localized messages for a new locale.

The locale code must not already exist. The localized messages must conform to the locale schema.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `code` | `string` | yes | Unique locale code (for example `'de'`) |
| `messages` | `object` | yes | Localized resources conforming to the locale schema |

### Throws

Throws if:

- `code` is not a string;
- `code` is already registered;
- `messages` is not an object;
- `messages` does not conform to the locale schema.

### Examples

```js
registerMessages('de', {
  DIRECTIONS: {
    NORTH: { label: 'Nord', symbol: 'N' },
    SOUTH: { label: 'Süd', symbol: 'S' },
    EAST:  { label: 'Ost', symbol: 'O' },
    WEST:  { label: 'West', symbol: 'W' }
  },

  VALIDATION: {
    EMPTY_OBJECT: 'Objekt ist leer',
    UNKNOWN_TYPE: 'Unbekannter GeoJSON-Typ',
    ...
  }
})

listLocales()
// ['en', 'fr', 'de']
```

---

## setLocale

### Signature

```js
setLocale(code)
```

### Description

Sets the active locale.

All locale-aware functions use this locale when returning localized resources.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `code` | `string` | yes | Registered locale code |

### Throws

Throws if `code` is not a string or is not registered.

### Examples

```js
setLocale('fr')

getLocale()
// 'fr'
```

---

## getLocale

### Signature

```js
getLocale()
```

### Description

Returns the currently active locale code.

### Returns

| Type | Description |
|------|-------------|
| `string` | Active locale code |

### Examples

```js
getLocale()
// 'en'
```

---

## getMessages

### Signature

```js
getMessages(code)
```

### Description

Returns the localized resources associated with a locale.

This function is independent of the active locale.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `code` | `string` | yes | Registered locale code |

### Returns

| Type | Description |
|------|-------------|
| `object` | Localized resources |

### Throws

Throws if `code` is not a string or is not registered.

### Examples

```js
getMessages('en')

// {
//   DIRECTIONS: {
//     NORTH: { label: 'North', symbol: 'N' },
//     SOUTH: { label: 'South', symbol: 'S' },
//     EAST:  { label: 'East', symbol: 'E' },
//     WEST:  { label: 'West', symbol: 'W' }
//   },
//
//   VALIDATION: {
//     EMPTY_OBJECT: 'Object is empty',
//     ...
//   }
// }
```

---

## getActiveLocales

### Signature

```js
getActiveLocales()
```

### Description

Returns the ordered list of locale codes used during localized resource lookup.

The active locale is always returned first. If it differs from the fallback locale (`en`), the fallback locale is appended.

### Returns

| Type | Description |
|------|-------------|
| `string[]` | Active locale codes |

### Examples

```js
setLocale('fr')

getActiveLocales()
// ['fr', 'en']

setLocale('en')

getActiveLocales()
// ['en']
```

---

## Localization lookup

Most localization-aware helpers iterate over the locales returned by `getActiveLocales()` until a matching resource is found.

For example:

```js
for (const locale of getActiveLocales()) {
  const message = getMessages(locale).VALIDATION[code]
  if (message) return message
}
```

This guarantees that localized resources remain available even when a translation is missing from the active locale.