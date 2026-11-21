---
title: Clock
description: Runtime clock supporting realtime and simulated time, temporal windows, bounds, and events.
---

# Clock

`Clock` is a mutable temporal reference that follows wall-clock time or progresses at a configurable speed. It supports temporal windows, playback bounds, looping, and notifications. Time is calculated on demand; a timer is created only when needed for event observers.

```js
import { Clock } from '@kalisio/common-time'
```

## Constructor

### Signature

```js
new Clock(config, initialTime)
```

### Description

Creates a running clock. In `realtime` mode, it follows system time and ignores `initialTime`. In `simulated` mode, it starts at `initialTime` and progresses using a monotonic reference. A non-unit speed selects simulated mode automatically unless `mode` is explicitly specified.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `config` | `object` | no | Clock configuration, default `{}`. |
| `initialTime` | `DateTime \| Date \| number \| string \| object` | no | Simulated starting instant, default current time. |

### Configuration

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `mode` | `string` | `'realtime'` | `'realtime'` or `'simulated'`. |
| `timezone` | `string` | `'UTC'` | IANA timezone for parsing and representing instants. |
| `speed` | `number` | `1` | Finite nonzero multiplier; negative values reverse simulated time. Realtime requires `1`. |
| `tickInterval` | `number` | `1000` | Real milliseconds between notifications; `0` disables the periodic timer. |
| `window` | `object \| null` | `null` | `{ start, end }` duration offsets relative to the current instant. |
| `bounds` | `object \| null` | `null` | `{ start, end }` instants restricting playback. |
| `loop` | `boolean` | `false` | Wrap at bounds rather than end; requires nonempty bounds. |

`window` uses **time-based** ISO 8601 durations, such as `-PT3H` and `PT0S`. Calendar offsets (`P1D`, `P1M`, etc.) are not supported. Offsets must be ordered. The `bounds` range is half-open: `[start, end)`.

### Throws

`TypeError` for invalid option shapes or types; `RangeError` for invalid modes, speed, timezone, window, bounds, or starting time.

### Examples

```js
const realtime = new Clock({ timezone: 'Europe/Paris' })

const playback = new Clock({
  mode: 'simulated',
  speed: 60,
  window: { start: '-PT3H', end: 'PT0S' },
  bounds: {
    start: '2026-11-20T09:00:00Z',
    end: '2026-11-20T15:00:00Z'
  },
  loop: true
}, '2026-11-20T12:00:00Z')

const range = playback.range() // TimeRange for the rolling three-hour window
```

## disposed

### Signature

```js
clock.disposed
```

### Description

Read-only flag indicating whether `dispose()` has been called.

### Returns

| Type | Description |
|------|-------------|
| `boolean` | Whether the clock is disposed. |

## config

### Signature

```js
clock.config()
```

### Description

Returns a copy of the normalized configuration. Nested `window` and `bounds` objects are also copied; changing the result does not reconfigure the clock.

### Returns

| Type | Description |
|------|-------------|
| `object` | Clock configuration. |

### Examples

```js
realtime.config()
// { mode: 'realtime', timezone: 'Europe/Paris', speed: 1,
//   tickInterval: 1000, window: null, bounds: null, loop: false }
```

## state

### Signature

```js
clock.state()
```

### Description

Returns a frozen snapshot. The snapshot and its `DateTime` / `TimeRange` values are immutable; the clock itself is mutable.

### Returns

| Property | Type | Description |
|----------|------|-------------|
| `time` | `DateTime` | Current instant. |
| `range` | `TimeRange \| null` | Resolved temporal window, or `null` when no window is set. |
| `status` | `string` | `'running'`, `'paused'`, or `'ended'`. |

### Examples

```js
const { time, range, status } = playback.state()
range.duration.toISOString() // 'PT3H'
```

## now

### Signature

```js
clock.now()
```

### Description

Returns the current `DateTime` in the configured timezone. Realtime clocks follow wall time; simulated clocks use elapsed monotonic time multiplied by speed.

### Returns

| Type | Description |
|------|-------------|
| `DateTime` | Current instant. |

### Examples

```js
playback.now().toISOString()
```

## range

### Signature

```js
clock.range()
```

### Description

Resolves the configured `window` offsets against the current instant. `range` is a `TimeRange`, not a tick period; it is `null` when `window` is not configured.

### Returns

| Type | Description |
|------|-------------|
| `TimeRange \| null` | Current resolved time range. |

### Examples

```js
const clock = new Clock({
  mode: 'simulated',
  window: { start: '-PT3H', end: 'PT0S' }
}, '2026-11-20T12:00:00Z')

clock.range().toString()
// '2026-11-20T09:00:00.000Z/2026-11-20T12:00:00.000Z'
clock.dispose()
```

## configure

### Signature

```js
clock.configure(changes)
```

### Description

