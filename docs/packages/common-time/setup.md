---
title: setup
description: Configure the global application clock.
---

# setup

Registers an application-owned clock for use across modules.

## Signature

```js
setup(options = {})
```

## Parameters

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `clock` | `Clock` | no | The clock instance to install globally |

Passing a clock installs that instance as the global clock. Development assertions check that `options` is a plain object and that a supplied `clock` is a `Clock` instance. The application manages disposal.

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

getGlobalClock()?.now()
```

## Global clock

| Service | Access | Behavior |
|---------|--------|----------|
| Clock | `getGlobalClock()` | Returns the configured clock or `undefined` before registration. |

For direct access and registration, see
[global-clock](./runtime/global-clock.md).
