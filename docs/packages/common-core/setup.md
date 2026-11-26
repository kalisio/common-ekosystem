---
title: setup
description: Configure the shared logger, locales, and event bus for an application.
---

# setup

Configures the shared runtime services used by `common-core` and other packages. The application supplies a logger factory, locale configuration, or an event bus.

## Signature

```js
setup(options = {})
```

## Parameters

| Option | Type | Required | Description |
|---|---|---|---|
| `logger` | `function` | no | Logger factory receiving a category path and returning a logger implementation. |
| `locales` | `object` | no | Options for a new locale manager. Both `default` and `fallback` default to `'en'`. |
| `bus` | `EventBus` | no | Shared event bus. |

Each defined option configures its corresponding shared service. Supplying `locales` creates a fresh manager, so register additional locales and resources after setup. Development assertions validate the options object before configuring services.

## Returns

| Type | Description |
|---|---|
| `undefined` | No return value. |

## Example

```js
import { setup } from '@kalisio/common-core/setup'
import { EventBus, getLogger, getLocales, getGlobalEventBus } from '@kalisio/common-core/runtime'

const bus = new EventBus()
setup({
  logger: () => console,
  locales: { default: 'en', fallback: 'en' },
  bus
})

getLogger('app').info('Application ready')
const locales = getLocales()
locales.register('fr', { label: 'Français' })
locales.setCurrent('fr')
getGlobalEventBus().emit('app:ready')
```

## Shared services

| Service | Access | Behavior |
|---|---|---|
| Logger | `getLogger(category)` | Returns a facade forwarding calls to the configured logger factory. Defaults to `console`. |
| Locales | `getLocales()` | Returns the shared locale manager or `null` before initialization. |
| Event bus | `getGlobalEventBus()` | Returns the configured `EventBus` instance, or `null` if no bus is installed. |

Configure shared services before initializing dependent packages. Packages can then use `getLogger()`, `getLocales()`, and `getGlobalEventBus()` rather than accepting a separate logger or bus in their own setup options.

See [logger](./runtime/logger.md), [Locales](./runtime/locales.md), and [EventBus](./runtime/event-bus.md).
