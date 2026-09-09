import { schedule } from '../../src/utilities/index.js'

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('delay', () => {
  it('resolves after the duration', async () => {
    let resolved = false
    schedule.delay(100).then(() => { resolved = true })

    await vi.advanceTimersByTimeAsync(99)
    expect(resolved).toBe(false)

    await vi.advanceTimersByTimeAsync(1)
    expect(resolved).toBe(true)
  })

  it('rejects immediately if the signal is already aborted', async () => {
    const controller = new AbortController()
    controller.abort(new Error('nope'))

    await expect(schedule.delay(100, { signal: controller.signal }))
      .rejects.toThrow('nope')
  })

  it('rejects when aborted during the wait', async () => {
    const controller = new AbortController()
    const promise = schedule.delay(100, { signal: controller.signal })
    const assertion = expect(promise).rejects.toThrow('mid')

    controller.abort(new Error('mid'))
    await assertion
  })
})

describe('at', () => {
  it('waits until the given date', async () => {
    const target = new Date(Date.now() + 5000)
    let done = false
    schedule.at(target).then(() => { done = true })

    await vi.advanceTimersByTimeAsync(4999)
    expect(done).toBe(false)

    await vi.advanceTimersByTimeAsync(1)
    expect(done).toBe(true)
  })

  it('resolves promptly for a past date', async () => {
    let done = false
    schedule.at(new Date(Date.now() - 1000)).then(() => { done = true })

    await vi.advanceTimersByTimeAsync(0)
    expect(done).toBe(true)
  })
})

describe('until', () => {
  it('returns the predicate result once truthy', async () => {
    let calls = 0
    const predicate = () => {
      calls++
      return calls >= 3 ? 'ready' : false
    }

    let result
    schedule.until(predicate, { interval: 100 }).then(value => { result = value })

    await vi.advanceTimersByTimeAsync(0)
    await vi.advanceTimersByTimeAsync(100)
    await vi.advanceTimersByTimeAsync(100)

    expect(result).toBe('ready')
    expect(calls).toBe(3)
  })

  it('throws if the signal is already aborted, without calling the predicate', async () => {
    const controller = new AbortController()
    controller.abort(new Error('stop'))
    const predicate = vi.fn(() => true)

    await expect(schedule.until(predicate, { signal: controller.signal }))
      .rejects.toThrow('stop')
    expect(predicate).not.toHaveBeenCalled()
  })

  it('aborts while waiting between polls', async () => {
    const controller = new AbortController()
    const promise = schedule.until(() => false, { interval: 100, signal: controller.signal })
    const assertion = expect(promise).rejects.toThrow('mid')

    await vi.advanceTimersByTimeAsync(0)
    controller.abort(new Error('mid'))
    await vi.advanceTimersByTimeAsync(0)
    await assertion
  })
})

describe('repeat', () => {
  it('runs the callback after each duration', async () => {
    const callback = vi.fn()
    const handle = schedule.repeat(callback, 100)

    await vi.advanceTimersByTimeAsync(100)
    expect(callback).toHaveBeenCalledTimes(1)

    await vi.advanceTimersByTimeAsync(100)
    expect(callback).toHaveBeenCalledTimes(2)

    handle.abort()
  })

  it('waits the duration before the first callback', async () => {
    const callback = vi.fn()
    const handle = schedule.repeat(callback, 100)

    await vi.advanceTimersByTimeAsync(99)
    expect(callback).not.toHaveBeenCalled()

    handle.abort()
  })

  it('resolves its promise cleanly when aborted via the handle', async () => {
    const handle = schedule.repeat(vi.fn(), 100)

    handle.abort()
    await vi.advanceTimersByTimeAsync(0)
    await expect(handle.promise).resolves.toBeUndefined()
  })

  it('stops when an external signal aborts', async () => {
    const external = new AbortController()
    const handle = schedule.repeat(vi.fn(), 100, { signal: external.signal })

    external.abort()
    await vi.advanceTimersByTimeAsync(0)
    await expect(handle.promise).resolves.toBeUndefined()
  })

  it('rejects the promise if the callback throws', async () => {
    const callback = vi.fn(() => { throw new Error('boom') })
    const handle = schedule.repeat(callback, 100)
    const assertion = expect(handle.promise).rejects.toThrow('boom')

    await vi.advanceTimersByTimeAsync(100)
    await assertion
  })
})

describe('once', () => {
  it('invokes the callback only once and memoizes the result', () => {
    const callback = vi.fn(() => 42)
    const wrapped = schedule.once(callback)

    expect(wrapped()).toBe(42)
    expect(wrapped()).toBe(42)
    expect(callback).toHaveBeenCalledTimes(1)
  })

  it('forwards arguments and this', () => {
    const wrapped = schedule.once(function (a, b) { return this.base + a + b })
    const ctx = { base: 10, run: wrapped }

    expect(ctx.run(2, 3)).toBe(15)
  })

  it('marks as called even if the callback throws, then returns undefined', () => {
    const callback = vi.fn(() => { throw new Error('once') })
    const wrapped = schedule.once(callback)

    expect(() => wrapped()).toThrow('once')
    expect(wrapped()).toBeUndefined()
    expect(callback).toHaveBeenCalledTimes(1)
  })
})

describe('debounce', () => {
  it('fires once after the quiet period', () => {
    const callback = vi.fn()
    const debounced = schedule.debounce(callback, 100)

    debounced()
    debounced()
    debounced()

    vi.advanceTimersByTime(99)
    expect(callback).not.toHaveBeenCalled()

    vi.advanceTimersByTime(1)
    expect(callback).toHaveBeenCalledTimes(1)
  })

  it('uses the latest arguments', () => {
    const callback = vi.fn()
    const debounced = schedule.debounce(callback, 100)

    debounced('a')
    debounced('b')
    vi.advanceTimersByTime(100)

    expect(callback).toHaveBeenCalledTimes(1)
    expect(callback).toHaveBeenCalledWith('b')
  })

  it('cancel prevents a pending call', () => {
    const callback = vi.fn()
    const debounced = schedule.debounce(callback, 100)

    debounced()
    debounced.cancel()
    vi.advanceTimersByTime(100)

    expect(callback).not.toHaveBeenCalled()
  })
})

describe('throttle', () => {
  it('runs the leading call immediately and returns its result', () => {
    const callback = vi.fn(() => 'ok')
    const throttled = schedule.throttle(callback, 100)

    expect(throttled()).toBe('ok')
    expect(callback).toHaveBeenCalledTimes(1)
  })

  it('suppresses calls within the window', () => {
    const callback = vi.fn()
    const throttled = schedule.throttle(callback, 100)

    throttled()
    throttled()
    vi.advanceTimersByTime(50)
    throttled()

    expect(callback).toHaveBeenCalledTimes(1)
  })

  it('allows another call once the window has passed', () => {
    const callback = vi.fn()
    const throttled = schedule.throttle(callback, 100)

    throttled()
    vi.advanceTimersByTime(100)
    throttled()

    expect(callback).toHaveBeenCalledTimes(2)
  })
})
