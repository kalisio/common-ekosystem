---
title: Time locales
description: Register and load formatting locales using common-core.
---

# Time locales

The [common-core locale registry](../../common-core/runtime/locales.md) owns the current locale and fallback. Pass the loaded Moment locale code explicitly to format dates or compute locale-dependent week boundaries. These operations default to English. Importing a Moment locale can affect [custom date parsing](../utilities/date.md#parse).

```js
import { Locales } from '@kalisio/common-core/runtime'
import { DateTime, loadTimeLocale, registerTimeLocales } from '@kalisio/common-time'
```

## registerTimeLocales

### Signature

```js
registerTimeLocales(locales)
```

### Description

Registers resources for English (`en`) and French (`fr`) under the `common-time` namespace. French is loaded on demand.

### Parameters

| Name | Type | Description |
|------|------|-------------|
| `locales` | `Locales` | Application locale registry from common-core. |

### Returns

| Type | Description |
|------|-------------|
| `undefined` | Registration is synchronous. |

## loadTimeLocale

### Signature

```js
loadTimeLocale(locales, code)
```

### Description

Loads the first matching resource using the registry’s resolution order. For example, `fr-CA` can resolve to `fr`. The registry supplies the fallback and resolves contributions of the same specificity newest first.

### Parameters

| Name | Type | Description |
|------|------|-------------|
| `locales` | `Locales` | Registry with resources in the `common-time` namespace. |
| `code` | `string` | Optional locale preference. Defaults to the registry’s current locale. |

### Returns

| Type | Description |
|------|-------------|
| `Promise<string>` | Loaded Moment locale code to pass as the `locale` option. |

### Throws

Rejects if no resource matches, its locale or loader is invalid, or the loader fails to make the Moment locale available.

### Examples

```js
const locales = new Locales({ default: 'fr-CA' })
registerTimeLocales(locales)

const locale = await loadTimeLocale(locales)
new DateTime('2026-11-20').format('MMMM', { locale })
// 'novembre'
```
