---
title: setup
description: Configure the global application clock.
---

# setup

Registers the application clock to be shared across modules.
The clock is created and managed by the application.

## Signature

```js
setup(options = {})
```

## Parameters

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `clock` | `Clock` | no | The clock instance to install globally |

If a clock is supplied, it becomes the global clock.
If the option is absent or undefined, the existing
global reference remains unchanged.

No default clock is created.

## Returns

| Type | Description |
|------|-------------|
| `void` | No return value |

## Example

```js
import { setup } from '@kalisio/common-time/setup'
import { Clock, getGlobalClock } from '@kalisio/common-time'

const clock = new Clock({ timezone: 'Europe/Paris' })

setup({ clock })

getGlobalClock().now()
```

## Global clock

| Service | Access | Behavior |
|---------|--------|----------|
| Clock | `getGlobalClock()` | Retrieves the explicitly configured clock |

For direct access and registration, see
[global-clock](./runtime/global-clock.md).