Validates and applies partial configuration changes without replacing the instance. `undefined` values leave options unchanged; `window: null` or `bounds: null` clear those options. Validation failure keeps the previous configuration. A successful change emits `change`, and may emit `end` if new bounds are reached.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `changes` | `object` | yes | Partial configuration using constructor options. |

### Returns

| Type | Description |
|------|-------------|
| `Clock` | Current instance. |

### Examples

```js
playback.configure({ speed: -2 })
playback.configure({ window: { start: '-PT1H', end: 'PT0S' } })
playback.configure({ window: null })
```

## set

### Signature

```js
clock.set(value)
```

### Description

Sets the clock instant. Realtime clocks become simulated. Running/paused status is preserved; setting an ended clock makes it paused. An out-of-bounds instant is rejected when `loop` is false, or wrapped when `loop` is true. Emits `change` on success.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `value` | `DateTime \| Date \| number \| string \| object` | yes | New instant. |

### Returns

| Type | Description |
|------|-------------|
| `Clock` | Current instance. |

### Examples

```js
realtime.set('2026-11-20T12:00:00Z')
realtime.config().mode // 'simulated'
```

## pause

### Signature

```js
clock.pause()
```

### Description

Stops progression at the current instant. A successful transition emits `pause`, then `change`; it has no effect if already paused or ended.

### Returns

| Type | Description |
|------|-------------|
| `Clock` | Current instance. |

## resume

### Signature

```js
clock.resume()
```

### Description

Resumes a paused clock. An ended clock must first be moved using `set()` or `reset()`. A successful transition emits `resume`, then `change`; if bounds are reached immediately, `end` is emitted instead of `resume`.

### Returns

| Type | Description |
|------|-------------|
| `Clock` | Current instance. |

### Examples

```js
playback.pause()
playback.resume()
```

## speed

### Signatures

```js
clock.speed()
clock.speed(value)
```

### Description

Gets the configured multiplier or sets it and switches to simulated mode. Negative speeds run backward. Zero and non-finite speeds are rejected.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `value` | `number` | no | Finite nonzero speed to set. |

### Returns

| Type | Description |
|------|-------------|
| `number` | Speed when called without arguments. |
| `Clock` | Current instance when setting speed. |

### Examples

```js
playback.speed(10)
playback.speed() // 10
```

## reset

### Signature

```js
clock.reset()
```

### Description

Restores a running realtime clock at the current system time, with `speed: 1`, `bounds: null`, and `loop: false`. Preserves the configured timezone, tick interval, and temporal window. Emits `reset`, then `change`.

### Returns

| Type | Description |
|------|-------------|
| `Clock` | Current instance. |

### Examples

```js
playback.reset()
playback.config().mode // 'realtime'
```

## Events

### Signatures

```js
clock.on(event, callback)
clock.once(event, callback)
clock.off(event, callback)
```

### Description

Callbacks receive the event payload directly, not an event bus envelope. `on()` subscribes, `once()` subscribes for one notification, and `off()` removes one matching subscription. `on()` and `once()` return unsubscribe functions.

| Event | Payload | Description |
|-------|---------|-------------|
| `tick` | `{ time, range }` | Periodic notification while running. |
| `change` | `{ time, range, status }` | Explicit clock modification. |
| `pause` | `{ time, range, status }` | Paused. |
| `resume` | `{ time, range, status }` | Resumed. |
| `reset` | `{ time, range, status }` | Reset to realtime. |
| `end` | `{ time, range, status }` | Reached a playback bound and stopped. |
| `loop` | `{ time, cycles, direction }` | Crossed playback bounds; `cycles` is positive and `direction` is `1` or `-1`. |

`time` is a `DateTime`; `range` is a `TimeRange` or `null`. Periodic timers run only while the clock is running, `tickInterval > 0`, and at least one `tick`, `loop`, or `end` observer exists. `tickInterval` is measured in real milliseconds, regardless of simulation speed. Other changes are still computed on demand.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `event` | `string` | yes | Event name. |
| `callback` | `function` | yes | Receives the corresponding payload. |

### Returns

| Method | Type | Description |
|--------|------|-------------|
| `on`, `once` | `function` | Unsubscribe function. |
| `off` | `undefined` | Removes the first matching subscription. |

### Examples

```js
const clock = new Clock({ window: { start: '-PT3H', end: 'PT0S' } })

const unsubscribe = clock.on('tick', ({ time, range }) => {
  console.log(time.toISOString(), range.toString())
})

unsubscribe()
clock.dispose()
```

## dispose

### Signature

```js
clock.dispose()
```

### Description

Stops the timer and destroys the event bus. Idempotent. Most methods reject calls after disposal; `off()` and `dispose()` may still be called.

### Returns

| Type | Description |
|------|-------------|
| `undefined` | No return value. |

### Examples

```js
realtime.dispose()
realtime.disposed // true
```
