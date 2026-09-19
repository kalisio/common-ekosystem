---

title: schedule
description: Utility functions for delaying, repeating, scheduling, and controlling function execution over time.
---

# schedule

Utility functions for delaying, repeating, scheduling, and controlling function execution over time.

## delay

Waits for a given duration.

### Signature

```js
schedule.delay(duration, options = {})
```

### Parameters

* `duration` — Non-negative integer delay in milliseconds.
* `options.signal` — Optional `AbortSignal` used to cancel the delay.

### Returns

A `Promise` resolved after `duration` milliseconds.

The promise is rejected with `signal.reason` if the signal is aborted.

### Examples

Wait for one second:

```js
await schedule.delay(1000)
```

Cancel a pending delay:

```js
const controller = new AbortController()

const promise = schedule.delay(5000, {
  signal: controller.signal
})

controller.abort()

await promise
```

## at

Waits until a given date or timestamp.

### Signature

```js
schedule.at(date, options = {})
```

### Parameters

* `date` — Valid `Date` or non-negative integer timestamp in milliseconds.
* `options.signal` — Optional `AbortSignal` used to cancel the wait.

### Returns

A `Promise` resolved when the target time is reached.

If the target time is already in the past, the promise resolves immediately.

### Examples

Wait until a given date:

```js
await schedule.at(new Date('2026-09-16T08:00:00Z'))
```

Wait until a given timestamp:

```js
await schedule.at(Date.now() + 5000)
```

## until

Repeatedly evaluates a predicate until it returns a truthy value.

### Signature

```js
schedule.until(predicate, options = {})
```

### Parameters

* `predicate` — Function evaluated until it returns a truthy value. It may be asynchronous.
* `options.interval` — Non-negative integer delay between evaluations in milliseconds. Defaults to `1000`.
* `options.signal` — Optional `AbortSignal` used to cancel the operation.

### Returns

A `Promise` resolved with the first truthy value returned by `predicate`.

The promise is rejected with `signal.reason` if the signal is aborted.

### Example

```js
const service = await schedule.until(
  async () => {
    const service = await getService()
    return service.ready ? service : false
  },
  {
    interval: 500
  }
)
```

## repeat

Repeatedly executes a callback after a given delay.

The first execution occurs immediately. When the callback is asynchronous, the next delay starts after the callback completes.

### Signature

```js
schedule.repeat(callback, duration, options = {})
```

### Parameters

* `callback` — Function to execute. It may be asynchronous.
* `duration` — Non-negative integer delay between executions in milliseconds.
* `options.signal` — Optional external `AbortSignal`.

### Returns

An object containing:

```js
{
  promise,
  signal,
  abort
}
```

* `promise` — Resolves when the repetition is aborted and rejects if the callback throws.
* `signal` — `AbortSignal` associated with the repetition.
* `abort(reason)` — Stops the repetition with an optional reason.

### Examples

Start and stop a repetition:

```js
const polling = schedule.repeat(
  async () => {
    await refresh()
  },
  5000
)

polling.abort()

await polling.promise
```

Use an external signal:

```js
const controller = new AbortController()

const polling = schedule.repeat(refresh, 5000, {
  signal: controller.signal
})

controller.abort()

await polling.promise
```

## once

Creates a function that executes a callback only once.

Subsequent calls return the result of the first invocation.

### Signature

```js
schedule.once(callback)
```

### Parameters

* `callback` — Function to execute once.

### Returns

A function wrapping `callback`.

Arguments and `this` are forwarded to the callback on the first invocation.

### Example

```js
const initialize = schedule.once(init)

await initialize()
await initialize()
```

`init` is executed only once.

## debounce

Creates a debounced function.

The callback is executed only after no new call has occurred during the given duration.

### Signature

```js
schedule.debounce(callback, duration)
```

### Parameters

* `callback` — Function to execute.
* `duration` — Non-negative integer delay in milliseconds.

### Returns

A debounced function exposing a `cancel()` method.

Arguments and `this` from the latest call are forwarded to the callback.

### Examples

Execute only the last call:

```js
const search = schedule.debounce(load, 300)

search('par')
search('pari')
search('paris')
```

Only the last call is executed.

Cancel a pending execution:

```js
search.cancel()
```

## throttle

Creates a throttled function.

The callback is executed at most once during each given duration.

The implementation is leading-only and does not schedule a trailing execution.

### Signature

```js
schedule.throttle(callback, duration)
```

### Parameters

* `callback` — Function to execute.
* `duration` — Non-negative integer interval in milliseconds.

### Returns

A throttled function.

Arguments and `this` are forwarded to the callback.

### Example

```js
const refresh = schedule.throttle(update, 1000)

refresh()
refresh()
refresh()
```

Only the first call within the one-second window is executed.
