import { is } from '@kalisio/common-core/predicates'
import { EventBus } from '@kalisio/common-core/runtime'
import { DateTime } from '../models/date-time.js'
import { Duration } from '../models/duration.js'
import { TimeRange } from '../models/time-range.js'
import { timezone } from '../utilities/timezone.js'

const DEFAULT_CONFIG = {
  mode: 'realtime',
  timezone: 'UTC',
  speed: 1,
  tickInterval: 1000,
  window: null,
  bounds: null,
  loop: false
}

function normalizeWindow (value) {
  if (value === null) return null
  if (!is.plainObject(value) ||
      !Object.hasOwn(value, 'start') ||
      !Object.hasOwn(value, 'end')) {
    throw new TypeError('Clock window must have start and end offsets')
  }
  const start = Duration.from(value.start)
  const end = Duration.from(value.end)
  // Calendar offsets could be ordered at one date and reversed at another
  let startOffset, endOffset
  try {
    startOffset = start.asMilliseconds()
    endOffset = end.asMilliseconds()
  } catch {
    throw new RangeError('Clock window offsets must be time-based durations, such as -PT3H')
  }
  if (startOffset > endOffset) {
    throw new RangeError('Clock window start offset must not be after its end offset')
  }
  return {
    start: start.toISOString(),
    end: end.toISOString()
  }
}

function normalizeBounds (value, timezone) {
  if (value === null) return null
  if (!is.plainObject(value) ||
      !Object.hasOwn(value, 'start') ||
      !Object.hasOwn(value, 'end')) {
    throw new TypeError('Clock bounds must have start and end instants')
  }
  const range = new TimeRange(value.start, value.end, { timezone })
  if (range.isEmpty()) {
    throw new RangeError('Clock bounds must not be empty')
  }
  return {
    start: range.start.toISOString(),
    end: range.end.toISOString()
  }
}

function normalizeConfig (previous, changes) {
  if (!is.plainObject(changes)) {
    throw new TypeError('Clock configuration must be an object')
  }
  for (const key of Object.keys(changes)) {
    if (!Object.hasOwn(DEFAULT_CONFIG, key)) {
      throw new RangeError(`Unknown Clock option: ${key}`)
    }
  }
  // As for every other option, undefined leaves the value unchanged; null is validated and rejected
  let mode = previous.mode
  if (changes.mode !== undefined) {
    mode = changes.mode
  } else if (changes.speed !== undefined && changes.speed !== 1) {
    mode = 'simulated'
  }
  if (!is.oneOf(mode, ['realtime', 'simulated'])) {
    throw new RangeError(`Invalid Clock mode: ${mode}`)
  }
  let speed = previous.speed
  if (changes.speed !== undefined) {
    speed = changes.speed
  } else if (changes.mode === 'realtime') {
    speed = 1
  }
  if (!is.number(speed) || speed === 0) {
    throw new RangeError('Clock speed must be a finite, nonzero number')
  }
  if (mode === 'realtime' && speed !== 1) {
    throw new RangeError('Realtime mode requires speed 1')
  }
  const tickInterval = changes.tickInterval === undefined
    ? previous.tickInterval
    : changes.tickInterval
  if (!is.integer(tickInterval) || tickInterval < 0 || tickInterval > 2147483647) {
    throw new RangeError('tickInterval must be an integer between 0 and 2147483647')
  }
  const zone = timezone.normalize(
    changes.timezone === undefined ? previous.timezone : changes.timezone
  )
  const window = changes.window === undefined ? previous.window : changes.window
  const bounds = changes.bounds === undefined ? previous.bounds : changes.bounds
  const loop = changes.loop === undefined ? previous.loop : changes.loop
  if (!is.boolean(loop)) {
    throw new TypeError('Clock loop must be a boolean')
  }
  const normalizedWindow = normalizeWindow(window)
  const normalizedBounds = normalizeBounds(bounds, zone)
  if (loop && !normalizedBounds) {
    throw new RangeError('Clock loop requires bounds')
  }
  return {
    mode,
    timezone: zone,
    speed,
    tickInterval,
    window: normalizedWindow,
    bounds: normalizedBounds,
    loop
  }
}

