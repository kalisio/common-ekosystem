---
title: string
description: Utility functions for normalizing, pattern matching, and transforming strings.
---

# string

## DIACRITICS

A map of base characters to their diacritic variants, used by `makeDiacriticPattern`.

```js
string.DIACRITICS = {
  a: 'aáàäâã',
  e: 'eéëèê',
  i: 'iíïìî',
  o: 'oóöòõô',
  u: 'uüúùû',
  c: 'cç'
}
```

---

## normalize

### Signature

```js
string.normalize(str, options = {})
```

### Description

Normalizes a string by optionally collapsing whitespace, stripping diacritics, and lowercasing. Transformations are applied in order: spaces → diacritics → case.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `str` | `string` | yes | The string to normalize |
| `options` | `object` | no | Normalization options |
| `options.ignoreSpaces` | `boolean` | no | Collapse consecutive whitespace and trim. Defaults to `false` |
| `options.ignoreDiacritics` | `boolean` | no | Strip diacritics using NFKD decomposition. Defaults to `false` |
| `options.ignoreCase` | `boolean` | no | Convert to lowercase. Defaults to `false` |
| `options.locale` | `string` | no | Locale passed to `toLocaleLowerCase` (e.g. `'fr-FR'`). Defaults to system locale |

### Returns

| Type | Description |
|------|-------------|
| `string` | The normalized string |

### Throws

Throws a `TypeError` if `str` is not a string.

### Examples

```js
string.normalize('  Héllo   World  ', { ignoreSpaces: true })
// 'Héllo World'

string.normalize('éàü', { ignoreDiacritics: true })
// 'eau'

string.normalize('Hello', { ignoreCase: true })
// 'hello'

string.normalize('  Héllo  ', { ignoreSpaces: true, ignoreDiacritics: true, ignoreCase: true })
// 'hello'
```

---

## makeDiacriticPattern

### Signature

```js
string.makeDiacriticPattern(pattern, options = {})
```

### Description

Converts a string into a regex-compatible pattern where each character is expanded to match all its diacritic variants. Useful for building case/accent-insensitive search patterns.

By default (`reverse: false`), only base characters (e.g. `a`) are expanded to their variants (`[aáàäâã]`). With `reverse: true`, any diacritic variant in the pattern is also expanded.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `pattern` | `string` | yes | The string to convert into a diacritic pattern |
| `options` | `object` | no | Options |
| `options.reverse` | `boolean` | no | If `true`, expands diacritic variants back to their family. Defaults to `false` |

### Returns

| Type | Description |
|------|-------------|
| `string` | A regex-compatible pattern string |

### Throws

Throws a `TypeError` if `pattern` is not a string.

### Examples

```js
string.makeDiacriticPattern('cafe')
// 'c[cç][aáàäâã]f[eéëèê]'

string.makeDiacriticPattern('café', { reverse: true })
// 'c[cç][aáàäâã]f[eéëèê]'

// Use in a regex
const pattern = string.makeDiacriticPattern('cafe')
new RegExp(pattern, 'i').test('Café') // true
```

---

## slugify

### Signature

```js
string.slugify(str, separator = '-')
```

### Description

Converts a string into a URL-friendly slug by stripping diacritics, lowercasing, and replacing non-alphanumeric characters with a separator. Leading and trailing separators are removed.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `str` | `string` | yes | The string to slugify |
| `separator` | `string` | no | A single character used as separator. Defaults to `'-'` |

### Returns

| Type | Description |
|------|-------------|
| `string` | The slugified string |

### Throws

Throws a `TypeError` if `str` is not a string or if `separator` is not a single character.

### Examples

```js
string.slugify('Hello World')
// 'hello-world'

string.slugify('Héllo Wörld')
// 'hello-world'

string.slugify('  Hello   World  ')
// 'hello-world'

string.slugify('Hello World', '_')
// 'hello_world'
```