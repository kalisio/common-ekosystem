---
title: common-time
description: Time utilities for the Kalisio ekosystem
---

# common-time

*Time utilities for the Kalisio ekosystem.*

## Overview

`@kalisio/common-time` provides a unified API for working with dates, times, durations, intervals, timezones,
and clocks across the Kalisio ekosystem.

It centralizes temporal operations that were previously implemented using `moment` and `moment-timezone`
across multiple packages.

Moment.js is now a maintenance-mode project. It no longer receives major feature updates, and its maintainers
recommend considering modern alternatives for new projects. By encapsulating Moment.js behind a consistent
API, `common-time` reduces direct dependencies and facilitates a future migration to another date/time library.

The package provides three complementary levels of abstraction:

- [Utilities](./utilities/date.md) — Functional helpers for parsing, formatting, manipulating, and comparing dates, durations, and timezones.
- [Models](./models/date-time.md) — Immutable `DateTime`, `Duration`, and `Interval` objects for representing temporal values.
- [Runtime](./runtime/clock.md) — A configurable `Clock` supporting realtime and simulated time, temporal windows, playback speeds, bounds, looping, and events.

Applications can also install a shared clock, allowing independent modules to use a common temporal reference.

All public APIs use standard JavaScript values and ISO 8601 representations rather than exposing Moment.js objects.

## Installation

Install with your preferred package manager:

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

Import the required features directly from the package:

```js
import {
  DateTime,
  Duration,
  Interval,
  Clock,
  getClock,
  setClock
} from '@kalisio/common-time'
```

For browser usage, an ESM-compatible CDN that resolves package dependencies may be used, subject to browser compatibility:

```html
<script type="module">
  import { DateTime } from 'https://esm.sh/@kalisio/common-time'

  console.log(DateTime.now().toISOString())
</script>
```

## Usage

### Working with dates and times

The `DateTime` model represents an instant associated with a timezone.

It is immutable: operations return new instances without modifying the original value.

```js
import { DateTime } from '@kalisio/common-time'

const now = DateTime.now()

// Create a date in a specific timezone
const departure = DateTime.from('2026-11-20T10:00:00', {
  timezone: 'Europe/Paris'
})

// Convert its representation to another timezone
const utc = departure.withTimezone('UTC')

// Format a date
console.log(departure.format('YYYY-MM-DD HH:mm'))

// Access the underlying instant
console.log(departure.toISOString())

// Serialize the instant and timezone
console.log(departure.toJSON())
```

The timezone affects calendar operations and formatting, but does not change the underlying instant.

### Working with durations

The `Duration` model represents an ISO 8601 duration.

Durations can express fixed elapsed time as well as calendar-based quantities such as days, months, and years.

```js
import { DateTime, Duration } from '@kalisio/common-time'

const duration = Duration.from('PT3H')

// Convert a time-based duration to milliseconds
console.log(duration.asMilliseconds()) // 10800000

// Combine durations
const extended = duration.add('PT30M')

console.log(extended.toISOString()) // PT3H30M

// Apply a duration to a date
const start = DateTime.from('2026-11-20T10:00:00Z')
const end = start.add(duration)

console.log(end.toISOString()) // 2026-11-20T13:00:00.000Z
```

Calendar durations are applied according to the timezone of the `DateTime`. Consequently, adding one calendar day is not necessarily equivalent to adding 24 hours when crossing a daylight-saving transition.

### Working with intervals

The `Interval` model represents a temporal interval with an inclusive start and an exclusive end: `[start, end)`.

```js
import { Interval } from '@kalisio/common-time'

const interval = new Interval(
  '2026-11-20T10:00:00Z',
  '2026-11-20T13:00:00Z'
)

// Duration of the interval
console.log(interval.duration.toISOString()) // PT3H

// Test whether an instant belongs to the interval
console.log(interval.contains('2026-11-20T11:00:00Z')) // true

// Move the interval
const shifted = interval.shift('PT1H')

console.log(shifted.toString())
// 2026-11-20T11:00:00.000Z/2026-11-20T14:00:00.000Z
```

Intervals also support intersection, overlap detection, and timezone conversion.

### Using a clock

The `Clock` runtime provides a common temporal reference for applications and services.

A clock can operate in two modes:

- **`realtime`** — Follows the system clock.
- **`simulated`** — Advances from a specified instant using a configurable speed, including negative speeds for backward playback.

Time is calculated on demand. An internal timer is only needed to emit notifications to registered observers.

