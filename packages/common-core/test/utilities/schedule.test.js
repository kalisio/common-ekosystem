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

  it('accepts a zero duration', async () => {
    let resolved = false
    schedule.delay(0).then(() => { resolved = true })

    await vi.advanceTimersByTimeAsync(0)

    expect(resolved).toBe(true)
  })

  it('throws for an invalid duration', () => {
    expect(() => schedule.delay(-1))
      .toThrow('duration must be a non negative integer')
    expect(() => schedule.delay(1.5))
      .toThrow('duration must be a non negative integer')
    expect(() => schedule.delay('100'))
      .toThrow('duration must be a non negative integer')
  })

  it('throws for invalid options', () => {
    expect(() => schedule.delay(100, { signal: {} }))
      .toThrow('options must be a valid options object')
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

  it('accepts a timestamp', async () => {
    const target = Date.now() + 5000
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

  it('throws for an invalid date', () => {
    expect(() => schedule.at(new Date('invalid')))
      .toThrow('date must be a valid date or timestamp')
    expect(() => schedule.at('2026-09-15'))
      .toThrow('date must be a valid date or timestamp')
    expect(() => schedule.at(-1))
      .toThrow('date must be a valid date or timestamp')
  })

  it('throws for invalid options', () => {
    expect(() => schedule.at(new Date(), { signal: {} }))
      .toThrow('options must be a valid options object')
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

  it('accepts an asynchronous predicate', async () => {
    let calls = 0
    const predicate = async () => {
      calls++
      return calls >= 2 ? 'ready' : false
    }

    const promise = schedule.until(predicate, { interval: 100 })

    await vi.advanceTimersByTimeAsync(0)
    await vi.advanceTimersByTimeAsync(100)

    await expect(promise).resolves.toBe('ready')
    expect(calls).toBe(2)
  })

  it('rejects for an invalid predicate', async () => {
    await expect(schedule.until(null))
      .rejects.toThrow('predicate must be a function')
  })

  it('rejects for an invalid interval', async () => {
    await expect(schedule.until(() => true, { interval: -1 }))
      .rejects.toThrow('options must be a valid options object')
    await expect(schedule.until(() => true, { interval: 1.5 }))
      .rejects.toThrow('options must be a valid options object')
  })

  it('rejects for invalid options', async () => {
    await expect(schedule.until(() => true, { signal: {} }))
      .rejects.toThrow('options must be a valid options object')
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

  it('throws for an invalid callback', () => {
    expect(() => schedule.repeat(null, 100))
      .toThrow('callback must be a function')
  })

  it('throws for an invalid duration', () => {
    expect(() => schedule.repeat(() => {}, -1))
      .toThrow('duration must be a non negative integer')
    expect(() => schedule.repeat(() => {}, 1.5))
      .toThrow('duration must be a non negative integer')
  })

  it('throws for invalid options', () => {
    expect(() => schedule.repeat(() => {}, 100, { signal: {} }))
      .toThrow('options must be a valid options object')
  })

  it('resolves its promise cleanly when aborted via the handle', async () => {
    const handle = schedule.repeat(vi.fn(), 100)

    handle.abort()
    await vi.advanceTimersByTimeAsync(0)
    await expect(handle.promise).resolves.toBeUndefined()
  })

  it('stops when an external signal aborts', async () => {
    const external = new AbortController()
    const callback = vi.fn()
    const handle = schedule.repeat(callback, 100, { signal: external.signal })

    external.abort()
    await vi.advanceTimersByTimeAsync(100)

    await expect(handle.promise).resolves.toBeUndefined()
    expect(callback).not.toHaveBeenCalled()
  })

  it('rejects the promise if the callback throws', async () => {
    const callback = vi.fn(() => { throw new Error('boom') })
    const handle = schedule.repeat(callback, 100)
    const assertion = expect(handle.promise).rejects.toThrow('boom')

    await vi.advanceTimersByTimeAsync(100)
    await assertion
  })

  it('waits again after an asynchronous callback', async () => {
    const callback = vi.fn(async () => {
      await schedule.delay(50)
    })
    const handle = schedule.repeat(callback, 100)

    await vi.advanceTimersByTimeAsync(100)
    expect(callback).toHaveBeenCalledTimes(1)

    await vi.advanceTimersByTimeAsync(149)
    expect(callback).toHaveBeenCalledTimes(1)

    await vi.advanceTimersByTimeAsync(1)
    expect(callback).toHaveBeenCalledTimes(2)

    handle.abort()
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

  it('throws for an invalid callback', () => {
    expect(() => schedule.once(null))
      .toThrow('callback must be a function')
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

  it('forwards this', () => {
    const callback = vi.fn(function () { return this.value })
    const debounced = schedule.debounce(callback, 100)
    const ctx = { value: 42, run: debounced }

    ctx.run()
    vi.advanceTimersByTime(100)

    expect(callback.mock.instances[0]).toBe(ctx)
  })

  it('cancel prevents a pending call', () => {
    const callback = vi.fn()
    const debounced = schedule.debounce(callback, 100)

    debounced()
    debounced.cancel()
    vi.advanceTimersByTime(100)

    expect(callback).not.toHaveBeenCalled()
  })

  it('throws for an invalid callback', () => {
    expect(() => schedule.debounce(null, 100))
      .toThrow('callback must be a function')
  })

  it('throws for an invalid duration', () => {
    expect(() => schedule.debounce(() => {}, -1))
      .toThrow('duration must be a non negative integer')
    expect(() => schedule.debounce(() => {}, 1.5))
      .toThrow('duration must be a non negative integer')
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

  it('forwards arguments and this', () => {
    const callback = vi.fn(function (value) {
      return this.base + value
    })
    const throttled = schedule.throttle(callback, 100)
    const ctx = { base: 10, run: throttled }

    expect(ctx.run(2)).toBe(12)
    expect(callback).toHaveBeenCalledWith(2)
    expect(callback.mock.instances[0]).toBe(ctx)
  })

  it('throws for an invalid callback', () => {
    expect(() => schedule.throttle(null, 100))
      .toThrow('callback must be a function')
  })

  it('throws for an invalid duration', () => {
    expect(() => schedule.throttle(() => {}, -1))
      .toThrow('duration must be a non negative integer')
    expect(() => schedule.throttle(() => {}, 1.5))
      .toThrow('duration must be a non negative integer')
  })
})