function toOffsets (config) {
  return config.window
    ? {
        start: new Duration(config.window.start).asMilliseconds(),
        end: new Duration(config.window.end).asMilliseconds()
      }
    : null
}

export class Clock {
  #config
  #bus = new EventBus()
  #offsets = null
  #anchorTime
  // Monotonic reference for the elapsed time in simulated mode: system clock adjustments do not affect it
  #anchorMonotonic
  #status = 'running'
  // Incremented by every explicit change, so that a computation interrupted by a listener can detect it
  #revision = 0
  #lastTurn = 0
  #timer = null
  #timerInterval = null
  #disposed = false
  // event -> callback -> wrappers, so that off() can find the wrapper of a callback
  #wrappers = new Map()

  constructor (config = {}, initialTime = Date.now()) {
    const normalized = normalizeConfig(DEFAULT_CONFIG, config)
    const offsets = toOffsets(normalized)

    const initial = normalized.mode === 'realtime'
      ? Date.now()
      : DateTime.from(initialTime, { timezone: normalized.timezone }).timestamp

    const { time, ended, turn } = this.#constrain(initial, normalized)
    // Throws when the time or its window cannot be represented as a Date
    this.#snapshot(time, normalized, offsets)

    this.#applyConfig(normalized, offsets)
    this.#anchorMonotonic = performance.now()
    this.#anchorTime = time
    this.#lastTurn = this.#config.mode === 'realtime' ? turn : 0

    if (ended) this.#status = 'ended'
  }

