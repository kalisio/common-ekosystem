---
title: setup
description: Configure the shared logger and locale manager for an application.
---

# setup

Configures the shared runtime services used by `common-core` and other packages. The application can supply a logger factory and locale configuration.

## Signature

```js
setup(options = {})
```

## Parameters

| Option | Type | Required | Description |
|---|---|---|---|
| `logger` | `function` | no | Logger factory receiving a category path and returning a logger implementation. |
| `locales` | `object` | no | Options for a new locale manager. Both `default` and `fallback` default to `'en'`. |
| `locales.bus` | `EventBus` | no | Event bus used by the locale manager to emit `locale:changed`. |

Each defined option configures its corresponding shared service. Supplying `locales` creates a fresh manager, so register additional locales and resources after setup. Development assertions validate the options object before configuring services.

## Returns

| Type | Description |
|---|---|
| `undefined` | No return value. |

## Example

```js
import { setup } from '@kalisio/common-core/setup'
import { EventBus, getLogger, getLocales } from '@kalisio/common-core/runtime'

const bus = new EventBus()
bus.on('locale:changed', ({ data }) => {
  console.log(data.locale)
})

setup({
  logger: () => console,
  locales: { default: 'en', fallback: 'en', bus }
})

getLogger('app').info('Application ready')
const locales = getLocales()
locales.register('fr', { label: 'Français' })
locales.setCurrent('fr')
```

## Shared services

| Service | Access | Behavior |
|---|---|---|
| Logger | `getLogger(category)` | Returns a facade forwarding calls to the configured logger factory. Defaults to `console`. |
| Locales | `getLocales()` | Returns the shared locale manager or `null` before initialization. |

Configure shared services before initializing dependent packages. Dependent packages can retrieve the configured services with `getLogger()` and `getLocales()`.

See [logger](./runtime/logger.md), [Locales](./runtime/locales.md), and [EventBus](./runtime/event-bus.md).
