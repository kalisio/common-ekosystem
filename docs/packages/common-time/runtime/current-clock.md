---
title: current-clock
description: Utility functions for managing the shared application clock.
---

# current-clock

`setCurrentClock()` installs an application `Clock` shared across modules. `getCurrentClock()` retrieves it, or a lazily created default realtime clock when none is installed. Replacing the current clock never disposes the previous instance; the application owns its lifecycle.

## setCurrentClock

### Signature

```js
setCurrentClock(clock)
```

### Description

Installs a non-disposed `Clock`, or restores the default when passed `null`, `undefined`, or no argument.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `clock` | `Clock \| null \| undefined` | no | Clock to install, or `null` to restore the default. |

### Returns

| Type | Description |
|------|-------------|
| `undefined` | No return value. |

### Throws

`AssertionError` outside production mode for an invalid argument. `Error` when the supplied clock has been disposed.

### Examples

```js
import { Clock, setCurrentClock } from '@kalisio/common-time'

const clock = new Clock({ timezone: 'Europe/Paris' })
setCurrentClock(clock)

// Restore the default, then dispose of the application clock
setCurrentClock(null)
clock.dispose()
```

## getCurrentClock

### Signature

```js
getCurrentClock()
```

### Description

Returns the installed clock. If none is installed, creates a default realtime clock lazily and reuses it until disposed; then a fresh default clock is created. Throws if the explicitly installed clock has been disposed.

### Returns

| Type | Description |
|------|-------------|
| `Clock` | Installed clock or default realtime clock. |

### Throws

`Error` if an explicitly installed clock has been disposed.

### Examples

```js
import { getCurrentClock } from '@kalisio/common-time'

export function getCurrentTime () {
  return getCurrentClock().now()
}

export function getCurrentRange () {
  return getCurrentClock().range()
}
```

Call `getCurrentClock()` when needed instead of storing a shared clock reference at module initialization, since the installed clock can change.

For application initialization through an options object, see [setup](../setup.md).
