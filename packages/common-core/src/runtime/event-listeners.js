// Subscribes each handler to its event and returns a stop function removing
// them all. Keys can be strings or symbols. Aborting the signal stops them too.
// If a subscription fails, the ones already made are removed before rethrowing.
export function listen (emitter, handlers, { signal } = {}) {
  if (signal?.aborted) return () => {}
  const unsubscribes = []
  function stop () {
    signal?.removeEventListener('abort', stop)
    for (const unsubscribe of unsubscribes.splice(0)) unsubscribe()
  }
  try {
    for (const event of Reflect.ownKeys(handlers)) {
      unsubscribes.push(emitter.on(event, handlers[event]))
    }
    signal?.addEventListener('abort', stop, { once: true })
    // A subscription may have aborted the signal synchronously.
    if (signal?.aborted) stop()
  } catch (error) {
    stop()
    throw error
  }
  return stop
}

// Resolves with the payload of the next emission of the event that passes the
// filter, which must be synchronous. Rejects with the signal reason if it
// aborts first, or with the error thrown by the filter.
export function waitFor (emitter, event, { filter, signal } = {}) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(signal.reason)
    let unsubscribe = null
    let settled = false
    function settle (callback, value) {
      if (settled) return
      settled = true
      signal?.removeEventListener('abort', onAbort)
      try {
        unsubscribe?.()
      } catch {
        // Cleanup errors must not override the settlement.
      }
      callback(value)
    }
    function onAbort () {
      settle(reject, signal.reason)
    }
    unsubscribe = emitter.on(event, (payload) => {
      if (settled) return
      try {
        if (filter && !filter(payload)) return
      } catch (error) {
        return settle(reject, error)
      }
      settle(resolve, payload)
    })
    // The emitter may have called the callback during on(), before unsubscribe was set.
    if (settled) {
      unsubscribe()
    } else {
      signal?.addEventListener('abort', onAbort, { once: true })
      // The emitter may have aborted the signal during on().
      if (signal?.aborted) onAbort()
    }
  })
}
