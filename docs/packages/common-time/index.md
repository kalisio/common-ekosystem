---
title: common-time
description: Time utilities for the Kalisio ekosystem
---

# common-time

*Time utilities for the Kalisio ekosystem.*

## Overview

`@kalisio/common-time` provides utilities and models for dates, durations, time ranges, timezones, and application clocks.

::: tip
Moment.js is in maintenance mode and does not receive major feature updates. Its maintainers recommend considering modern alternatives for new projects. `common-time` encapsulates Moment.js behind a stable API to simplify maintenance and a potential migration.
:::

It is organized around three modules:

- [utilities](./utilities/date.md) — Stateless helpers for dates, durations, timezones, and time series.
- [models](./models/date-time.md) — Immutable temporal values and ranges.
- [runtime](./runtime/clock.md) — Clocks, shared time state, event listeners, and locale integration.

Runtime services and locale resources can be initialized through [setup](./setup.md).

::: info

All public APIs use standard JavaScript values and ISO 8601 representations without exposing **Moment.js** objects.

:::

## Installation

::: code-group

```bash [pnpm]
pnpm add @kalisio/common-time
```

```bash [npm]
npm install @kalisio/common-time
```

```bash [yarn]
yarn add @kalisio/common-time
```

:::

```js
import {
  DateTime, Duration, TimeRange,
  date, duration, timezone, timeSeries,
  Clock, getCurrentClock, setCurrentClock, createClockListener,
  registerTimeLocales, loadTimeLocale
} from '@kalisio/common-time'
```

## Usage

### Working with dates and times

`DateTime` represents an instant associated with an IANA timezone. The object is immutable; methods such as `add()` and `withTimezone()` return new instances.

```js
const departure = DateTime.from('2026-11-20T10:00:00', {
  timezone: 'Europe/Paris'
})

const utc = departure.withTimezone('UTC')
departure.format('YYYY-MM-DD HH:mm')
departure.toISOString()
departure.toJSON()
```

### Working with durations

`Duration` represents ISO 8601 durations, including fixed time amounts and calendar periods.

```js
const elapsed = Duration.from('PT3H')
elapsed.asMilliseconds() // 10800000

const start = DateTime.from('2026-11-20T10:00:00Z')
const end = start.add(elapsed)
end.toISOString() // '2026-11-20T13:00:00.000Z'
```

A calendar day is not necessarily 24 elapsed hours across daylight-saving transitions.

### Working with time ranges

`TimeRange` represents an immutable half-open range `[start, end)`. The start is included, the end excluded.

```js
const range = new TimeRange('2026-11-20T10:00:00Z', '2026-11-20T13:00:00Z')

range.duration.toISOString() // 'PT3H'
range.contains('2026-11-20T11:00:00Z') // true
range.contains('2026-11-20T13:00:00Z') // false

const shifted = range.shift('PT1H')
shifted.toString()
// '2026-11-20T11:00:00.000Z/2026-11-20T14:00:00.000Z'
```

Other operations include `overlaps()`, `intersection()`, `withTimezone()`, and `equals()`.

### Using a clock

A `Clock` follows system time (`realtime`) or progresses from a chosen instant using a configurable speed (`simulated`). Time is calculated on demand; a timer is used only when event observers need notifications.

```js
const clock = new Clock({ timezone: 'Europe/Paris', tickInterval: 1000 })
const unsubscribe = clock.on('tick', ({ time }) => {
  console.log(time.format('HH:mm:ss'))
})

unsubscribe()
clock.dispose()
```

### Simulating time

```js
const playback = new Clock({
  mode: 'simulated',
  speed: 60
}, '2026-11-20T10:00:00Z')

playback.speed(-2) // Playback backward
playback.pause()
playback.set('2026-11-20T12:00:00Z')
playback.resume()
playback.dispose()
```

### Using a temporal window

`window` holds relative time offsets, while `range()` returns the resolved `TimeRange`. The tick cadence is independently configured by `tickInterval`.

```js
const clock = new Clock({
  window: { start: '-PT3H', end: 'PT0S' }
})

const { time, range } = clock.state()
console.log(time.toISOString())
console.log(range.start.toISOString())
console.log(range.end.toISOString())

clock.range() // Same type as state().range: TimeRange
clock.dispose()
```

Window offsets must be time-based ISO 8601 durations. Calendar offsets such as `P1M` are not accepted.

### Bounding and looping playback

```js
const clock = new Clock({
  mode: 'simulated',
  speed: 3600,
  bounds: {
    start: '2026-11-20T10:00:00Z',
    end: '2026-11-20T14:00:00Z'
  },
  loop: true
}, '2026-11-20T10:00:00Z')

clock.on('loop', ({ cycles, direction }) => {
  console.log(cycles, direction)
})
```

Without looping, the clock ends at the upper bound or after crossing below the lower bound. Its final instant is the corresponding bound. With looping, it wraps within the configured bounds.

### Listening to clock events

| Event | Description |
|-------|-------------|
| `tick` | Periodic `{ time, range }` notification. |
| `change` | Explicit modification; `{ time, range, status }`. |
| `pause`, `resume`, `reset`, `end` | Lifecycle transitions with `{ time, range, status }`. |
| `loop` | `{ time, cycles, direction }` when bounds are crossed. |

Callbacks receive payloads directly. `on()` and `once()` return an unsubscribe function.

```js
const unsubscribe = clock.on('change', ({ time, range, status }) => {
  console.log(status, time.toISOString(), range)
})
unsubscribe()
```

### Sharing a clock across modules

```js
// Application initialization
const clock = new Clock({ timezone: 'Europe/Paris' })
setCurrentClock(clock)

// Other modules
getCurrentClock().now()
getCurrentClock().range()

// Application shutdown
setCurrentClock(null)
clock.dispose()
```

`getCurrentClock()` returns a lazily initialized realtime clock if none is installed. Installing a new current clock does not dispose the previous one.

### Managing clock listeners

```js
const listener = createClockListener({
  tick: ({ time, range }) => console.log(time.toISOString(), range),
  change: ({ status }) => console.log(status)
})

listener.attach(getCurrentClock())
listener.detach()
```

Listeners can be attached to another `Clock` explicitly; they do not automatically follow changes to the shared current clock.
