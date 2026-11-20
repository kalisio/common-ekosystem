import { Clock, createClockListener } from '../../src/runtime/index.js'

describe('createClockListener', () => {
  let clocks

  const create = (config, initialTime) => {
    const clock = new Clock(config, initialTime)
    clocks.push(clock)
    return clock
  }

  beforeEach(() => {
    clocks = []
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'Date', 'performance'] })
    vi.setSystemTime(new Date('2026-11-20T12:00:00Z'))
  })

  afterEach(() => {
    for (const clock of clocks) clock.dispose()
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  describe('attach', () => {
    it('subscribes every handler to the clock', () => {
      const clock = create()
      const pause = vi.fn()
      const resume = vi.fn()
      const listener = createClockListener({ pause, resume }).attach(clock)
      clock.pause()
      clock.resume()
      expect(pause).toHaveBeenCalledOnce()
      expect(resume).toHaveBeenCalledOnce()
      expect(Object.keys(pause.mock.calls[0][0])).toEqual(['time', 'interval', 'status'])
      expect(listener.clock).toBe(clock)
    })
    it('moves the handlers to another clock', () => {
      const first = create()
      const second = create()
      const pause = vi.fn()
      const listener = createClockListener({ pause }).attach(first)
      listener.attach(second)
      first.pause()
      expect(pause).not.toHaveBeenCalled()
      second.pause()
      expect(pause).toHaveBeenCalledOnce()
      expect(listener.clock).toBe(second)
    })
    it('keeps a single subscription when attached twice to the same clock', () => {
      const clock = create()
      const pause = vi.fn()
      createClockListener({ pause }).attach(clock).attach(clock)
      clock.pause()
      expect(pause).toHaveBeenCalledOnce()
    })
    it('moves the tick timer with the handlers', () => {
      const first = create()
      const second = create({ mode: 'simulated' }, '2026-01-01T00:00:00Z')
      const tick = vi.fn()
      const listener = createClockListener({ tick }).attach(first)
      expect(vi.getTimerCount()).toBe(1)
      listener.attach(second)
      expect(vi.getTimerCount()).toBe(1)
      vi.advanceTimersByTime(1000)
      expect(tick).toHaveBeenCalledOnce()
      expect(tick.mock.calls[0][0].time.toISOString()).toBe('2026-01-01T00:00:01.000Z')
    })
    it('rejects values that are not usable clocks and stays attached', () => {
      const clock = create()
      const disposed = new Clock()
      disposed.dispose()
      const pause = vi.fn()
      const listener = createClockListener({ pause }).attach(clock)
      for (const value of [null, {}, 'clock']) {
        expect(() => listener.attach(value)).toThrow(TypeError)
      }
      expect(() => listener.attach(disposed)).toThrow(Error)
      clock.pause()
      expect(pause).toHaveBeenCalledOnce()
      expect(listener.clock).toBe(clock)
    })
  })

  describe('atomicity', () => {
    it('keeps the previous clock and leaves no partial subscription when attaching fails', () => {
      const first = create()
      const second = create()
      const pause = vi.fn()
      const resume = vi.fn()
      const listener = createClockListener({ pause, resume }).attach(first)
      const on = second.on.bind(second)
      vi.spyOn(second, 'on')
        .mockImplementationOnce(on)
        .mockImplementationOnce(() => { throw new Error('subscription failure') })
      expect(() => listener.attach(second)).toThrow('subscription failure')
      expect(listener.clock).toBe(first)
      second.pause()
      expect(pause).not.toHaveBeenCalled()
      first.pause()
      expect(pause).toHaveBeenCalledOnce()
    })
  })

  describe('detach', () => {
    it('unsubscribes every handler and stops the timer', () => {
      const clock = create()
      const tick = vi.fn()
      const pause = vi.fn()
      const listener = createClockListener({ tick, pause }).attach(clock)
      listener.detach()
      listener.detach()
      clock.pause()
      vi.advanceTimersByTime(1000)
      expect(pause).not.toHaveBeenCalled()
      expect(tick).not.toHaveBeenCalled()
      expect(vi.getTimerCount()).toBe(0)
      expect(listener.clock).toBeNull()
    })
    it('works when the clock has been disposed meanwhile', () => {
      const clock = create()
      const listener = createClockListener({ tick: () => {} }).attach(clock)
      clock.dispose()
      expect(() => listener.detach()).not.toThrow()
    })
  })

  describe('createClockListener', () => {
    it('rejects invalid handlers', () => {
      for (const handlers of [null, undefined, [], 'tick', { tick: null }, { tick: 'refresh' }, { '': () => {} }, { ' ': () => {} }]) {
        expect(() => createClockListener(handlers)).toThrow(TypeError)
      }
    })
    it('returns a frozen listener', () => {
      expect(Object.isFrozen(createClockListener({}))).toBe(true)
    })
  })
})
