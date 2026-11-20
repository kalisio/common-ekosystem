---
title: Clock
description: Runtime clock supporting realtime and simulated time, temporal windows, bounds, and events.
---

# Clock

The `Clock` class manages a temporal reference that can follow the system clock or progress at a configurable speed.

It supports realtime and simulated modes, forward and backward progression, temporal windows, playback bounds, looping, and event notifications.

Time is computed on demand. A timer is used only to emit notifications when required.

## Constructor

### Signature

```js
new Clock(config, initialTime)
```

### Description

Creates a clock with the specified configuration and initial time.

By default, the clock runs in realtime mode, follows the system clock, and uses the UTC timezone.

In simulated mode, the clock starts at `initialTime` and progresses according to its configured speed.

A speed other than `1` automatically selects simulated mode unless the mode is explicitly specified. Realtime mode always requires speed `1`.

In realtime mode, `initialTime` is ignored.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `config` | `object` | no | Clock configuration. Defaults to `{}`. |
| `initialTime` | `DateTime \| Date \| number \| string \| object` | no | Initial instant in simulated mode. Defaults to the current time. |

### Configuration

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `mode` | `string` | `'realtime'` | `'realtime'` or `'simulated'`. |
| `timezone` | `string` | `'UTC'` | IANA timezone used for date representations and local date parsing. |
| `speed` | `number` | `1` | Simulation speed. Must be finite and nonzero; negative values reverse time. |
| `tickInterval` | `number` | `1000` | Notification interval in real milliseconds. `0` disables periodic notifications. |
| `interval` | `object \| null` | `null` | Temporal window expressed as offsets relative to the current time. |
| `bounds` | `object \| null` | `null` | Start and end instants restricting clock progression. |
| `loop` | `boolean` | `false` | Whether to wrap around the bounds instead of ending. |

The `interval` option uses ISO 8601 duration offsets:

```js
{
  interval: {
    start: '-PT3H',
    end: 'PT0S'
  }
}
```

Both offsets must be time-based durations, convertible into exact milliseconds. Calendar durations such as `P1D` or `P1M` are not accepted.

The `bounds` option defines a half-open range `[start, end)`:

```js
{
  bounds: {
    start: '2026-11-20T12:00:00Z',
    end: '2026-11-20T18:00:00Z'
  }
}
```

Without looping, the clock stops when it reaches a bound. With looping, it wraps around within the range. Enabling `loop` requires nonempty `bounds`.

### Throws

| Type | Description |
|------|-------------|
| `TypeError` | Invalid configuration structure or property type. |
| `RangeError` | Invalid mode, speed, timezone, interval, bounds, or initial time. |

### Examples

```js
const clock = new Clock()
// Running realtime clock in UTC

const simulated = new Clock({
  mode: 'simulated',
  timezone: 'Europe/Paris',
  speed: 2
}, '2026-11-20T12:00:00Z')
// Simulated clock progressing twice as fast

const reverse = new Clock({
  speed: -1
}, '2026-11-20T12:00:00Z')
// Simulated clock progressing backward

const history = new Clock({
  interval: {
    start: '-PT3H',
    end: 'PT0S'
  }
})
// Realtime clock with a three-hour rolling window

const playback = new Clock({
  mode: 'simulated',
  bounds: {
    start: '2026-11-20T12:00:00Z',
    end: '2026-11-20T18:00:00Z'
  },
  loop: true,
  speed: 10
}, '2026-11-20T12:00:00Z')
// Looping simulated clock at 10× speed
```

## disposed

### Signature

```js
clock.disposed
```

### Description

Read-only property indicating whether the clock has been disposed.

### Returns

| Type | Description |
|------|-------------|
| `boolean` | `true` if the clock has been disposed, `false` otherwise. |

### Examples

```js
const clock = new Clock()

clock.disposed
// false

clock.dispose()

clock.disposed
// true
```

## config

### Signature

```js
clock.config()
```

### Description

Returns a copy of the current clock configuration.

Nested `interval` and `bounds` objects are also copied, so modifying the returned configuration does not affect the clock.

### Returns

| Type | Description |
|------|-------------|
| `object` | Current clock configuration. |

### Throws

| Type | Description |
|------|-------------|
| `Error` | The clock has been disposed. |

### Examples

