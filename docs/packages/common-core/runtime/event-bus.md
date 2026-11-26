---
title: event-bus
description: EventBus class with independent subscriptions and shared runtime access.
---

# event-bus

`EventBus` dispatches events synchronously in subscription order. Subscriptions are independent, even when the same callback is registered several times. Listener errors and rejected promises are logged without interrupting other listeners.

## EventBus

### Signature

```js
new EventBus()
```

### Properties

| Property | Type | Description |
|---|---|---|
| `destroyed` | `boolean` | Read-only destruction state. |

### Methods

| Method | Description |
|---|---|
| `on(event, callback)` | Subscribes to an event and returns an unsubscribe function. |
| `once(event, callback)` | Subscribes to a single invocation and returns an unsubscribe function. |
| `off(event, callback)` | Removes the first matching subscription. |
| `offAll(event)` | Removes all subscriptions for the event. |
| `emit(event, data)` | Synchronously dispatches an event. |
| `listenerCount(event)` | Returns the number of subscriptions for the event. |
| `destroy()` | Permanently destroys the bus and clears its listeners. |

`event` must be a non-empty string or a symbol. A listener receives an envelope:

```js
const envelope = {
  type: event,
  timestamp: Date.now(),
  data
}
```

`data` can be any value, including `undefined`.

A returned unsubscribe function removes only its own subscription. Listeners added during an emission are excluded from that emission; listeners removed before their turn are skipped. A `once()` subscription is removed before the callback runs, including in nested emissions.

After `destroy()`, emissions are ignored and new subscriptions throw an error. Existing subscriptions cannot be restored.

### Example

```js
import { EventBus } from '@kalisio/common-core/runtime'

const bus = new EventBus()
const stop = bus.on('layer:added', ({ data }) => {
  console.log(data.layerId)
})

bus.emit('layer:added', { layerId: 'roads' })
stop()
bus.destroy()
```

## setGlobalEventBus

### Signature

```js
setGlobalEventBus(bus)
```

Installs an `EventBus` instance as the shared runtime bus. Development assertions reject values that are incompatible with `EventBus`. This function returns `undefined`.

## getGlobalEventBus

### Signature

```js
getGlobalEventBus()
```

Returns the shared `EventBus` instance, or `null` if none has been installed.

### Example

```js
import { EventBus, getGlobalEventBus, setGlobalEventBus } from '@kalisio/common-core/runtime'

setGlobalEventBus(new EventBus())

const stop = getGlobalEventBus().on('ready', ({ data }) => {
  console.log(data)
})

getGlobalEventBus().emit('ready', { initialized: true })
stop()
```

Applications can also install the bus through [`setup()`](../setup.md). To subscribe to several events or await the next matching emission, see [event-listeners](./event-listeners.md).
