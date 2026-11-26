---
title: global-clock
description: Access to the shared clock instance.
---

# global-clock

Functions for sharing a [Clock](./clock.md) instance across application modules. The application is responsible for configuring the global clock before it is accessed. No default clock is created.

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
| `clock` | `Clock` | yes | The clock instance to share |

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

Retrieves the registered clock instance. The application must
configure the global clock before calling this function.

### Returns

| Type | Description |
|------|-------------|
| `Clock` | The global clock instance |

### Examples

```js
import { getGlobalClock } from '@kalisio/common-time'

const clock = getGlobalClock()

clock.now()
clock.range()
```

::: tip

The application owns the lifecycle of the clock. 
Disposing a clock does not remove its global reference.

:::