```js
const clock = new Clock({
  mode: 'simulated',
  timezone: 'Europe/Paris',
  speed: 2
})

clock.config()
// {
//   mode: 'simulated',
//   timezone: 'Europe/Paris',
//   speed: 2,
//   tickInterval: 1000,
//   interval: null,
//   bounds: null,
//   loop: false
// }
```

## state

### Signature

```js
clock.state()
```

### Description

Returns an immutable snapshot of the current clock state.

The returned object contains the current time, resolved temporal window, and execution status.

The `interval` property is `null` when no temporal window is configured.

### Returns

| Property | Type | Description |
|----------|------|-------------|
| `time` | `DateTime` | Current clock instant. |
| `interval` | `Interval \| null` | Temporal window resolved at the current instant. |
| `status` | `string` | `'running'`, `'paused'`, or `'ended'`. |

### Throws

| Type | Description |
|------|-------------|
| `Error` | The clock has been disposed. |

### Examples

```js
const clock = new Clock({
  mode: 'simulated',
  interval: {
    start: '-PT3H',
    end: 'PT0S'
  }
}, '2026-11-20T12:00:00Z')

const state = clock.state()

state.time.toISOString()
// Current simulated instant

state.interval.duration.toISOString()
// 'PT3H'

state.status
// 'running'
```

## now

### Signature

```js
clock.now()
```

### Description

Returns the current clock instant as a `DateTime`.

The returned value uses the clock's configured timezone.

In realtime mode, the instant follows the system clock. In simulated mode, it is computed from the elapsed monotonic time and simulation speed.

### Returns

| Type | Description |
|------|-------------|
| `DateTime` | Current clock instant. |

### Throws

| Type | Description |
|------|-------------|
| `Error` | The clock has been disposed. |

### Examples

```js
const clock = new Clock({
  mode: 'simulated',
  timezone: 'Europe/Paris'
}, '2026-11-20T12:00:00Z')

clock.now().timezone
// 'Europe/Paris'

clock.now().toISOString()
// Current simulated instant
```

## interval

### Signature

```js
clock.interval()
```

### Description

Returns the temporal window resolved against the current clock instant.

The window is calculated by applying the configured start and end offsets to the current time.

If no window is configured, returns `null`.

### Returns

| Type | Description |
|------|-------------|
| `Interval \| null` | Current temporal window. |

### Throws

| Type | Description |
|------|-------------|
| `Error` | The clock has been disposed. |

### Examples

```js
const clock = new Clock({
  interval: {
    start: '-PT3H',
    end: 'PT0S'
  }
})

const interval = clock.interval()

interval.duration.toISOString()
// 'PT3H'
```

## configure

### Signature

```js
clock.configure(changes)
```

### Description

Updates the clock configuration without replacing the clock instance.

Only specified properties are changed. Properties set to `undefined` remain unchanged, while invalid values are rejected.

Configuration changes are validated before being applied. If validation fails, the previous configuration and state are preserved.

Changing the speed preserves the current instant. Setting the speed to a value other than `1` selects simulated mode unless a conflicting mode is explicitly provided.

Changing the timezone does not change the absolute instant.

A successful configuration update emits `change`. If the new bounds cause the clock to end, it emits `end` before `change`.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `changes` | `object` | yes | Partial clock configuration. Uses the properties described in the constructor. |

### Returns

| Type | Description |
|------|-------------|
| `Clock` | The current clock instance. |

### Throws

| Type | Description |
|------|-------------|
| `TypeError` | Invalid configuration structure or property type. |
| `RangeError` | Invalid configuration value. |
| `Error` | The clock has been disposed. |

### Examples

```js
const clock = new Clock()

clock.configure({
  mode: 'simulated',
  speed: 5
})

clock.configure({
  timezone: 'Europe/Paris',
  interval: {
    start: '-PT6H',
    end: 'PT0S'
  }
})

clock.configure({
  tickInterval: 500
})

clock.configure({
  mode: 'realtime'
})
// Returns to realtime mode with speed 1
```

## set

### Signature

```js
clock.set(value)
```

### Description

Sets the current clock instant.

If the clock is in realtime mode, it switches to simulated mode.

The current running or paused status is preserved. Setting a new time on an ended clock changes its status to `paused`, allowing it to be resumed.

