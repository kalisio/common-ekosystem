---
title: setup
description: Configure the shared clock for an application.
---

# setup

Configures the shared clock used by `common-time`. The application owns the clock's creation and lifecycle.

## Signature

```js
setup(options = {})
```

## Parameters

| Option | Type | Required | Description |
|---|---|---|---|
| `clock` | `Clock` | no | Active clock to install as the shared clock. |

`setup()` installs the clock when provided. Omitting `clock` or passing `undefined` leaves the current clock unchanged.
A disposed clock raises an `Error`. Outside production mode, invalid options raise an `AssertionError`. In production mode,
a `clock` that is not a `Clock` instance still raises the `TypeError` of [`setCurrentClock()`](./runtime/current-clock.md#setcurrentclock).

## Returns

| Type | Description |
|---|---|
| `undefined` | No return value. |

## Example

```js
import { setup } from '@kalisio/common-time/setup'
import { Clock, getCurrentClock } from '@kalisio/common-time'

const clock = new Clock({ timezone: 'Europe/Paris' })
setup({ clock })

getCurrentClock().now()
```

## Shared clock

| Service | Access | Behavior |
|---|---|---|
| Clock | `getCurrentClock()` | Returns the installed clock. Defaults to a lazily created realtime clock. |

See [current-clock](./runtime/current-clock.md).
