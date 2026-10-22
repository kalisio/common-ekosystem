const fallback = () => console
let factory = fallback
const cache = new Map()

export function setLogger (value = fallback) {
  const next = value ?? fallback

  if (typeof next !== 'function') {
    throw new TypeError('setLogger expects a factory: (category) => logger')
  }

  factory = next
  cache.clear()
}

function resolve (category) {
  const key = category.join('\0')

  if (!cache.has(key)) {
    let implementation

    try {
      implementation = factory([...category])
    } catch {
      implementation = console
    }

    cache.set(key, implementation ?? console)
  }

  return cache.get(key)
}

export function getLogger (category = []) {
  const path = [category].flat()

  const call = (level, args) => {
    try {
      resolve(path)[level]?.(...args)
    } catch {
      // Logging must never break the runtime.
    }
  }

  return {
    debug: (...args) => call('debug', args),
    info: (...args) => call('info', args),
    warn: (...args) => call('warn', args),
    error: (...args) => call('error', args),
    getChild: (child) => getLogger([...path, ...[child].flat()])
  }
}