When bounds are configured without looping, the supplied time must belong to `[start, end)`. When looping is enabled, out-of-range times are wrapped into the configured bounds.

A successful call emits `change`.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `value` | `DateTime \| Date \| number \| string \| object` | yes | New clock instant. |

### Returns

| Type | Description |
|------|-------------|
| `Clock` | The current clock instance. |

### Throws

| Type | Description |
|------|-------------|
| `TypeError` | Unsupported date input. |
| `RangeError` | Invalid date or time outside non-looping bounds. |
| `Error` | The clock has been disposed. |

### Examples

```js
const clock = new Clock()

clock.set('2026-11-20T12:00:00Z')

clock.config().mode
// 'simulated'

clock.set(new Date('2026-11-21T12:00:00Z'))

clock.set(Date.parse('2026-11-22T12:00:00Z'))
```

## pause

### Signature

```js
clock.pause()
```

### Description

Pauses the clock at its current instant.

While paused, the clock's time remains constant and periodic notifications stop.

If the clock is already paused or ended, the call has no effect.

An effective pause emits `pause`, followed by `change`.

### Returns

| Type | Description |
|------|-------------|
| `Clock` | The current clock instance. |

### Throws

| Type | Description |
|------|-------------|
| `Error` | The clock has been disposed. |

### Examples

```js
const clock = new Clock()

clock.pause()

clock.state().status
// 'paused'
```

## resume

### Signature

```js
clock.resume()
```

### Description

Resumes a paused clock.

In realtime mode, the clock resumes following system time. In simulated mode, progression continues from the paused instant.

If the clock is already running, the call has no effect.

An ended clock cannot be resumed until its time is changed with `set` or the clock is reset.

An effective resume emits `resume`, followed by `change`. If the clock immediately reaches its bounds, it emits `end` instead of `resume`.

### Returns

| Type | Description |
|------|-------------|
| `Clock` | The current clock instance. |

### Throws

| Type | Description |
|------|-------------|
| `Error` | The clock is ended or has been disposed. |

### Examples

```js
const clock = new Clock()

clock.pause()
clock.resume()

clock.state().status
// 'running'
```

## speed

### Signature

```js
clock.speed()
clock.speed(value)
```

### Description

Gets or sets the clock's simulation speed.

Without an argument, returns the configured speed.

With an argument, switches to simulated mode and updates the speed. The current instant is preserved.

A positive speed advances time, while a negative speed reverses it. Zero and non-finite speeds are rejected.

Setting the speed emits `change`.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `value` | `number` | no | Finite, nonzero simulation speed. |

### Returns

| Type | Description |
|------|-------------|
| `number` | Current speed when called without arguments. |
| `Clock` | Current instance when setting the speed. |

### Throws

| Type | Description |
|------|-------------|
| `RangeError` | Invalid speed. |
| `Error` | The clock has been disposed. |

### Examples

```js
const clock = new Clock()

clock.speed()
// 1

clock.speed(10)
// Run 10 times faster

clock.speed(-2)
// Run backward at twice the normal speed

clock.config().mode
// 'simulated'
```

## reset

### Signature

```js
clock.reset()
```

### Description

Resets the clock to a running realtime clock following the current system time.

The following configuration properties are reset:

- `mode` becomes `'realtime'`.
- `speed` becomes `1`.
- `bounds` becomes `null`.
- `loop` becomes `false`.

The configured `timezone`, `interval`, and `tickInterval` are preserved.

The call emits `reset`, followed by `change`.

### Returns

| Type | Description |
|------|-------------|
| `Clock` | The current clock instance. |

### Throws

| Type | Description |
|------|-------------|
| `Error` | The clock has been disposed. |

### Examples

```js
const clock = new Clock({
  mode: 'simulated',
  timezone: 'Europe/Paris',
  speed: 10
}, '2026-11-20T12:00:00Z')

clock.reset()

clock.config().mode
// 'realtime'

clock.config().speed
// 1

clock.config().timezone
// 'Europe/Paris'
```

## Events

The clock exposes an event-based API for observing time progression and state changes.

Event callbacks receive the event payload directly.

### Available events

