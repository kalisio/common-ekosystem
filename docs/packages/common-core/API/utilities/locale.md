---
title: locale
description: Utilities to retrieve the current locale and its components.
---

# locale

## get

### Signature

```js
locale.get()
```

### Description

Returns the current locale string. In a browser environment, reads from `navigator.languages` with a fallback to `navigator.language`. In a non-browser environment (Node.js), falls back to `Intl.DateTimeFormat().resolvedOptions().locale`.

### Returns

| Type | Description |
|------|-------------|
| `string` | The current locale string (e.g. `'fr-FR'`, `'en-US'`) |

### Examples

```js
locale.get() // 'fr-FR'
```

---

## getCodes

### Signature

```js
locale.getCodes()
```

### Description

Parses the current locale and returns its components as an object.

### Returns

| Type | Description |
|------|-------------|
| `object` | An object with the locale components |
| `result.language` | `string` — The language code (e.g. `'fr'`, `'en'`) |
| `result.script` | `string \| undefined` — The script code if present (e.g. `'Latn'`) |
| `result.region` | `string \| undefined` — The region code if present (e.g. `'FR'`, `'US'`) |

### Examples

```js
locale.getCodes() // { language: 'fr', script: undefined, region: 'FR' }
locale.getCodes() // { language: 'zh', script: 'Hans', region: 'CN' }
```