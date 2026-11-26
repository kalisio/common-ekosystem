let Clock
let getGlobalClock
let setGlobalClock
let setup

const clocks = []

function createClock () {
  const clock = new Clock()
  clocks.push(clock)
  return clock
}

beforeEach(async () => {
  vi.resetModules()
  const runtime = await import('@kalisio/common-time')
  Clock = runtime.Clock
  getGlobalClock = runtime.getGlobalClock
  setGlobalClock = runtime.setGlobalClock
  setup = (await import('@kalisio/common-time/setup')).setup
})

afterEach(() => {
  for (const clock of clocks.splice(0)) {
    if (!clock.disposed) clock.dispose()
  }
})

describe('setup', () => {
  it('installs the provided clock', () => {
    const clock = createClock()
    setup({ clock })
    expect(getGlobalClock()).toBe(clock)
  })
  it('accepts being called without options', () => {
    expect(() => setup()).not.toThrow()
  })
  it('does not configure a default clock', () => {
    setup()
    expect(getGlobalClock()).toBeUndefined()
  })
  it('does not replace the global clock when called without options', () => {
    const clock = createClock()
    setGlobalClock(clock)
    setup()
    expect(getGlobalClock()).toBe(clock)
  })
  it('accepts an undefined clock without changing the global clock', () => {
    const clock = createClock()
    setGlobalClock(clock)
    setup({ clock: undefined })
    expect(getGlobalClock()).toBe(clock)
  })
  it('replaces the global clock when another clock is provided', () => {
    const first = createClock()
    const second = createClock()
    setup({ clock: first })
    setup({ clock: second })
    expect(getGlobalClock()).toBe(second)
    expect(first.disposed).toBe(false)
  })
  it('rejects invalid setup options', () => {
    for (const options of [null, 42, 'invalid', []]) {
      expect(() => setup(options)).toThrow('invalid setup options')
    }
  })
  it('rejects an invalid clock', () => {
    for (const clock of [null, {}, 42, 'invalid']) {
      expect(() => setup({ clock })).toThrow('invalid setup options')
    }
  })
  it('accepts a disposed clock', () => {
    const clock = createClock()
    clock.dispose()
    setup({ clock })
    expect(getGlobalClock()).toBe(clock)
  })
  it('preserves the global clock when setup fails', () => {
    const clock = createClock()
    setup({ clock })
    expect(() => setup({ clock: {} })).toThrow('invalid setup options')
    expect(getGlobalClock()).toBe(clock)
  })
})
