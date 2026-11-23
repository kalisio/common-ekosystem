---
title: setup
description: Register shared geospatial locale resources.
---

# setup

Registers the catalogs used for cardinal directions and validation messages. The application creates the locale registry and installs it through [common-core setup](../common-core/setup.md).

## Signature

```js
setup(options = {})
```

## Parameters

| Option | Type | Required | Description |
|---|---|---|---|
| `locales` | `Locales` | yes | Shared registry from `common-core`. |
| `messages` | `object` | no | Additional catalogs keyed by locale code. |

`setup()` registers the built-in English and French catalogs under the `common-geospatial` namespace. Custom contributions take priority over built-in resources for the same locale. Catalogs are resolved as whole resources. Provide all four entries under `DIRECTIONS` when a custom catalog is used by direction helpers.

Register each selectable locale with `locales.register(code)` before calling `locales.setCurrent(code)`. Catalog registration supplies resources for those locales.

## Returns

| Type | Description |
|---|---|
| `undefined` | No return value. |

## Example

```js
import { Locales } from '@kalisio/common-core/runtime'
import { setup as setupCore } from '@kalisio/common-core/setup'
import { getWest } from '@kalisio/common-geospatial'
import { setup } from '@kalisio/common-geospatial/setup'

const registry = new Locales({ default: 'en', fallback: 'en' })
registry.register('fr')
setupCore({ locales: registry })
setup({ locales: registry })

registry.setCurrent('fr')
getWest() // { label: 'Ouest', symbol: 'O' }
```

See [locales](./utilities/locales.md) for catalog lookup, [directions](./foundation/directions.md) for direction labels, and [localized validation messages](./operators/validate.md#localized-messages) for validation codes.
