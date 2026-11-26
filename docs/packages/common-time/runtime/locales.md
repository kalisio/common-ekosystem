---
title: Time locales
description: Register and load formatting locales using common-core.
---

# Time locales

The [common-core locale registry](../../common-core/runtime/locales.md) owns the current locale and fallback. Initialize the shared registry before registering or loading time locales. Pass the returned Moment locale code as the `locale` option for [custom date parsing](../utilities/date.md#parse), formatting, or locale-dependent week boundaries. Those operations default to English.

```js
import { setup as setupCore } from '@kalisio/common-core/setup'
import { DateTime, loadTimeLocale, registerTimeLocales } from '@kalisio/common-time'
```

## registerTimeLocales

### Signature

```js
registerTimeLocales()
```

### Description

Registers resources for English (`en`) and French (`fr`) under the `common-time` namespace. French is loaded on demand. Register these resources again if the application replaces the shared locale registry.

### Returns

| Type | Description |
|------|-------------|
| `undefined` | Registration is synchronous. |

## loadTimeLocale

### Signature

```js
loadTimeLocale(code)
```

### Description

Loads the first matching resource using the registry’s resolution order. For example, `fr-CA` can resolve to `fr`. The registry supplies the fallback and resolves contributions of the same specificity newest first.

### Parameters

| Name | Type | Description |
|------|------|-------------|
| `code` | `string` | Optional locale preference. Defaults to the registry’s current locale. |

### Returns

| Type | Description |
|------|-------------|
| `Promise<string>` | Loaded Moment locale code to pass as the `locale` option. |

### Throws

Rejects with a `RangeError` if no resource matches or the selected Moment locale is unavailable after loading. An invalid locale descriptor or a non-function loader causes a `TypeError`. Errors from the loader propagate to the caller.

### Examples

```js
setupCore({ locales: { default: 'fr-CA', fallback: 'en' } })
registerTimeLocales()

const locale = await loadTimeLocale()
new DateTime('2026-11-20').format('MMMM', { locale })
// 'novembre'
```
