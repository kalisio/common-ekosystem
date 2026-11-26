describe('global clock', () => {
  let Clock
  let getGlobalClock
  let setGlobalClock
  const clocks = []

  function createClock (config) {
    const clock = new Clock(config)
    clocks.push(clock)
    return clock
  }

  beforeEach(async () => {
    vi.resetModules()
    const runtime = await import('../../src/runtime/index.js')
    Clock = runtime.Clock
    getGlobalClock = runtime.getGlobalClock
    setGlobalClock = runtime.setGlobalClock
  })
  afterEach(() => {
    for (const clock of clocks.splice(0)) {
      if (!clock.disposed) clock.dispose()
    }
  })
  describe('setGlobalClock', () => {
    it('sets the global clock', () => {
      const clock = createClock()
      setGlobalClock(clock)
      expect(getGlobalClock()).toBe(clock)
    })
    it('replaces the global clock without disposing the previous one', () => {
      const first = createClock()
      const second = createClock()
      setGlobalClock(first)
      setGlobalClock(second)
      expect(getGlobalClock()).toBe(second)
      expect(first.disposed).toBe(false)
    })
    it.each([
      null,
      undefined,
      {},
      'clock',
      42
    ])('rejects an invalid clock (%s)', value => {
      expect(() => setGlobalClock(value)).toThrow('clock must be a Clock instance')
    })
    it('preserves the global clock when setting an invalid clock', () => {
      const clock = createClock()
      setGlobalClock(clock)
      expect(() => setGlobalClock({})).toThrow()
      expect(getGlobalClock()).toBe(clock)
    })
    it('accepts a disposed clock', () => {
      const clock = createClock()
      clock.dispose()
      setGlobalClock(clock)
      expect(getGlobalClock()).toBe(clock)
    })
  })
  describe('getGlobalClock', () => {
    it('returns undefined before configuration', () => {
      expect(getGlobalClock()).toBeUndefined()
    })
    it('returns the same instance on every call', () => {
      const clock = createClock()
      setGlobalClock(clock)
      expect(getGlobalClock()).toBe(clock)
      expect(getGlobalClock()).toBe(clock)
    })
    it('returns the global clock after disposal', () => {
      const clock = createClock()
      setGlobalClock(clock)
      clock.dispose()
      expect(getGlobalClock()).toBe(clock)
      expect(getGlobalClock().disposed).toBe(true)
    })
  })
})
