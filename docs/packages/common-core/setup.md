---
title: setup
description: Configure the shared logger, locales, and event bus for an application.
---

# setup

Configures the shared runtime services used by `common-core` and other packages. The application owns their creation and initialization.

## Signature

```js
setup(options = {})
```

## Parameters

| Option | Type | Required | Description |
|---|---|---|---|
| `logger` | `function` | no | Logger factory receiving a category path and returning a logger implementation. |
| `locales` | `Locales` | no | Shared locale manager. |
| `bus` | `EventBus` | no | Shared event bus. |

`setup()` validates the provided options. Each defined option configures its corresponding shared service. Omitted options leave the previously configured services unchanged.

## Returns

| Type | Description |
|---|---|
| `undefined` | No return value. |

## Example

```js
import { setup } from '@kalisio/common-core/setup'
import { EventBus, Locales, getLogger, getLocales, getEventBus } from '@kalisio/common-core/runtime'

const bus = new EventBus()
const locales = new Locales({ default: 'en', fallback: 'en' })
locales.register('fr', { label: 'Français' })

setup({
  logger: category => console,
  locales,
  bus
})

getLogger('app').info('Application ready')
getLocales().setCurrent('fr')
getEventBus().emit('app:ready')
```

## Shared services

| Service | Access | Behavior |
|---|---|---|
| Logger | `getLogger(category)` | Returns a facade forwarding calls to the configured logger factory. Defaults to `console`. |
| Locales | `getLocales()` | Returns the configured `Locales` instance. Throws if none has been configured. |
| Event bus | `getEventBus()` | Returns the configured `EventBus` instance, or `undefined` if no bus is installed. |

Configure shared services before initializing dependent packages. Packages can then use `getLogger()`, `getLocales()`, and `getEventBus()` rather than accepting a separate logger or bus in their own setup options.

See [logger](./runtime/logger.md), [Locales](./runtime/locales.md), and [EventBus](./runtime/event-bus.md).
