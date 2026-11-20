---
title: current-clock
description: Utility functions for managing the shared application clock.
---

# current-clock

Utility functions for managing the shared application `Clock` instance.

Applications can install a shared clock using `setCurrentClock()` and retrieve it from any module using
`getCurrentClock()`. When no clock is installed, a default realtime clock is created lazily.

Applications are responsible for disposing of their installed clocks. Replacing the current clock does not
dispose the previous instance. Modules should call `getCurrentClock()` when needed rather than retaining a
reference at initialization, as the current clock may change.

## setCurrentClock

### Signature

```js
setCurrentClock(clock)
```

### Description

Sets the shared application clock. Passing `null`, `undefined`, or no argument restores the default clock.

The supplied clock must be a valid, non-disposed `Clock` instance.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `clock` | `Clock \| null \| undefined` | no | The clock to install, or `null` to restore the default clock. |

### Returns

| Type | Description |
|------|-------------|
| `undefined` | No return value. |

### Throws

| Type | Description |
|------|-------------|
| `TypeError` | The supplied value is not a `Clock` instance, `null`, or `undefined`. |
| `Error` | The supplied clock has been disposed. |

### Examples

```js
import { Clock, setCurrentClock } from '@kalisio/common-time'

const clock = new Clock({
  timezone: 'Europe/Paris'
})

setCurrentClock(clock)

// Restore the default clock
setCurrentClock(null)

// Dispose of the application-owned clock
clock.dispose()
```

## getCurrentClock

### Signature

```js
getCurrentClock()
```

### Description

Returns the shared application clock.

If no clock has been installed, returns a lazily created default realtime clock. The same instance is reused until it is disposed, in which case a new default clock is created.

Throws an error if the explicitly installed clock has been disposed.

### Parameters

None.

### Returns

| Type | Description |
|------|-------------|
| `Clock` | The current application clock or the default realtime clock. |

### Throws

| Type | Description |
|------|-------------|
| `Error` | The installed application clock has been disposed. |

### Examples

```js
import { getCurrentClock } from '@kalisio/common-time'

const clock = getCurrentClock()

console.log(clock.now().toISOString())
```

Access the current clock from another module:

```js
import { getCurrentClock } from '@kalisio/common-time'

export function getCurrentTime () {
  return getCurrentClock().now()
}

export function getCurrentInterval () {
  return getCurrentClock().interval()
}
```
