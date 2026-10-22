---
title: event-bus
description: Lightweight event bus with independent subscriptions and explicit lifecycle management.
---

# event-bus

## Description

Provides a lightweight event bus for communication between application components. Events are dispatched synchronously,
in subscription order, with no external dependencies.

Each subscription is independent, including repeated registrations of the same callback. Listener errors and asynchronous
rejections are reported through the shared logger under `['common-core', 'event-bus']`. They do not interrupt the other
listeners, and `emit()` never awaits asynchronous listeners.

## Functions

### createEventBus

Creates an event bus with private state.

#### Signature

```js
createEventBus()
```

#### Returns

| Member | Signature | Description |
|---|---|---|
| `destroyed` | `boolean` | Read-only destruction state |
| `on` | `on(event, callback)` | Subscribes and returns an unsubscribe function |
| `once` | `once(event, callback)` | Subscribes for a single invocation |
| `off` | `off(event, callback)` | Removes the first matching subscription |
| `offAll` | `offAll(event)` | Removes all subscriptions for the given event |
| `emit` | `emit(event, data)` | Dispatches an event synchronously |
| `listenerCount` | `listenerCount(event)` | Counts subscriptions for the given event |
| `destroy` | `destroy()` | Permanently destroys the bus and clears its listeners |

`event` must be a non-empty string or a symbol. `data` accepts any value, including `undefined`.

Each listener receives:

```js
{ type: event, timestamp: Date.now(), data }
```

A returned unsubscribe function only removes its own subscription. Listeners added during an emission are excluded from
that emission, and listeners removed before their turn are skipped. A `once` subscription is removed before invocation,
including during nested emissions.

#### Throws

| Condition | Error |
|---|---|
| Invalid subscription event | AssertionError: `event must be a non-empty string or a symbol` |
| Invalid callback | AssertionError: `callback must be a function` |
| Subscription after destruction | Error: `event bus has been destroyed` |

Errors thrown by listeners are logged rather than propagated by `emit()`.

## Examples

### Subscribe and emit

```js
import { createEventBus } from '@kalisio/common-core/runtime'

const bus = createEventBus()
const unsubscribe = bus.on('layer:added', ({ data }) => {
  console.log(data.layerId)
})

bus.emit('layer:added', { layerId: 'roads' })
unsubscribe()
```

### One-time and asynchronous listeners

```js
bus.once('ready', ({ data }) => console.log(data))
bus.emit('ready', { initialized: true })
bus.emit('ready') // The listener is not called again.

bus.on('updated', async ({ data }) => {
  await processUpdate(data)
})
bus.emit('updated', { id: 42 }) // Does not await the listener.
```

### Remove and destroy

```js
bus.offAll('updated')
console.log(bus.listenerCount('updated')) // 0
bus.destroy()
console.log(bus.destroyed) // true
```

Further emissions have no effect, and new subscriptions are rejected.
