---
title: global-clock
description: Access to the shared clock instance.
---

# global-clock

Functions for sharing a [Clock](./clock.md) instance across application modules. The application registers the clock it wants to share.

## setGlobalClock

### Signature

```js
setGlobalClock(clock)
```

### Description

Registers an existing clock as the global clock.
Subsequent calls replace the reference without disposing
of the previous instance.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `clock` | `Clock` | yes | The clock instance to share. Development assertions enforce the type. |

### Returns

| Type | Description |
|------|-------------|
| `void` | No return value |

### Examples

```js
import { Clock, setGlobalClock } from '@kalisio/common-time'

const clock = new Clock({ timezone: 'Europe/Paris' })
setGlobalClock(clock)
```

## getGlobalClock

### Signature

```js
getGlobalClock()
```

### Description

Retrieves the registered clock instance. Callers are responsible for handling the absence of a clock.

### Returns

| Type | Description |
|------|-------------|
| `Clock \| undefined` | The global clock instance, or `undefined` before registration. |

### Examples

```js
import { getGlobalClock } from '@kalisio/common-time'

const clock = getGlobalClock()

if (clock) {
  clock.now()
  clock.range()
}
```

::: tip

The application owns the lifecycle of the clock. 
Disposing a clock does not remove its global reference.

:::
