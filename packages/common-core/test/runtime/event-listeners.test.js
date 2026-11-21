import { listen, waitFor } from '../../src/runtime/event-listeners.js'

function createEmitter () {
  const handlers = new Map()
  return {
    on (event, callback) {
      if (!handlers.has(event)) handlers.set(event, new Set())
      handlers.get(event).add(callback)
      return () => {
        handlers.get(event)?.delete(callback)
        if (handlers.get(event)?.size === 0) handlers.delete(event)
      }
    },
    emit (event, payload) {
      for (const callback of [...(handlers.get(event) || [])]) callback(payload)
    },
    count (event) {
      return handlers.get(event)?.size || 0
    }
  }
}

describe('event-listeners', () => {
  describe('listen', () => {
    it('subscribes handlers to their respective events', () => {
      const emitter = createEmitter()
      const connected = vi.fn()
      const disconnected = vi.fn()
      listen(emitter, { connected, disconnected })
      emitter.emit('connected', { id: 1 })
      emitter.emit('disconnected', { id: 2 })
      expect(connected).toHaveBeenCalledExactlyOnceWith({ id: 1 })
      expect(disconnected).toHaveBeenCalledExactlyOnceWith({ id: 2 })
    })
    it('supports symbol event names', () => {
      const emitter = createEmitter()
      const event = Symbol('ready')
      const handler = vi.fn()
      const stop = listen(emitter, { [event]: handler })
      emitter.emit(event, 42)
      expect(handler).toHaveBeenCalledExactlyOnceWith(42)
      stop()
      expect(emitter.count(event)).toBe(0)
    })
    it('returns a function removing all subscriptions', () => {
      const emitter = createEmitter()
      const first = vi.fn()
      const second = vi.fn()
      const stop = listen(emitter, { first, second })
      expect(emitter.count('first')).toBe(1)
      expect(emitter.count('second')).toBe(1)
      stop()
      expect(emitter.count('first')).toBe(0)
      expect(emitter.count('second')).toBe(0)
      emitter.emit('first')
      emitter.emit('second')
      expect(first).not.toHaveBeenCalled()
      expect(second).not.toHaveBeenCalled()
    })
    it('allows stopping multiple times', () => {
      const unsubscribe = vi.fn()
      const emitter = { on: () => unsubscribe }
      const stop = listen(emitter, { ready: vi.fn() })
      stop()
      stop()
      expect(unsubscribe).toHaveBeenCalledTimes(1)
    })
    it('supports an empty handlers object', () => {
      const emitter = { on: vi.fn() }
      const stop = listen(emitter, {})
      expect(emitter.on).not.toHaveBeenCalled()
      expect(stop).toBeTypeOf('function')
      expect(() => stop()).not.toThrow()
    })
    it('does not subscribe when the signal is already aborted', () => {
      const controller = new AbortController()
      controller.abort()
      const emitter = { on: vi.fn() }
      const stop = listen(emitter, { ready: vi.fn() }, { signal: controller.signal })
      expect(emitter.on).not.toHaveBeenCalled()
      expect(() => stop()).not.toThrow()
    })
    it('removes subscriptions when the signal aborts', () => {
      const emitter = createEmitter()
      const controller = new AbortController()
      const handler = vi.fn()
      listen(emitter, { ready: handler }, { signal: controller.signal })
      expect(emitter.count('ready')).toBe(1)
      controller.abort()
      expect(emitter.count('ready')).toBe(0)
      emitter.emit('ready')
      expect(handler).not.toHaveBeenCalled()
    })
    it('does not unsubscribe twice when stopped before aborting', () => {
      const controller = new AbortController()
      const unsubscribe = vi.fn()
      const emitter = { on: () => unsubscribe }
      const stop = listen(emitter, { ready: vi.fn() }, { signal: controller.signal })
      stop()
      controller.abort()
      expect(unsubscribe).toHaveBeenCalledTimes(1)
    })
    it('rolls back previous subscriptions when registration fails', () => {
      const unsubscribe = vi.fn()
      const error = new Error('Subscription failed')
      const emitter = {
        on (event) {
          if (event === 'second') throw error
          return unsubscribe
        }
      }
      expect(() => listen(emitter, { first: vi.fn(), second: vi.fn() })).toThrow(error)
      expect(unsubscribe).toHaveBeenCalledTimes(1)
    })
    it('handles a signal aborted synchronously during subscription', () => {
      const controller = new AbortController()
      const unsubscribe = vi.fn()
      const emitter = {
        on () {
          controller.abort()
          return unsubscribe
        }
      }
      const stop = listen(emitter, { ready: vi.fn() }, { signal: controller.signal })
      expect(unsubscribe).toHaveBeenCalledTimes(1)
      stop()
      expect(unsubscribe).toHaveBeenCalledTimes(1)
    })
  })

  describe('waitFor', () => {
    it('resolves with the next event payload', async () => {
      const emitter = createEmitter()
      const payload = { id: 1 }
      const pending = waitFor(emitter, 'ready')
      emitter.emit('ready', payload)
      await expect(pending).resolves.toBe(payload)
      expect(emitter.count('ready')).toBe(0)
    })
    it('supports symbol event names', async () => {
      const emitter = createEmitter()
      const event = Symbol('ready')
      const pending = waitFor(emitter, event)
      emitter.emit(event, 42)
      await expect(pending).resolves.toBe(42)
      expect(emitter.count(event)).toBe(0)
    })
    it('ignores events rejected by the filter', async () => {
      const emitter = createEmitter()
      const filter = vi.fn((payload) => payload.ready)
      const pending = waitFor(emitter, 'status', { filter })
      emitter.emit('status', { ready: false })
      expect(emitter.count('status')).toBe(1)
      emitter.emit('status', { ready: true })
      await expect(pending).resolves.toEqual({ ready: true })
      expect(filter).toHaveBeenCalledTimes(2)
      expect(emitter.count('status')).toBe(0)
    })
    it('rejects when the filter throws', async () => {
      const emitter = createEmitter()
      const error = new Error('Filter failed')
      const pending = waitFor(emitter, 'ready', {
        filter: () => { throw error }
      })
      emitter.emit('ready', 42)
      await expect(pending).rejects.toBe(error)
      expect(emitter.count('ready')).toBe(0)
    })
    it('rejects immediately when the signal is already aborted', async () => {
      const controller = new AbortController()
      const reason = new Error('Cancelled')
      controller.abort(reason)
      const emitter = { on: vi.fn() }
      await expect(waitFor(emitter, 'ready', { signal: controller.signal })).rejects.toBe(reason)
      expect(emitter.on).not.toHaveBeenCalled()
    })
    it('rejects with the abort reason and removes the subscription', async () => {
      const emitter = createEmitter()
      const controller = new AbortController()
      const reason = new Error('Cancelled')
      const pending = waitFor(emitter, 'ready', { signal: controller.signal })
      expect(emitter.count('ready')).toBe(1)
      controller.abort(reason)
      await expect(pending).rejects.toBe(reason)
      expect(emitter.count('ready')).toBe(0)
    })
    it('removes the abort listener after resolution', async () => {
      const emitter = createEmitter()
      const controller = new AbortController()
      const remove = vi.spyOn(controller.signal, 'removeEventListener')
      const pending = waitFor(emitter, 'ready', { signal: controller.signal })
      emitter.emit('ready', 42)
      await expect(pending).resolves.toBe(42)
      expect(remove).toHaveBeenCalledWith('abort', expect.any(Function))
      controller.abort()
      expect(emitter.count('ready')).toBe(0)
    })
    it('resolves only once when the event is emitted multiple times', async () => {
      const emitter = createEmitter()
      const unsubscribe = vi.fn()
      const originalOn = emitter.on
      emitter.on = (event, callback) => {
        const stop = originalOn(event, callback)
        return () => {
          unsubscribe()
          stop()
        }
      }
      const pending = waitFor(emitter, 'ready')
      emitter.emit('ready', 1)
      emitter.emit('ready', 2)
      await expect(pending).resolves.toBe(1)
      expect(unsubscribe).toHaveBeenCalledTimes(1)
    })
    it('handles an event emitted synchronously during subscription', async () => {
      const unsubscribe = vi.fn()
      const emitter = {
        on (event, handler) {
          handler(42)
          return unsubscribe
        }
      }
      await expect(waitFor(emitter, 'ready')).resolves.toBe(42)
      expect(unsubscribe).toHaveBeenCalledTimes(1)
    })
    it('handles a filter error during synchronous subscription', async () => {
      const unsubscribe = vi.fn()
      const error = new Error('Filter failed')
      const emitter = {
        on (event, handler) {
          handler(42)
          return unsubscribe
        }
      }
      await expect(waitFor(emitter, 'ready', {
        filter: () => { throw error }
      })).rejects.toBe(error)
      expect(unsubscribe).toHaveBeenCalledTimes(1)
    })
    it('handles a signal aborted synchronously during subscription', async () => {
      const controller = new AbortController()
      const reason = new Error('Cancelled')
      const unsubscribe = vi.fn()
      const emitter = {
        on () {
          controller.abort(reason)
          return unsubscribe
        }
      }
      await expect(waitFor(emitter, 'ready', { signal: controller.signal })).rejects.toBe(reason)
      expect(unsubscribe).toHaveBeenCalledTimes(1)
    })
    it('preserves resolution when cleanup throws', async () => {
      const emitter = {
        on (event, callback) {
          this.callback = callback
          return () => { throw new Error('Cleanup failed') }
        }
      }
      const pending = waitFor(emitter, 'ready')
      expect(() => emitter.callback(42)).not.toThrow()
      await expect(pending).resolves.toBe(42)
    })
    it('preserves rejection when cleanup throws', async () => {
      const controller = new AbortController()
      const reason = new Error('Cancelled')
      const emitter = {
        on () {
          return () => { throw new Error('Cleanup failed') }
        }
      }
      const pending = waitFor(emitter, 'ready', { signal: controller.signal })
      controller.abort(reason)
      await expect(pending).rejects.toBe(reason)
    })
    it('rejects when registration fails', async () => {
      const error = new Error('Subscription failed')
      const emitter = {
        on () { throw error }
      }
      await expect(waitFor(emitter, 'ready')).rejects.toBe(error)
    })
    it('supports AbortSignal.timeout', async () => {
      const emitter = createEmitter()
      const pending = waitFor(emitter, 'ready', {
        signal: AbortSignal.timeout(20)
      })
      await expect(pending).rejects.toMatchObject({ name: 'TimeoutError' })
      expect(emitter.count('ready')).toBe(0)
    })
  })
})
