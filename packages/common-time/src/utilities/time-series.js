import { assert, is } from '@kalisio/common-core/predicates'
import { date } from './date.js'

function timestamp (value) {
  const input = is.object(value) && is.number(value.timestamp) && is.function(value.toDate)
    ? value.timestamp
    : value
  return date.parse(input).getTime()
}

// First position whose timestamp is >= target.
function lowerBound (times, target) {
  let low = 0
  let high = times.length
  while (low < high) {
    const middle = low + Math.floor((high - low) / 2)
    if (timestamp(times[middle]) < target) low = middle + 1
    else high = middle
  }
  return low
}

// First position whose timestamp is > target.
function upperBound (times, target) {
  let low = 0
  let high = times.length
  while (low < high) {
    const middle = low + Math.floor((high - low) / 2)
    if (timestamp(times[middle]) <= target) low = middle + 1
    else high = middle
  }
  return low
}

function findNearest (times, value) {
  assert.that(times, is.array, 'times must be an array')
  const target = timestamp(value)
  if (times.length === 0) return null
  const next = lowerBound(times, target)
  let index
  if (next === 0) index = 0
  else if (next === times.length) index = times.length - 1
  else {
    const before = timestamp(times[next - 1])
    const after = timestamp(times[next])
    index = target - before <= after - target ? next - 1 : next
  }
  // Prefer the first duplicate.
  const chosen = timestamp(times[index])
  return { index: lowerBound(times, chosen), difference: Math.abs(chosen - target) }
}

function findNext (times, value) {
  assert.that(times, is.array, 'times must be an array')
  const target = timestamp(value)
  const index = lowerBound(times, target)
  return index === times.length ? null : { index, difference: timestamp(times[index]) - target }
}

function findPrevious (times, value) {
  assert.that(times, is.array, 'times must be an array')
  const target = timestamp(value)
  const index = upperBound(times, target) - 1
  return index < 0 ? null : { index, difference: target - timestamp(times[index]) }
}

function guessStep (times, { mode = 'minimum' } = {}) {
  assert.all([
    { value: times, validator: is.array, message: 'times must be an array' },
    { value: mode, validator: value => is.oneOf(value, ['minimum', 'maximum']), message: 'invalid step mode' }
  ])
  if (times.length < 2) return null
  let step = mode === 'minimum' ? Infinity : 0
  let previous = timestamp(times[0])
  for (let i = 1; i < times.length; i++) {
    const current = timestamp(times[i])
    const gap = current - previous
    previous = current
    if (gap <= 0) continue
    if (mode === 'minimum') step = Math.min(step, gap)
    else step = Math.max(step, gap)
  }
  return step === Infinity || step === 0 ? null : step
}

export const timeSeries = {
  findNearest,
  findNext,
  findPrevious,
  guessStep
}
