import { Clock, getCurrentClock, setCurrentClock } from '@kalisio/common-time'
import { setup } from '@kalisio/common-time/setup'

const clocks = []

function createClock () {
  const clock = new Clock()
  clocks.push(clock)
  return clock
}

afterEach(() => {
  setCurrentClock(null)
  for (const clock of clocks.splice(0)) clock.dispose()
})

describe('setup', () => {
  it('installs the provided clock', () => {
    const clock = createClock()
    setup({ clock })
    expect(getCurrentClock()).toBe(clock)
  })
  it('does not replace the current clock when called without options', () => {
    const clock = createClock()
    setCurrentClock(clock)
    setup()
    expect(getCurrentClock()).toBe(clock)
  })
  it('accepts an undefined clock without changing the current clock', () => {
    const clock = createClock()
    setCurrentClock(clock)
    setup({ clock: undefined })
    expect(getCurrentClock()).toBe(clock)
  })
  it('replaces the current clock when another clock is provided', () => {
    const first = createClock()
    const second = createClock()
    setup({ clock: first })
    setup({ clock: second })
    expect(getCurrentClock()).toBe(second)
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
  it('rejects a disposed clock', () => {
    const clock = createClock()
    clock.dispose()
    expect(() => setup({ clock })).toThrow('disposed')
  })
  it('still rejects a clock that is not a Clock instance in production', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.resetModules()
    try {
      const { setup } = await import('@kalisio/common-time/setup')
      expect(() => setup({ clock: {} })).toThrow(TypeError)
      expect(() => setup({ clock: {} })).toThrow('clock must be a Clock instance')
    } finally {
      vi.unstubAllEnvs()
      vi.resetModules()
    }
  })
  it('preserves the current clock when setup fails', () => {
    const clock = createClock()
    setup({ clock })
    expect(() => setup({ clock: {} })).toThrow('invalid setup options')
    expect(getCurrentClock()).toBe(clock)
  })
})
