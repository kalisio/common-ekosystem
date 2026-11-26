describe('global event bus', () => {
  let EventBus
  let getGlobalEventBus
  let setGlobalEventBus

  beforeEach(async () => {
    vi.resetModules()
    const runtime = await import('../../src/runtime/index.js')
    EventBus = runtime.EventBus
    getGlobalEventBus = runtime.getGlobalEventBus
    setGlobalEventBus = runtime.setGlobalEventBus
  })

  describe('getGlobalEventBus', () => {
    it('returns null before configuration', () => {
      expect(getGlobalEventBus()).toBeNull()
    })
    it('returns the global event bus', () => {
      const bus = new EventBus()
      setGlobalEventBus(bus)
      expect(getGlobalEventBus()).toBe(bus)
    })
    it('returns the same instance on successive calls', () => {
      const bus = new EventBus()
      setGlobalEventBus(bus)
      expect(getGlobalEventBus()).toBe(getGlobalEventBus())
    })
  })

  describe('setGlobalEventBus', () => {
    it('sets the global event bus', () => {
      const bus = new EventBus()
      setGlobalEventBus(bus)
      expect(getGlobalEventBus()).toBe(bus)
    })
    it('replaces the global event bus', () => {
      const first = new EventBus()
      const second = new EventBus()
      setGlobalEventBus(first)
      setGlobalEventBus(second)
      expect(getGlobalEventBus()).toBe(second)
    })
    it.each([
      ['null', null],
      ['undefined', undefined],
      ['an object', {}],
      ['an array', []],
      ['a string', 'bus'],
      ['a number', 42],
      ['a function', () => {}]
    ])('rejects %s', (name, value) => {
      expect(() => setGlobalEventBus(value))
        .toThrow('bus must be an instance of EventBus')
    })
    it('preserves the global event bus when validation fails', () => {
      const bus = new EventBus()
      setGlobalEventBus(bus)
      expect(() => setGlobalEventBus(null)).toThrow()
      expect(getGlobalEventBus()).toBe(bus)
    })
  })
})
