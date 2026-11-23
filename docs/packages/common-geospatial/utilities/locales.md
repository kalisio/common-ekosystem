---
title: locales
description: Look up geospatial direction and validation message catalogs.
---

# locales

`locales` retrieves the geospatial catalogs registered in the shared `common-core` locale registry. Initialize the registry and catalogs with [setup](../setup.md) first.

```js
import { locales } from '@kalisio/common-geospatial'
```

## getMessages

### Signature

```js
locales.getMessages(code)
```

### Parameters

| Name | Type | Required | Description |
|---|---|---|---|
| `code` | `string` | no | Requested locale code, for example `fr` or `fr-CA`. |

### Returns

| Call | Type | Description |
|---|---|---|
| `getMessages(code)` | `object \| undefined` | First catalog resolved by the registry for the requested locale, including its fallback rules. Returns `undefined` when no resource matches. |
| `getMessages()` | `object` | Map of registered locale codes to their resolved catalogs. A code with no matching resource maps to `undefined`. |

Built-in catalogs contain `DIRECTIONS` and `VALIDATION`. To look up the current locale, pass the value returned by `getLocales().getCurrent()` from `common-core`.

### Examples

```js
import { getLocales } from '@kalisio/common-core/runtime'

locales.getMessages('fr')?.DIRECTIONS.WEST
// { label: 'Ouest', symbol: 'O' } with the built-in French catalog

const current = getLocales().getCurrent()
const messages = locales.getMessages(current)
const catalogs = locales.getMessages()
```
