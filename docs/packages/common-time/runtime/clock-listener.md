---
title: clock-listener
description: Utility for managing grouped Clock event subscriptions.
---

# clock-listener

Utility for managing multiple `Clock` event subscriptions as a single unit.

`createClockListener` groups event handlers so they can be attached to a clock, transferred to another clock, or detached together.

Subscriptions are managed explicitly. A listener does not automatically follow changes to the application's current clock.

## createClockListener

### Signature

```js
createClockListener(handlers)
```

### Description

Creates a listener that manages a collection of clock event handlers.

The `handlers` argument is an object whose keys are event names and whose values are callback functions.

The listener is initially detached. Handlers are registered only when `attach` is called.

The returned listener exposes a read-only `clock` property and two methods: `attach` and `detach`.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `handlers` | `object` | yes | Object mapping clock event names to callback functions. |

Supported clock events include `tick`, `change`, `pause`, `resume`, `reset`, `end`, and `loop`.

Callbacks receive the corresponding event payload directly, as with `Clock.on`.

### Returns

| Type | Description |
|------|-------------|
| `object` | Frozen listener exposing `clock`, `attach`, and `detach`. |

### Throws

| Type | Description |
|------|-------------|
| `AssertionError` | Outside production mode, an invalid handlers object, event name, or callback. |

### Examples

```js
import { Clock, createClockListener } from '@kalisio/common-time'

const clock = new Clock()

const listener = createClockListener({
  tick: ({ time }) => {
    console.log(time.toISOString())
  },
  change: ({ status }) => {
    console.log('Clock status:', status)
  },
  end: ({ time }) => {
    console.log('Clock ended at:', time.toISOString())
  }
})

listener.attach(clock)

// Later
listener.detach()
clock.dispose()
```

## clock

### Signature

```js
listener.clock
```

### Description

Read-only property returning the clock currently associated with the listener.

Returns `null` when the listener is detached.

Attaching a different clock updates this property. Calling `detach` resets it to `null`.

### Returns

| Type | Description |
|------|-------------|
| `Clock \| null` | Currently attached clock, or `null`. |

### Examples

```js
const clock = new Clock()
const listener = createClockListener({
  change: ({ status }) => console.log(status)
})

listener.clock
// null

listener.attach(clock)

listener.clock === clock
// true

listener.detach()

listener.clock
// null

clock.dispose()
```

## attach

### Signature

```js
listener.attach(clock)
```

### Description

Attaches all registered event handlers to the specified clock.

If the listener is already attached to another clock, all handlers are first registered on the new clock, then removed from the previous clock.

If registering a handler fails, subscriptions already created on the new clock are removed and the previous clock remains attached.

Calling `attach` with the currently attached clock has no effect and does not create duplicate subscriptions.

The target clock must be an active `Clock` instance.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `clock` | `Clock` | yes | Clock instance to attach the handlers to. |

### Returns

| Type | Description |
|------|-------------|
| `object` | The current listener, allowing method chaining. |

### Throws

| Type | Description |
|------|-------------|
| `AssertionError` | Outside production mode, the target is invalid or disposed. |
| `Error` | A subscription fails. |

### Examples

```js
const first = new Clock()
const second = new Clock()

const listener = createClockListener({
  pause: ({ status }) => {
    console.log(status)
  }
})

listener.attach(first)

first.pause()
// Logs 'paused'

listener.attach(second)

first.resume()
first.pause()
// No notification from first

second.pause()
// Logs 'paused'

listener.attach(second)
// No duplicate subscription

listener.detach()
first.dispose()
second.dispose()
```

## detach

### Signature

```js
listener.detach()
```

### Description

Removes all event subscriptions managed by the listener from its currently attached clock.

After detaching, the `clock` property becomes `null`.

The handler definitions are retained and can be attached again to the same clock or another clock.

Calling `detach` when the listener is already detached has no effect.

### Returns

| Type | Description |
|------|-------------|
| `object` | The current listener, allowing method chaining. |

### Examples

```js
const clock = new Clock()

const listener = createClockListener({
  change: ({ status }) => {
    console.log(status)
  }
})

listener.attach(clock)

clock.pause()
// Logs 'paused'

listener.detach()

clock.resume()
// No notification

listener.attach(clock)

clock.pause()
// Logs 'paused'

listener.detach()
clock.dispose()
```

## Using the current clock

A listener can be attached to the application's shared clock through `getCurrentClock()`.

When the application replaces its current clock, the listener must be explicitly attached to the new instance.

### Examples

```js
import {
  Clock,
  createClockListener,
  getCurrentClock,
  setCurrentClock
} from '@kalisio/common-time'

const listener = createClockListener({
  tick: ({ time }) => {
    console.log(time.toISOString())
  },
  change: ({ status }) => {
    console.log(status)
  }
})

// Attach to the current application clock
listener.attach(getCurrentClock())

// Replace the application clock
const simulated = new Clock({
  mode: 'simulated',
  speed: 10
}, '2026-11-20T12:00:00Z')

setCurrentClock(simulated)

// Move all subscriptions to the new clock
listener.attach(simulated)

// Release the subscriptions when no longer needed
listener.detach()
```
