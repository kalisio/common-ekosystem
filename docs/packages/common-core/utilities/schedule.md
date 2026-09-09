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

* `duration` — Delay in milliseconds.
* `options.signal` — Optional `AbortSignal` used to cancel the delay.

### Returns

A `Promise` resolved after `duration` milliseconds.

The promise is rejected with `signal.reason` if the signal is aborted.

```js
await schedule.delay(1000)
```

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

* `date` — Date, timestamp, or value accepted by `Date`.
* `options.signal` — Optional `AbortSignal` used to cancel the wait.

### Returns

A `Promise` resolved when the target time is reached.

If the target time is already in the past, the promise resolves immediately.

```js
await schedule.at(new Date('2026-09-10T08:00:00'))
```

## until

Repeatedly evaluates a predicate until it returns a truthy value.

### Signature

```js
schedule.until(predicate, options = {})
```

### Parameters

* `predicate` — Function evaluated until it returns a truthy value. It may be asynchronous.
* `options.interval` — Delay between evaluations in milliseconds. Defaults to `1000`.
* `options.signal` — Optional `AbortSignal` used to cancel the operation.

### Returns

A `Promise` resolved with the first truthy value returned by `predicate`.

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

Repeatedly executes a callback at a fixed interval.

The first execution occurs after the initial delay.

### Signature

```js
schedule.repeat(callback, duration, options = {})
```

### Parameters

* `callback` — Function to execute. It may be asynchronous.
* `duration` — Delay between executions in milliseconds.
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

* `promise` — Resolves when the repetition is aborted.
* `signal` — Signal associated with the repetition.
* `abort(reason)` — Stops the repetition.

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

An external signal can also be provided:

```js
const controller = new AbortController()

const polling = schedule.repeat(refresh, 5000, {
  signal: controller.signal
})

controller.abort()
```

## once

Creates a function that executes the callback only once.

Subsequent calls return the result of the first invocation.

### Signature

```js
schedule.once(callback)
```

### Returns

A function wrapping `callback`.

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

### Returns

A debounced function exposing a `cancel()` method.

```js
const search = schedule.debounce(load, 300)

search('par')
search('pari')
search('paris')
```

Only the last call is executed.

A pending execution can be cancelled:

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

### Returns

A throttled function.

```js
const refresh = schedule.throttle(update, 1000)

refresh()
refresh()
refresh()
```

Only the first call within the one-second window is executed.
