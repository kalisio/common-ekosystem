---
title: event-listeners
description: Generic helpers for subscribing to events and waiting for event emissions.
---

# event-listeners

Generic helpers for subscribing to events and waiting for event emissions.

These helpers work with any emitter implementing `on(event, callback)` and returning an unsubscribe function, including `EventBus` and `Clock`.

## listen

### Signature

```js
listen(emitter, handlers, options = {})
```

### Description

Subscribes multiple handlers to their respective events and returns a function that removes all subscriptions.

Supports string and symbol event names, automatic cleanup through an `AbortSignal`, and rollback if a subscription fails.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `emitter` | `object` | yes | An emitter implementing `on(event, callback)` |
| `handlers` | `object` | yes | Map of event names to callback functions |
| `options.signal` | `AbortSignal` | no | Signal used to automatically remove subscriptions |

### Returns

| Type | Description |
|------|-------------|
| `function` | Function that removes all subscriptions. Can be called multiple times |

### Examples

```js
import { listen } from '@kalisio/common-core/runtime'

const stop = listen(emitter, {
  connected: (payload) => console.log('Connected', payload),
  disconnected: () => console.log('Disconnected')
})

// Remove all subscriptions
stop()
```

Using an `AbortSignal`:

```js
const controller = new AbortController()

listen(emitter, {
  connected: onConnected,
  disconnected: onDisconnected
}, { signal: controller.signal })

// Automatically remove all subscriptions
controller.abort()
```

## waitFor

### Signature

```js
waitFor(emitter, event, options = {})
```

### Description

Returns a promise that resolves with the payload of the next emission of an event matching an optional synchronous filter.

The promise rejects if the filter throws an error or the provided `AbortSignal` is aborted.

The subscription is automatically removed when the promise settles.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `emitter` | `object` | yes | An emitter implementing `on(event, callback)` |
| `event` | `string \| symbol` | yes | Event to wait for |
| `options.filter` | `function` | no | Synchronous predicate receiving the event payload |
| `options.signal` | `AbortSignal` | no | Signal used to cancel the wait |

### Returns

| Type | Description |
|------|-------------|
| `Promise<any>` | Resolves with the matching event payload or rejects on cancellation or filter error |

### Examples

Wait for an event:

```js
import { waitFor } from '@kalisio/common-core/runtime'

const payload = await waitFor(emitter, 'connected')
```

Wait for an event matching a condition:

```js
const payload = await waitFor(emitter, 'status', {
  filter: (status) => status.ready === true
})
```

Wait with a timeout:

```js
const payload = await waitFor(emitter, 'connected', {
  signal: AbortSignal.timeout(5000)
})
```

Cancel an ongoing wait:

```js
const controller = new AbortController()

const pending = waitFor(emitter, 'connected', {
  signal: controller.signal
})

controller.abort()

await pending // Rejects with the signal's abort reason
```
