---
title: timeSeries
description: Search chronological instants and estimate their sampling step.
---

# timeSeries

`timeSeries` works with arrays of ascending instants, including duplicates. ISO strings without an offset use UTC.

```js
import { timeSeries } from '@kalisio/common-time'
```

## findNearest, findNext, findPrevious

### Signatures

```js
timeSeries.findNearest(times, value)
timeSeries.findNext(times, value)
timeSeries.findPrevious(times, value)
```

### Description

These functions use binary search on an already sorted array.

- `findNearest` picks the closest instant, favoring the earlier instant on ties and the first index among duplicates.
- `findNext` picks the first instant greater than or equal to the target.
- `findPrevious` picks the last instant less than or equal to the target.

### Parameters

| Name | Type | Description |
|------|------|-------------|
| `times` | `Array<DateTime \| Date \| number \| string>` | Instants sorted in ascending order. Numbers are millisecond timestamps and strings use strict ISO 8601. |
| `value` | `DateTime \| Date \| number \| string` | Target instant in one of the same formats. |

### Returns

| Type | Description |
|------|-------------|
| `{ index: number, difference: number } \| null` | Zero-based index and absolute difference in milliseconds, or `null` when no match exists. |

### Examples

```js
const times = [0, 1000, 1000, 3000]
timeSeries.findNearest(times, 2000) // { index: 1, difference: 1000 }
timeSeries.findNext(times, 1000) // { index: 1, difference: 0 }
timeSeries.findPrevious(times, 1000) // { index: 2, difference: 0 }
timeSeries.findNext(times, 4000) // null
```

## guessStep

### Signature

```js
timeSeries.guessStep(times, { mode = 'minimum' } = {})
```

### Description

Returns the smallest or largest positive gap between consecutive samples. Duplicate timestamps contribute no gap.

### Parameters

| Name | Type | Description |
|------|------|-------------|
| `times` | `Array<DateTime \| Date \| number \| string>` | Instants sorted in ascending order. |
| `options.mode` | `'minimum' \| 'maximum'` | Optional. Defaults to `'minimum'`. |

### Returns

| Type | Description |
|------|-------------|
| `number \| null` | Gap in milliseconds, or `null` when there is no positive gap. |

### Examples

```js
timeSeries.guessStep([0, 1000, 1000, 3000]) // 1000
timeSeries.guessStep([0, 1000, 1000, 3000], { mode: 'maximum' }) // 2000
```
