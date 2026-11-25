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
  Clock, getCurrentClock, setCurrentClock,
  registerTimeLocales, loadTimeLocale
} from '@kalisio/common-time'
```

## Usage

### Using time utilities

Use stateless utility functions to manipulate standard JavaScript values:

- [date](./utilities/date.md) — Date parsing, formatting, and manipulation.
- [duration](./utilities/duration.md) — Duration parsing, conversion, and manipulation.
- [timezone](./utilities/timezone.md) — Timezone-related operations.
- [timeSeries](./utilities/time-series.md) — Time series operations.

### Working with temporal models

Use immutable temporal models to represent and manipulate time values:

- [DateTime](./models/date-time.md) — An instant associated with an IANA timezone.
- [Duration](./models/duration.md) — A fixed time amount or calendar period.
- [TimeRange](./models/time-range.md) — A half-open temporal range.

```js
const start = DateTime.from('2026-11-20T10:00:00Z')
const elapsed = Duration.from('PT3H')
const end = start.add(elapsed)

const range = new TimeRange(start.toISOString(), end.toISOString())

range.duration.toISOString() // 'PT3H'
range.contains('2026-11-20T11:00:00Z') // true
```

Operations on temporal models return new instances without modifying the original values.

### Using a clock

Use [Clock](./runtime/clock.md) to manage application time, either in realtime or simulated mode.

Clocks support configurable playback speed, temporal windows, bounds, looping, and event notifications.

```js
const clock = new Clock({
  timezone: 'Europe/Paris',
  tickInterval: 1000,
  window: { start: '-PT3H', end: 'PT0S' }
})

const unsubscribe = clock.on('tick', ({ time, range }) => {
  console.log(time.toISOString(), range)
})

unsubscribe()
clock.dispose()
```

### Sharing a clock across modules

Use [getCurrentClock and setCurrentClock](./runtime/current-clock.md) to share a clock instance across application modules.

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