| Event | Payload | Description |
|-------|---------|-------------|
| `tick` | `{ time, interval }` | Periodic notification while the clock is running. |
| `change` | `{ time, interval, status }` | Explicit configuration, time, or status change. |
| `pause` | `{ time, interval, status }` | Clock paused. |
| `resume` | `{ time, interval, status }` | Clock resumed. |
| `reset` | `{ time, interval, status }` | Clock reset. |
| `end` | `{ time, interval, status }` | Clock reached a playback bound. |
| `loop` | `{ time, cycles, direction }` | Clock wrapped around its bounds. |

All `time` values are `DateTime` instances. All `interval` values are `Interval` instances or `null`.

For `loop`:

| Property | Type | Description |
|----------|------|-------------|
| `time` | `DateTime` | Wrapped clock time. |
| `cycles` | `number` | Number of crossed cycles, always positive. |
| `direction` | `number` | `1` for forward progression, `-1` for backward progression. |

Periodic notifications are generated only when the clock is running, `tickInterval` is greater than zero, and at least one `tick`, `loop`, or `end` listener is registered.

The interval is measured in real milliseconds and does not scale with simulation speed.

Clock time continues to progress even when no timer is active. Reading the clock can also detect and emit `loop` or `end` events.

The `change` event is associated with explicit modifications, not with every natural progression of time.

### Examples

```js
const clock = new Clock({
  mode: 'simulated',
  speed: 5,
  tickInterval: 1000
}, '2026-11-20T12:00:00Z')

clock.on('tick', ({ time, interval }) => {
  console.log(time.toISOString(), interval)
})

clock.on('change', ({ time, status }) => {
  console.log(status, time.toISOString())
})

clock.on('end', ({ time }) => {
  console.log('Playback ended at', time.toISOString())
})
```

## on

### Signature

```js
clock.on(event, callback)
```

### Description

Registers a callback for a clock event.

The callback receives the event payload directly, not the internal event bus envelope.

Multiple subscriptions of the same callback are supported.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `event` | `string` | yes | Event name. |
| `callback` | `function` | yes | Handler receiving the event payload. |

### Returns

| Type | Description |
|------|-------------|
| `function` | Function that removes this specific subscription. |

### Throws

| Type | Description |
|------|-------------|
| `TypeError` | The callback is not a function. |
| `Error` | The clock has been disposed. |

### Examples

```js
const clock = new Clock()

const unsubscribe = clock.on('tick', ({ time }) => {
  console.log(time.toISOString())
})

// Later
unsubscribe()
```

## once

### Signature

```js
clock.once(event, callback)
```

### Description

Registers a callback that is automatically removed after its first invocation.

Like `on`, the method returns a function that can cancel the subscription before the event occurs.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `event` | `string` | yes | Event name. |
| `callback` | `function` | yes | Handler receiving the event payload. |

### Returns

| Type | Description |
|------|-------------|
| `function` | Function that cancels this specific subscription. |

### Throws

The same exceptions as `on`.

### Examples

```js
const clock = new Clock()

clock.once('pause', ({ status }) => {
  console.log(status)
})

clock.pause()
// Logs 'paused'

clock.resume()
clock.pause()
// No second notification
```

## off

### Signature

```js
clock.off(event, callback)
```

### Description

Removes the first matching subscription for a callback and event.

If the same callback has been registered multiple times, each call removes only one subscription.

Subscriptions created with `once` can also be removed.

If no matching subscription exists, the method has no effect.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `event` | `string` | yes | Event name. |
| `callback` | `function` | yes | Previously registered callback. |

### Returns

| Type | Description |
|------|-------------|
| `undefined` | No return value. |

### Examples

```js
const clock = new Clock()
const handler = ({ status }) => console.log(status)

clock.on('change', handler)
clock.off('change', handler)
```

## dispose

### Signature

```js
clock.dispose()
```

### Description

Disposes the clock and releases its resources.

Stops periodic notifications, removes all event subscriptions, and destroys the internal event bus.

Calling `dispose` multiple times is safe.

After disposal, clock operations that require an active instance throw an error. The `disposed` property remains accessible.

### Returns

| Type | Description |
|------|-------------|
| `undefined` | No return value. |

### Examples

```js
const clock = new Clock()

clock.on('tick', ({ time }) => {
  console.log(time.toISOString())
})

clock.dispose()

clock.disposed
// true

clock.now()
// Error: Clock has been disposed
```