  #applyConfig (config, offsets = toOffsets(config)) {
    this.#config = config
    this.#offsets = offsets
  }

  get disposed () {
    return this.#disposed
  }

  #assertActive () {
    if (this.#disposed) throw new Error('Clock has been disposed')
  }

  // Accepts a candidate configuration, so that a change can be validated before it is applied
  #constrain (raw, config = this.#config) {
    if (!is.number(raw)) {
      throw new RangeError('Clock time is out of range')
    }
    raw = Math.trunc(raw)
    if (!config.bounds) {
      return { time: raw, ended: false, turn: 0 }
    }
    const start = Date.parse(config.bounds.start)
    const end = Date.parse(config.bounds.end)
    if (config.loop) {
      // BigInt: instant - start and the modulo can exceed MAX_SAFE_INTEGER within the Date range
      const origin = BigInt(start)
      const length = BigInt(end) - origin
      const offset = BigInt(raw) - origin
      const position = ((offset % length) + length) % length
      return { time: Number(origin + position), ended: false, turn: Number((offset - position) / length) }
    }
    if (raw >= end) return { time: end, ended: true, turn: 0 }
    if (raw < start) return { time: start, ended: true, turn: 0 }
    return { time: raw, ended: false, turn: 0 }
  }

  // Accepts a candidate configuration, so that a change can be validated before it is applied
  #snapshot (timestamp, config = this.#config, offsets = this.#offsets) {
    const time = new DateTime(timestamp, { timezone: config.timezone })
    const range = offsets
      ? new TimeRange(timestamp + offsets.start, timestamp + offsets.end, { timezone: time.timezone })
      : null
    return Object.freeze({ time, range, status: this.#status })
  }

  #current () {
    if (this.#status !== 'running') return this.#anchorTime
    const monotonic = performance.now()
    const raw = this.#config.mode === 'realtime'
      ? Date.now()
      : this.#anchorTime + (monotonic - this.#anchorMonotonic) * this.#config.speed
    const result = this.#constrain(raw)
    // Listeners run synchronously: when one of them changes the clock (set, configure, pause…),
    // its change prevails and the time is computed again from the new state
    const revision = this.#revision
    if (this.#config.loop && result.turn !== this.#lastTurn) {
      const cycles = result.turn - this.#lastTurn
      this.#lastTurn = result.turn
      this.#bus.emit('loop', {
        time: new DateTime(result.time, { timezone: this.#config.timezone }),
        cycles: Math.abs(cycles),
        direction: Math.sign(cycles)
      })
      if (this.#revision !== revision) return this.#current()
    }
    if (result.ended) {
      this.#anchorTime = result.time
      this.#anchorMonotonic = monotonic
      this.#status = 'ended'
      this.#refreshTimer()
      this.#bus.emit('end', this.#snapshot(result.time))
      if (this.#revision !== revision) return this.#current()
    }
    return result.time
  }

  // Emits the specialized event, then change, unless a listener has meanwhile changed the clock,
  // whose own events already describe the new state, or disposed it
  #emitTransition (event, payload) {
    const revision = this.#revision
    if (event) this.#bus.emit(event, payload)
    if (!this.#disposed && this.#revision === revision) {
      this.#bus.emit('change', this.state())
    }
  }

  // Computes the time, then makes sure that no loop or end listener has disposed the clock meanwhile
  #settledTime () {
    const timestamp = this.#current()
    this.#assertActive()
    return timestamp
  }

  #hasObservers () {
    return ['tick', 'loop', 'end'].some(
      event => this.#bus.listenerCount(event) > 0
    )
  }

  // Keeps a running timer untouched when it is still needed with the same period,
  // so that subscribing or unsubscribing does not shift the ticks
  #refreshTimer () {
    const needed = !this.#disposed &&
      this.#status === 'running' &&
      this.#config.tickInterval > 0 &&
      this.#hasObservers()
    if (this.#timer !== null && needed && this.#timerInterval === this.#config.tickInterval) return
    if (this.#timer !== null) clearInterval(this.#timer)
    this.#timer = null
    this.#timerInterval = null
    if (!needed) return
    this.#timerInterval = this.#config.tickInterval
    this.#timer = setInterval(() => {
      const timestamp = this.#current()
      if (this.#disposed) return
      if (this.#status === 'running' && this.#bus.listenerCount('tick') > 0) {
        const { time, range } = this.#snapshot(timestamp)
        this.#bus.emit('tick', Object.freeze({ time, range }))
      }
      if (!this.#hasObservers()) this.#refreshTimer()
    }, this.#config.tickInterval)
  }

  config () {
    this.#assertActive()
    const { window, bounds, ...rest } = this.#config
    return {
      ...rest,
      window: window && { ...window },
      bounds: bounds && { ...bounds }
    }
  }

  state () {
    this.#assertActive()
    return this.#snapshot(this.#settledTime())
  }

  now () {
    this.#assertActive()
    return new DateTime(this.#settledTime(), { timezone: this.#config.timezone })
  }

  range () {
    return this.state().range
  }

  configure (changes) {
    this.#assertActive()
    // Computed first: loop or end listeners may change the clock, and the candidate must start from that state
    const current = this.#settledTime()
    const next = normalizeConfig(this.#config, changes)
    const offsets = toOffsets(next)
    const raw = next.mode === 'realtime' && this.#status === 'running'
      ? Date.now()
      : current
    // Everything is validated against the candidate configuration before the instance changes
    const result = this.#constrain(raw, next)
    this.#snapshot(result.time, next, offsets)
    this.#applyConfig(next, offsets)
    this.#anchorTime = result.time
    this.#anchorMonotonic = performance.now()
    this.#lastTurn = next.mode === 'realtime' && this.#status === 'running'
      ? result.turn
      : 0
    const ended = result.ended && this.#status !== 'ended'
    if (result.ended) this.#status = 'ended'
    this.#revision++
    this.#refreshTimer()
    this.#emitTransition(ended ? 'end' : null, ended ? this.#snapshot(result.time) : undefined)
    return this
  }

  set (value) {
    this.#assertActive()
    const instant = DateTime.from(value, {
      timezone: this.#config.timezone
    }).timestamp
    const bounds = this.#config.bounds
    if (bounds && !this.#config.loop &&
        (instant < Date.parse(bounds.start) || instant >= Date.parse(bounds.end))) {
      throw new RangeError('Time must be within Clock bounds')
    }
    const next = this.#config.mode === 'realtime'
      ? { ...this.#config, mode: 'simulated' }
      : this.#config
    const result = this.#constrain(instant, next)
    this.#snapshot(result.time, next)
    if (next !== this.#config) this.#applyConfig(next, this.#offsets)
    this.#anchorTime = result.time
    this.#anchorMonotonic = performance.now()
    this.#lastTurn = 0
    if (this.#status === 'ended') this.#status = 'paused'
    this.#revision++
    this.#refreshTimer()
    this.#emitTransition(null)
    return this
  }

  pause () {
    this.#assertActive()
    if (this.#status !== 'running') return this
    const time = this.#settledTime()
    if (this.#status !== 'running') return this
    this.#anchorTime = time
    this.#anchorMonotonic = performance.now()
    this.#status = 'paused'
    this.#revision++
    this.#refreshTimer()
    this.#emitTransition('pause', this.state())
    return this
  }

  resume () {
    this.#assertActive()
    if (this.#status === 'ended') {
      throw new Error('Set a new time or reset the ended Clock before resuming')
    }
    if (this.#status === 'running') return this
    this.#anchorMonotonic = performance.now()
    this.#status = 'running'
    this.#revision++
    this.#refreshTimer()
    // Computing the time may end the clock right away, for instance a realtime clock whose bounds
    // have passed while it was paused: end then describes the transition and resume is not announced.
    // The resume has already taken effect, so an end listener disposing the clock is not an error
    const revision = this.#revision
    const timestamp = this.#current()
    if (this.#disposed || this.#revision !== revision || this.#status !== 'running') {
      return this
    }
    this.#emitTransition('resume', this.#snapshot(timestamp))
    return this
  }

  speed (value) {
    this.#assertActive()
    if (value === undefined) return this.#config.speed
    return this.configure({ mode: 'simulated', speed: value })
  }

  reset () {
    this.#assertActive()
    const next = normalizeConfig(this.#config, {
      mode: 'realtime',
      speed: 1,
      bounds: null,
      loop: false
    })
    const time = Date.now()
    this.#snapshot(time, next, this.#offsets)
    this.#applyConfig(next, this.#offsets)
    this.#anchorMonotonic = performance.now()
    this.#anchorTime = time
    this.#lastTurn = 0
    this.#status = 'running'
    this.#revision++
    this.#refreshTimer()
    this.#emitTransition('reset', this.state())
    return this
  }

  // Callbacks receive the event data directly, not the { type, timestamp, data } envelope of the bus
  #subscribe (event, callback, once) {
    this.#assertActive()
    if (!is.function(callback)) throw new TypeError('callback must be a function')
    const forget = () => {
      const byCallback = this.#wrappers.get(event)
      const list = byCallback?.get(callback)
      const index = list ? list.indexOf(wrapper) : -1
      if (index === -1) return
      list.splice(index, 1)
      if (list.length === 0) byCallback.delete(callback)
      if (byCallback.size === 0) this.#wrappers.delete(event)
    }
    const wrapper = (payload) => {
      if (once) {
        forget()
        this.#refreshTimer()
      }
      return callback(payload.data)
    }
    const unsubscribe = once ? this.#bus.once(event, wrapper) : this.#bus.on(event, wrapper)
    if (!this.#wrappers.has(event)) this.#wrappers.set(event, new Map())
    const byCallback = this.#wrappers.get(event)
    if (!byCallback.has(callback)) byCallback.set(callback, [])
    byCallback.get(callback).push(wrapper)
    this.#refreshTimer()
    return () => {
      unsubscribe()
      forget()
      this.#refreshTimer()
    }
  }

  on (event, callback) {
    return this.#subscribe(event, callback, false)
  }

  once (event, callback) {
    return this.#subscribe(event, callback, true)
  }

  /** Removes the first subscription of the callback, once() ones included. */
  off (event, callback) {
    const list = this.#wrappers.get(event)?.get(callback)
    if (list?.length) {
      const wrapper = list.shift()
      if (list.length === 0) this.#wrappers.get(event).delete(callback)
      if (this.#wrappers.get(event).size === 0) this.#wrappers.delete(event)
      this.#bus.off(event, wrapper)
    }
    this.#refreshTimer()
  }

  dispose () {
    if (this.#disposed) return
    this.#disposed = true
    this.#refreshTimer()
    this.#wrappers.clear()
    this.#bus.destroy()
  }
}
