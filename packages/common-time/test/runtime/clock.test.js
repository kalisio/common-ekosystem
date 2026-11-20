import { DateTime, Interval } from '../../src/models/index.js'
import { Clock } from '../../src/runtime/index.js'

const NOW = '2026-11-20T12:00:00.000Z'
const BOUNDS = { start: '2026-11-20T12:00:00.000Z', end: '2026-11-20T14:00:00.000Z' }

describe('Clock', () => {
  let clocks

  const create = (config, initialTime) => {
    const clock = new Clock(config, initialTime)
    clocks.push(clock)
    return clock
  }

  beforeEach(() => {
    clocks = []
    // performance is faked explicitly, since the simulated time is measured with performance.now()
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'Date', 'performance'] })
    vi.setSystemTime(new Date(NOW))
  })

  afterEach(() => {
    for (const clock of clocks) clock.dispose()
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  describe('constructor', () => {
    it('defaults to a running realtime clock in UTC', () => {
      const clock = create()
      expect(clock.now().toISOString()).toBe(NOW)
      expect(clock.now().timezone).toBe('UTC')
      expect(clock.state().status).toBe('running')
      expect(clock.config()).toEqual({ mode: 'realtime', timezone: 'UTC', speed: 1, tickInterval: 1000, interval: null, bounds: null, loop: false })
    })
    it('ignores the initial time in realtime mode', () => {
      expect(create({}, '2026-01-01T00:00:00Z').now().toISOString()).toBe(NOW)
    })
    it('starts a simulated clock at the initial time', () => {
      const clock = create({ mode: 'simulated' }, '2026-01-01T00:00:00Z')
      expect(clock.now().toISOString()).toBe('2026-01-01T00:00:00.000Z')
    })
    it('interprets an initial time without offset in its timezone', () => {
      const clock = create({ mode: 'simulated', timezone: 'Europe/Paris' }, '2026-01-01T01:00:00')
      expect(clock.now().toISOString()).toBe('2026-01-01T00:00:00.000Z')
      expect(clock.now().timezone).toBe('Europe/Paris')
    })
    it('switches to simulated mode when a speed other than 1 is given', () => {
      expect(create({ speed: 60 }).config().mode).toBe('simulated')
      expect(create({ speed: 1 }).config().mode).toBe('realtime')
    })
    it('normalizes the configuration', () => {
      const config = create({ timezone: 'europe/paris', interval: { start: '-PT3H', end: 'pt0s' }, bounds: BOUNDS }).config()
      expect(config.timezone).toBe('Europe/Paris')
      expect(config.interval).toEqual({ start: '-PT3H', end: 'P0D' })
      expect(config.bounds).toEqual(BOUNDS)
    })
    it('rejects invalid configurations', () => {
      for (const config of [null, [], 'realtime']) {
        expect(() => new Clock(config)).toThrow(TypeError)
      }
      for (const config of [
        { unknown: true },
        { mode: 'fast' },
        { speed: 0 },
        { speed: Infinity },
        { mode: 'realtime', speed: 2 },
        { tickInterval: -1 },
        { tickInterval: 1.5 },
        { timezone: 'Mars/Olympus' },
        { loop: true },
        { bounds: { start: NOW, end: NOW } },
        { bounds: { start: BOUNDS.end, end: BOUNDS.start } }
      ]) {
        expect(() => new Clock(config)).toThrow(RangeError)
      }
      expect(() => new Clock({ loop: 'yes', bounds: BOUNDS })).toThrow(TypeError)
      expect(() => new Clock({ interval: { start: '-PT3H' } })).toThrow(TypeError)
      expect(() => new Clock({ bounds: { start: NOW } })).toThrow(TypeError)
    })
    it('rejects interval offsets whose start is after their end', () => {
      expect(() => new Clock({ interval: { start: 'PT0S', end: '-PT3H' } })).toThrow(RangeError)
    })
    it('rejects a time whose window cannot be represented as a Date', () => {
      expect(() => new Clock({ mode: 'simulated', interval: { start: 'PT0S', end: 'PT1H' } }, 8.64e15 - 1000)).toThrow(RangeError)
    })
    it('rejects calendar interval offsets, which could be reversed at another date', () => {
      for (const interval of [{ start: '-P1D', end: 'PT0S' }, { start: 'P1M', end: 'P30D' }, { start: '-PT1H', end: 'P1W' }]) {
        expect(() => new Clock({ interval })).toThrow(RangeError)
      }
    })
  })

  describe('time', () => {
    it('follows the wall clock in realtime mode', () => {
      const clock = create()
      vi.advanceTimersByTime(5000)
      expect(clock.now().toISOString()).toBe('2026-11-20T12:00:05.000Z')
    })
    it('progresses at the configured speed in simulated mode', () => {
      const clock = create({ speed: 60 }, '2026-01-01T00:00:00Z')
      vi.advanceTimersByTime(1000)
      expect(clock.now().toISOString()).toBe('2026-01-01T00:01:00.000Z')
    })
    it('measures the simulated time independently of system clock adjustments', () => {
      const clock = create({ speed: 60 }, '2026-01-01T00:00:00Z')
      vi.setSystemTime(new Date('2026-11-20T13:00:00Z'))
      expect(clock.now().toISOString()).toBe('2026-01-01T00:00:00.000Z')
      vi.advanceTimersByTime(1000)
      expect(clock.now().toISOString()).toBe('2026-01-01T00:01:00.000Z')
    })
    it('follows system clock adjustments in realtime mode', () => {
      const clock = create()
      vi.setSystemTime(new Date('2026-11-20T13:00:00Z'))
      expect(clock.now().toISOString()).toBe('2026-11-20T13:00:00.000Z')
    })
    it('goes backward with a negative speed', () => {
      const clock = create({ speed: -60 }, '2026-01-01T00:00:00Z')
      vi.advanceTimersByTime(1000)
      expect(clock.now().toISOString()).toBe('2025-12-31T23:59:00.000Z')
    })
    it('returns a frozen snapshot of the time, interval and status', () => {
      const clock = create({ interval: { start: '-PT3H', end: 'PT0S' } })
      const state = clock.state()
      expect(Object.isFrozen(state)).toBe(true)
      expect(state.time).toBeInstanceOf(DateTime)
      expect(state.interval).toBeInstanceOf(Interval)
      expect(state.interval.toString()).toBe('2026-11-20T09:00:00.000Z/2026-11-20T12:00:00.000Z')
      expect(state.status).toBe('running')
    })
    it('resolves the interval against the current time', () => {
      const clock = create({ interval: { start: '-PT3H', end: 'PT0S' } })
      vi.advanceTimersByTime(60000)
      expect(clock.interval().toString()).toBe('2026-11-20T09:01:00.000Z/2026-11-20T12:01:00.000Z')
      expect(create().interval()).toBeNull()
    })
    it('applies time-based offsets as exact durations, whatever the timezone', () => {
      const clock = create({ mode: 'simulated', timezone: 'Europe/Paris', interval: { start: '-PT24H', end: 'PT0S' } }, '2026-03-29T12:00:00')
      expect(clock.interval().duration.toISOString()).toBe('PT24H')
      expect(clock.interval().timezone).toBe('Europe/Paris')
    })
    it('returns a copy of its configuration', () => {
      const clock = create({ bounds: BOUNDS })
      clock.config().bounds.start = '2000-01-01T00:00:00Z'
      expect(clock.config().bounds).toEqual(BOUNDS)
    })
  })

  describe('pause and resume', () => {
    it('freezes the time while paused', () => {
      const clock = create({ speed: 60 }, '2026-01-01T00:00:00Z')
      clock.pause()
      vi.advanceTimersByTime(5000)
      expect(clock.now().toISOString()).toBe('2026-01-01T00:00:00.000Z')
      expect(clock.state().status).toBe('paused')
    })
    it('resumes a simulated clock from the paused time', () => {
      const clock = create({ speed: 60 }, '2026-01-01T00:00:00Z')
      vi.advanceTimersByTime(1000)
      clock.pause()
      vi.advanceTimersByTime(5000)
      clock.resume()
      vi.advanceTimersByTime(1000)
      expect(clock.now().toISOString()).toBe('2026-01-01T00:02:00.000Z')
    })
    it('resumes a realtime clock at the wall time', () => {
      const clock = create()
      clock.pause()
      vi.advanceTimersByTime(5000)
      clock.resume()
      expect(clock.now().toISOString()).toBe('2026-11-20T12:00:05.000Z')
    })
    it('does not emit resume when the realtime clock has already reached its bounds', () => {
      const clock = create({ bounds: BOUNDS, tickInterval: 0 })
      clock.pause()
      const events = []
      clock.on('end', () => events.push('end'))
      clock.on('resume', () => events.push('resume'))
      vi.setSystemTime(new Date('2026-11-20T15:00:00Z'))
      clock.resume()
      expect(events).toEqual(['end'])
      expect(clock.state().status).toBe('ended')
    })
    it('handles disposal by an end listener during resume', () => {
      const clock = create({ bounds: BOUNDS, tickInterval: 0 })
      clock.pause()
      clock.on('end', () => clock.dispose())
      vi.setSystemTime(new Date('2026-11-20T15:00:00Z'))
      expect(() => clock.resume()).not.toThrow()
      expect(clock.disposed).toBe(true)
    })
    it('emits pause and resume only on effective transitions', () => {
      const clock = create()
      const events = []
      clock.on('pause', () => events.push('pause'))
      clock.on('resume', () => events.push('resume'))
      clock.resume()
      clock.pause()
      clock.pause()
      clock.resume()
      clock.resume()
      expect(events).toEqual(['pause', 'resume'])
    })
  })

  describe('set', () => {
    it('sets the time of a simulated clock and keeps it running', () => {
      const clock = create({ speed: 60 }, '2026-01-01T00:00:00Z')
      clock.set('2026-06-01T00:00:00Z')
      vi.advanceTimersByTime(1000)
      expect(clock.now().toISOString()).toBe('2026-06-01T00:01:00.000Z')
    })
    it('switches a realtime clock to simulated mode', () => {
      const clock = create()
      clock.set('2026-01-01T00:00:00Z')
      vi.advanceTimersByTime(5000)
      expect(clock.config().mode).toBe('simulated')
      expect(clock.now().toISOString()).toBe('2026-01-01T00:00:05.000Z')
    })
    it('interprets a time without offset in its timezone', () => {
      const clock = create({ mode: 'simulated', timezone: 'Europe/Paris' })
      clock.set('2026-01-01T01:00:00')
      expect(clock.now().toISOString()).toBe('2026-01-01T00:00:00.000Z')
    })
    it('rejects a time outside the bounds', () => {
      const clock = create({ mode: 'simulated', bounds: BOUNDS }, BOUNDS.start)
      expect(() => clock.set('2026-11-20T11:59:59Z')).toThrow(RangeError)
      expect(() => clock.set(BOUNDS.end)).toThrow(RangeError)
      expect(() => clock.set('invalid')).toThrow(RangeError)
    })
    it('wraps a time outside the bounds when looping', () => {
      const clock = create({ mode: 'simulated', bounds: BOUNDS, loop: true }, BOUNDS.start)
      clock.set('2026-11-20T14:30:00Z')
      expect(clock.now().toISOString()).toBe('2026-11-20T12:30:00.000Z')
    })
    it('rejects a time whose window cannot be represented as a Date and keeps the previous state', () => {
      const clock = create({ interval: { start: '-PT1H', end: 'PT1H' } })
      expect(() => clock.set(8.64e15 - 1000)).toThrow(RangeError)
      expect(clock.config().mode).toBe('realtime')
      expect(clock.now().toISOString()).toBe(NOW)
    })
    it('pauses an ended clock so that it can be resumed', () => {
      const clock = create({ speed: 3600, bounds: BOUNDS }, BOUNDS.start)
      vi.advanceTimersByTime(3000)
      clock.now()
      expect(clock.state().status).toBe('ended')
      clock.set('2026-11-20T13:00:00Z')
      expect(clock.state().status).toBe('paused')
      clock.resume()
      vi.advanceTimersByTime(1000)
      expect(clock.now().toISOString()).toBe('2026-11-20T14:00:00.000Z')
    })
  })

  describe('configure', () => {
    it('keeps the current time when the speed changes', () => {
      const clock = create({ speed: 60 }, '2026-01-01T00:00:00Z')
      vi.advanceTimersByTime(1000)
      clock.configure({ speed: 120 })
      vi.advanceTimersByTime(1000)
      expect(clock.now().toISOString()).toBe('2026-01-01T00:03:00.000Z')
    })
    it('switches a realtime clock to simulated mode from the wall time', () => {
      const clock = create()
      clock.configure({ speed: 60 })
      vi.advanceTimersByTime(1000)
      expect(clock.config().mode).toBe('simulated')
      expect(clock.now().toISOString()).toBe('2026-11-20T12:01:00.000Z')
    })
    it('goes back to the wall time and speed 1 in realtime mode', () => {
      const clock = create({ speed: 60 }, '2026-01-01T00:00:00Z')
      clock.configure({ mode: 'realtime' })
      expect(clock.config().speed).toBe(1)
      expect(clock.now().toISOString()).toBe(NOW)
    })
    it('reads and writes the speed', () => {
      const clock = create()
      expect(clock.speed()).toBe(1)
      expect(clock.speed(10)).toBe(clock)
      expect(clock.speed()).toBe(10)
      expect(clock.config().mode).toBe('simulated')
    })
    it('changes the timezone of the returned times', () => {
      const clock = create()
      clock.configure({ timezone: 'Asia/Tokyo' })
      expect(clock.now().timezone).toBe('Asia/Tokyo')
      expect(clock.now().toISOString()).toBe(NOW)
    })
    it('treats undefined options as unchanged and rejects null ones', () => {
      const clock = create({ speed: 60 })
      clock.configure({ mode: undefined, speed: undefined, tickInterval: undefined })
      expect(clock.config()).toMatchObject({ mode: 'simulated', speed: 60, tickInterval: 1000 })
      expect(() => clock.configure({ mode: null })).toThrow(RangeError)
      expect(() => clock.configure({ speed: null })).toThrow(RangeError)
    })
    it('rejects an invalid change and keeps the previous configuration', () => {
      const clock = create({ interval: { start: '-PT3H', end: 'PT0S' } })
      const before = clock.config()
      expect(() => clock.configure({ interval: { start: 'PT0S', end: '-PT3H' } })).toThrow(RangeError)
      expect(() => clock.configure({ speed: 0 })).toThrow(RangeError)
      expect(clock.config()).toEqual(before)
      expect(clock.interval().duration.toISOString()).toBe('PT3H')
    })
    it('rejects a window that cannot be represented as a Date and keeps the previous state', () => {
      const clock = create({ interval: { start: '-PT1H', end: 'PT0S' } })
      const before = clock.config()
      expect(() => clock.configure({ interval: { start: '-PT1H', end: 'PT3000000000H' } })).toThrow(RangeError)
      expect(clock.config()).toEqual(before)
      expect(clock.state().interval.duration.toISOString()).toBe('PT1H')
    })
    it('emits change after an explicit modification', () => {
      const clock = create()
      const listener = vi.fn()
      clock.on('change', listener)
      clock.configure({ speed: 2 })
      expect(listener).toHaveBeenCalledOnce()
    })
  })

  describe('bounds and end', () => {
    it('ends at the upper bound and emits end once', () => {
      const clock = create({ speed: 3600, bounds: BOUNDS }, BOUNDS.start)
      const listener = vi.fn()
      clock.on('end', listener)
      vi.advanceTimersByTime(5000)
      expect(listener).toHaveBeenCalledOnce()
      expect(listener.mock.calls[0][0].time.toISOString()).toBe(BOUNDS.end)
      expect(clock.now().toISOString()).toBe(BOUNDS.end)
      expect(clock.state().status).toBe('ended')
    })
    it('ends at the lower bound when going backward', () => {
      const clock = create({ speed: -3600, bounds: BOUNDS }, '2026-11-20T13:00:00Z')
      vi.advanceTimersByTime(2000)
      expect(clock.now().toISOString()).toBe(BOUNDS.start)
      expect(clock.state().status).toBe('ended')
    })
    it('stops its timer once ended and refuses to resume', () => {
      const clock = create({ speed: 3600, bounds: BOUNDS }, BOUNDS.start)
      clock.on('end', () => {})
      vi.advanceTimersByTime(5000)
      expect(vi.getTimerCount()).toBe(0)
      expect(() => clock.resume()).toThrow(Error)
    })
    it('detects the end when the time is read without a timer', () => {
      const clock = create({ speed: 3600, bounds: BOUNDS, tickInterval: 0 }, BOUNDS.start)
      const listener = vi.fn()
      clock.on('end', listener)
      vi.advanceTimersByTime(5000)
      expect(listener).not.toHaveBeenCalled()
      clock.now()
      expect(listener).toHaveBeenCalledOnce()
    })
    it('emits end when new bounds exclude the current time', () => {
      const clock = create({ mode: 'simulated' }, NOW)
      const listener = vi.fn()
      clock.on('end', listener)
      clock.configure({ bounds: { start: '2026-11-19T00:00:00Z', end: '2026-11-20T06:00:00Z' } })
      expect(clock.state().status).toBe('ended')
      expect(listener).toHaveBeenCalledOnce()
    })
  })

  describe('loop', () => {
    it('wraps the time within the bounds', () => {
      const clock = create({ speed: 3600, bounds: BOUNDS, loop: true, tickInterval: 0 }, BOUNDS.start)
      vi.advanceTimersByTime(2500)
      expect(clock.now().toISOString()).toBe('2026-11-20T12:30:00.000Z')
      expect(clock.state().status).toBe('running')
    })
    it('emits loop with the number of cycles and the direction', () => {
      const clock = create({ speed: 3600, bounds: BOUNDS, loop: true, tickInterval: 10000 }, BOUNDS.start)
      const listener = vi.fn()
      clock.on('loop', listener)
      vi.advanceTimersByTime(10000)
      expect(listener).toHaveBeenCalledOnce()
      expect(listener.mock.calls[0][0]).toMatchObject({ cycles: 5, direction: 1 })
    })
    it('loops backward with a negative speed', () => {
      const clock = create({ speed: -3600, bounds: BOUNDS, loop: true }, '2026-11-20T13:00:00Z')
      const listener = vi.fn()
      clock.on('loop', listener)
      vi.advanceTimersByTime(2000)
      expect(listener).toHaveBeenCalledOnce()
      expect(listener.mock.calls[0][0].direction).toBe(-1)
      expect(clock.now().toISOString()).toBe('2026-11-20T13:00:00.000Z')
    })
  })

  describe('reentrancy', () => {
    const LOOPING = { mode: 'simulated', bounds: { start: 0, end: 3000 }, loop: true, tickInterval: 0 }
    it('returns the updated time when a loop listener changes it', () => {
      const clock = create(LOOPING, 2000)
      clock.on('loop', () => clock.set(1000))
      vi.advanceTimersByTime(1500)
      expect(clock.now().timestamp).toBe(1000)
    })
    it('returns the updated time when an end listener changes it', () => {
      const clock = create({ mode: 'simulated', bounds: { start: 0, end: 3000 }, tickInterval: 0 }, 2000)
      clock.on('end', () => clock.set(1000))
      vi.advanceTimersByTime(1500)
      expect(clock.now().timestamp).toBe(1000)
      expect(clock.state().status).toBe('paused')
    })
    it('pauses at the time set by a loop listener', () => {
      const clock = create(LOOPING, 2000)
      clock.on('loop', () => clock.set(1000))
      vi.advanceTimersByTime(1500)
      clock.pause()
      expect(clock.now().timestamp).toBe(1000)
    })
    it('keeps the changes made by a loop listener during configure', () => {
      const clock = create(LOOPING, 2000)
      clock.on('loop', () => clock.configure({ timezone: 'Europe/Paris' }))
      vi.advanceTimersByTime(1500)
      clock.configure({ speed: 2 })
      expect(clock.config()).toMatchObject({ timezone: 'Europe/Paris', speed: 2 })
    })
    it('emits end before change when configure ends the clock', () => {
      const clock = create({ mode: 'simulated', tickInterval: 0 }, 500)
      const events = []
      clock.on('end', ({ time, status }) => events.push(['end', time.timestamp, status]))
      clock.on('change', ({ time, status }) => {
        events.push(['change', time.timestamp, status])
        if (status === 'ended') clock.set(200)
      })
      clock.configure({ bounds: { start: 0, end: 500 } })
      expect(events).toEqual([['end', 500, 'ended'], ['change', 500, 'ended'], ['change', 200, 'paused']])
    })
    it('lets the events of a listener change replace the pending change event', () => {
      const clock = create({ mode: 'simulated', tickInterval: 0 }, 500)
      const statuses = []
      clock.on('end', () => clock.set(200))
      clock.on('change', ({ status }) => statuses.push(status))
      clock.configure({ bounds: { start: 0, end: 500 } })
      expect(statuses).toEqual(['paused'])
    })
    it('does not emit change for a pause cancelled by a pause listener', () => {
      const clock = create({ tickInterval: 0 })
      const events = []
      clock.on('pause', () => {
        events.push('pause')
        clock.resume()
      })
      clock.on('resume', () => events.push('resume'))
      clock.on('change', ({ status }) => events.push(`change:${status}`))
      clock.pause()
      expect(events).toEqual(['pause', 'resume', 'change:running'])
    })
    it('rejects a read when a loop listener disposes the clock', () => {
      const clock = create(LOOPING, 2000)
      clock.on('loop', () => clock.dispose())
      vi.advanceTimersByTime(1500)
      expect(() => clock.now()).toThrow(/disposed/)
    })
    it('rejects state, configure and pause when a loop listener disposes the clock', () => {
      for (const call of [(clock) => clock.state(), (clock) => clock.configure({ speed: 2 }), (clock) => clock.pause()]) {
        const clock = create(LOOPING, 2000)
        clock.on('loop', () => clock.dispose())
        vi.advanceTimersByTime(1500)
        expect(() => call(clock)).toThrow(/disposed/)
      }
    })
    it('stops its timer quietly when a loop listener disposes the clock', () => {
      const clock = create({ ...LOOPING, tickInterval: 1000 }, 2000)
      const tick = vi.fn()
      clock.on('loop', () => clock.dispose())
      clock.on('tick', tick)
      expect(() => vi.advanceTimersByTime(3000)).not.toThrow()
      expect(tick).not.toHaveBeenCalled()
      expect(vi.getTimerCount()).toBe(0)
    })
    it('lets a listener dispose the clock during a transition', () => {
      const clock = create({ tickInterval: 0 })
      clock.on('pause', () => clock.dispose())
      expect(() => clock.pause()).not.toThrow()
      expect(clock.disposed).toBe(true)
    })
    it('ticks with the time set by a loop listener', () => {
      const clock = create({ ...LOOPING, tickInterval: 1000 }, 2000)
      const tick = vi.fn()
      clock.on('loop', () => clock.set(1000))
      clock.on('tick', tick)
      vi.advanceTimersByTime(1000)
      expect(tick.mock.calls[0][0].time.timestamp).toBe(1000)
    })
  })

  describe('tick', () => {
    it('emits the time and the interval of a same instant', () => {
      const clock = create({ interval: { start: '-PT3H', end: 'PT0S' } })
      const listener = vi.fn()
      clock.on('tick', listener)
      vi.advanceTimersByTime(1000)
      const { time, interval } = listener.mock.calls[0][0]
      expect(time.toISOString()).toBe('2026-11-20T12:00:01.000Z')
      expect(interval.end.isSame(time)).toBe(true)
    })
    it('ticks at tickInterval regardless of the speed', () => {
      const clock = create({ speed: 3600, tickInterval: 500 })
      const listener = vi.fn()
      clock.on('tick', listener)
      vi.advanceTimersByTime(2000)
      expect(listener).toHaveBeenCalledTimes(4)
    })
    it('does not tick while paused', () => {
      const clock = create()
      const listener = vi.fn()
      clock.on('tick', listener)
      clock.pause()
      vi.advanceTimersByTime(5000)
      expect(listener).not.toHaveBeenCalled()
      clock.resume()
      vi.advanceTimersByTime(1000)
      expect(listener).toHaveBeenCalledOnce()
    })
    it('only runs a timer while tick, loop or end are observed', () => {
      const clock = create()
      clock.on('change', () => {})
      expect(vi.getTimerCount()).toBe(0)
      const unsubscribe = clock.on('tick', () => {})
      expect(vi.getTimerCount()).toBe(1)
      unsubscribe()
      expect(vi.getTimerCount()).toBe(0)
    })
    it('never runs a timer when tickInterval is 0', () => {
      const clock = create({ tickInterval: 0 })
      clock.on('tick', () => {})
      expect(vi.getTimerCount()).toBe(0)
    })
    it('restarts its timer when tickInterval changes', () => {
      const clock = create()
      const listener = vi.fn()
      clock.on('tick', listener)
      clock.configure({ tickInterval: 250 })
      vi.advanceTimersByTime(1000)
      expect(listener).toHaveBeenCalledTimes(4)
    })
    it('does not shift the ticks when listeners subscribe or unsubscribe', () => {
      const clock = create()
      const listener = vi.fn()
      clock.on('tick', listener)
      vi.advanceTimersByTime(1500)
      const unsubscribe = clock.on('tick', () => {})
      unsubscribe()
      vi.advanceTimersByTime(500)
      expect(listener).toHaveBeenCalledTimes(2)
    })
    it('stops its timer as soon as a once listener triggered by a read was the last observer', () => {
      const clock = create({ speed: 3600, bounds: BOUNDS, loop: true, tickInterval: 10000 }, BOUNDS.start)
      const listener = vi.fn()
      clock.once('loop', listener)
      vi.advanceTimersByTime(2500)
      expect(vi.getTimerCount()).toBe(1)
      clock.now()
      expect(listener).toHaveBeenCalledOnce()
      expect(vi.getTimerCount()).toBe(0)
    })
    it('stops the timer as soon as the last once tick listener fires', () => {
      const clock = create({ tickInterval: 1000 })
      const callback = vi.fn()
      clock.once('tick', callback)
      expect(vi.getTimerCount()).toBe(1)
      vi.advanceTimersByTime(1000)
      expect(callback).toHaveBeenCalledOnce()
      expect(vi.getTimerCount()).toBe(0)
    })
    it('stops its timer after a once tick listener', () => {
      const clock = create()
      const listener = vi.fn()
      clock.once('tick', listener)
      vi.advanceTimersByTime(3000)
      expect(listener).toHaveBeenCalledOnce()
      expect(vi.getTimerCount()).toBe(0)
    })
  })

  describe('subscriptions', () => {
    it('passes the event data directly to callbacks', () => {
      const clock = create()
      const listener = vi.fn()
      clock.on('pause', listener)
      clock.pause()
      expect(Object.keys(listener.mock.calls[0][0])).toEqual(['time', 'interval', 'status'])
    })
    it('removes a subscription with off or the returned function', () => {
      const clock = create()
      const first = vi.fn()
      const second = vi.fn()
      clock.on('pause', first)
      const unsubscribe = clock.on('pause', second)
      clock.off('pause', first)
      unsubscribe()
      unsubscribe()
      clock.pause()
      expect(first).not.toHaveBeenCalled()
      expect(second).not.toHaveBeenCalled()
    })
    it('removes one subscription at a time for a callback subscribed twice', () => {
      const clock = create()
      const listener = vi.fn()
      clock.on('pause', listener)
      clock.on('pause', listener)
      clock.off('pause', listener)
      clock.pause()
      expect(listener).toHaveBeenCalledOnce()
    })
    it('calls once listeners a single time and lets off remove the remaining ones', () => {
      const clock = create()
      const listener = vi.fn()
      clock.once('pause', listener)
      clock.on('pause', listener)
      clock.pause()
      clock.resume()
      clock.off('pause', listener)
      clock.pause()
      expect(listener).toHaveBeenCalledTimes(2)
    })
    it('rejects callbacks that are not functions', () => {
      expect(() => create().on('tick', null)).toThrow(TypeError)
    })
    it('keeps notifying other listeners when one throws', () => {
      vi.spyOn(console, 'error').mockImplementation(() => {})
      const clock = create()
      const listener = vi.fn()
      clock.on('pause', () => { throw new Error('listener failure') })
      clock.on('pause', listener)
      clock.pause()
      expect(listener).toHaveBeenCalledOnce()
    })
  })

  describe('reset', () => {
    it('goes back to a running realtime clock without bounds', () => {
      const clock = create({ speed: 3600, bounds: BOUNDS, loop: true, timezone: 'Europe/Paris', tickInterval: 500 }, BOUNDS.start)
      clock.pause()
      clock.reset()
      expect(clock.now().toISOString()).toBe(NOW)
      expect(clock.state().status).toBe('running')
      expect(clock.config()).toMatchObject({ mode: 'realtime', speed: 1, bounds: null, loop: false, timezone: 'Europe/Paris', tickInterval: 500 })
    })
    it('emits reset each time', () => {
      const clock = create()
      const listener = vi.fn()
      clock.on('reset', listener)
      clock.reset()
      clock.reset()
      expect(listener).toHaveBeenCalledTimes(2)
    })
  })

  describe('dispose', () => {
    it('stops the timer and rejects further use', () => {
      const clock = create()
      clock.on('tick', () => {})
      clock.dispose()
      expect(vi.getTimerCount()).toBe(0)
      expect(() => clock.now()).toThrow(Error)
      expect(() => clock.on('tick', () => {})).toThrow(Error)
      expect(() => clock.off('tick', () => {})).not.toThrow()
      expect(() => clock.dispose()).not.toThrow()
    })
  })
})
