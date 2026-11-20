import { Clock } from '../../src/runtime/clock.js'
import { getCurrentClock, setCurrentClock } from '../../src/runtime/current-clock.js'

describe('current clock', () => {
  afterEach(() => {
    setCurrentClock()
  })

  describe('getCurrentClock', () => {
    it('returns a default realtime clock', () => {
      const clock = getCurrentClock()
      expect(clock).toBeInstanceOf(Clock)
      expect(clock.config().mode).toBe('realtime')
    })
    it('always returns the same default clock', () => {
      expect(getCurrentClock()).toBe(getCurrentClock())
    })
  })

  describe('setCurrentClock', () => {
    it('installs the clock returned everywhere by getCurrentClock', () => {
      const clock = new Clock({ speed: 60 })
      setCurrentClock(clock)
      expect(getCurrentClock()).toBe(clock)
      clock.dispose()
    })
    it.each([
      ['without argument', () => setCurrentClock()],
      ['with undefined', () => setCurrentClock(undefined)],
      ['with null', () => setCurrentClock(null)]
    ])('restores the default clock when called %s', (name, reset) => {
      const fallback = getCurrentClock()
      const clock = new Clock()
      setCurrentClock(clock)
      reset()
      expect(getCurrentClock()).toBe(fallback)
      clock.dispose()
    })
    it('neither disposes nor changes the replaced clock', () => {
      const first = new Clock({ speed: 60 })
      setCurrentClock(first)
      setCurrentClock(new Clock())
      expect(first.disposed).toBe(false)
      expect(first.config().speed).toBe(60)
      first.dispose()
    })
    it.each([
      ['a configuration object', { mode: 'simulated' }],
      ['a string', 'clock'],
      ['a number', 42]
    ])('rejects %s and keeps the installed clock', (name, value) => {
      const clock = new Clock()
      setCurrentClock(clock)
      expect(() => setCurrentClock(value)).toThrow('clock must be a Clock instance')
      expect(getCurrentClock()).toBe(clock)
      clock.dispose()
    })
    it('rejects a disposed clock and keeps the installed clock', () => {
      const disposed = new Clock()
      disposed.dispose()
      expect(() => setCurrentClock(disposed)).toThrow(Error)
      expect(getCurrentClock()).not.toBe(disposed)
    })
  })
})
