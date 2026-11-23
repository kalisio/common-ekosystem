---
title: setup
description: Configure the shared clock for an application.
---

# setup

Configures the shared clock used by `common-time`. The application owns the clock's creation and lifecycle. This helper is available in the package source. Applications that use the published package initialize their clock with [setCurrentClock](./runtime/current-clock.md#setcurrentclock).

## Signature

```js
setup(options = {})
```

## Parameters

| Option | Type | Required | Description |
|---|---|---|---|
| `clock` | `Clock` | no | Active clock to install as the shared clock. |

`setup()` installs the clock when provided. Omitting `clock` or passing `undefined` leaves the current clock unchanged. A disposed clock raises an `Error`. Outside production mode, invalid options raise an `AssertionError`.

## Returns

| Type | Description |
|---|---|
| `undefined` | No return value. |

## Example

Run this example from the `packages/common-time` directory.

```js
import { setup } from './src/setup.js'
import { Clock, getCurrentClock } from './src/index.js'

const clock = new Clock({ timezone: 'Europe/Paris' })
setup({ clock })

getCurrentClock().now()
```

## Shared clock

| Service | Access | Behavior |
|---|---|---|
| Clock | `getCurrentClock()` | Returns the installed clock. Defaults to a lazily created realtime clock. |

See [current-clock](./runtime/current-clock.md).