```js
import { Clock } from '@kalisio/common-time'

// A realtime clock
const clock = new Clock({
  timezone: 'Europe/Paris',
  tickInterval: 1000
})

// Read the current time
console.log(clock.now().toISOString())

// Listen for ticks
const unsubscribe = clock.on('tick', ({ time }) => {
  console.log(time.format('HH:mm:ss'))
})

// Stop listening
unsubscribe()

// Release resources
clock.dispose()
```

### Simulating time

A simulated clock can replay historical data, accelerate time, or move backward.

```js
import { Clock } from '@kalisio/common-time'

const clock = new Clock({
  mode: 'simulated',
  speed: 60,
  tickInterval: 1000
}, '2026-11-20T10:00:00Z')

// One simulated minute elapses per real second
clock.on('tick', ({ time }) => {
  console.log(time.toISOString())
})

// Pause playback
clock.pause()

// Change the current instant
clock.set('2026-11-20T12:00:00Z')

// Resume playback
clock.resume()
```

The playback speed and other configuration properties can be changed dynamically:

```js
clock.speed(120)

clock.configure({
  timezone: 'Europe/Paris',
  tickInterval: 500
})
```

### Using a temporal window

A clock can maintain a temporal window relative to its current time.

For example, a three-hour sliding window ending at the current instant:

```js
import { Clock } from '@kalisio/common-time'

const clock = new Clock({
  interval: {
    start: '-PT3H',
    end: 'PT0S'
  }
})

const { time, interval } = clock.state()

console.log(time.toISOString())
console.log(interval.start.toISOString())
console.log(interval.end.toISOString())
```

The temporal window automatically follows the clock.

Window offsets use time-based ISO 8601 durations, such as `PT30M`, `-PT3H`, or `PT12H`. Calendar-based offsets, such as `P1M`, are not supported for clock windows.

### Bounding and looping playback

A simulated clock can be restricted to a temporal range.

When the clock reaches a boundary, it either stops or loops back into the range, according to the `loop` option.

```js
import { Clock } from '@kalisio/common-time'

const clock = new Clock({
  mode: 'simulated',
  speed: 3600,
  bounds: {
    start: '2026-11-20T10:00:00Z',
    end: '2026-11-20T14:00:00Z'
  },
  loop: true
}, '2026-11-20T10:00:00Z')

clock.on('loop', ({ time, cycles, direction }) => {
  console.log(`Completed ${cycles} cycle(s)`)
})

clock.on('tick', ({ time }) => {
  console.log(time.toISOString())
})
```

When `loop` is `false`, the clock stops at the boundary and enters the `ended` state.

A clock exposes its current state through `state()`:

```js
const state = clock.state()

console.log(state.time)
console.log(state.interval)
console.log(state.status) // running, paused or ended
```

### Listening to clock events

Clocks expose an event-driven API for observing temporal changes and playback transitions.

| Event | Description |
|---|---|
| `tick` | Periodic notification containing the current time and resolved interval. |
| `change` | Explicit change of the clock's time, configuration, or state. |
| `pause` | The clock has been paused. |
| `resume` | The clock has resumed. |
| `reset` | The clock has been reset to realtime mode. |
| `loop` | The clock has crossed one or more playback boundaries. |
| `end` | The clock has reached a boundary and stopped. |

Register callbacks with `on()` or `once()`, and remove them with `off()` or the returned unsubscribe function.

```js
const unsubscribe = clock.on('change', ({ time, interval, status }) => {
  console.log(status, time.toISOString())
})

// Remove the subscription
unsubscribe()
```

Callbacks receive the event data directly, without an additional event envelope.

### Sharing a clock across modules

Applications can install a shared clock with `setClock()`.

Other modules can retrieve it using `getClock()` without receiving the instance explicitly.

```js
// Application initialization
import { Clock, setClock } from '@kalisio/common-time'

const clock = new Clock({
  timezone: 'Europe/Paris'
})

setClock(clock)
```

```js
// Another module
import { getClock } from '@kalisio/common-time'

export function getCurrentTime () {
  return getClock().now()
}
```

Without an explicitly installed clock, `getClock()` returns a lazily created realtime clock.

Applications remain responsible for the lifecycle of clocks they install.

Calling `setClock(null)` restores access to the default clock.

### Managing clock listeners

`createClockListener()` groups multiple event handlers into a single object that can be attached to a clock, moved to another clock, or detached.

This is useful when components need to follow different clocks during their lifecycle.

```js
import {
  createClockListener,
  getClock
} from '@kalisio/common-time'

const listener = createClockListener({
  tick: ({ time }) => console.log('Tick:', time.toISOString()),
  change: ({ status }) => console.log('Status:', status),
  end: () => console.log('Playback ended')
})

// Attach to the shared clock
listener.attach(getClock())

// Detach all handlers
listener.detach()
```

Listeners can be moved between clocks without registering or unregistering each callback individually.


