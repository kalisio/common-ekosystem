import { getLogger, setLogger } from '../../src/runtime/index.js'

const LEVELS = ['debug', 'info', 'warn', 'error']

const fakeLogger = () => Object.fromEntries(LEVELS.map((level) => [level, vi.fn()]))

const silenceConsole = () => Object.fromEntries(
  LEVELS.map((level) => [level, vi.spyOn(console, level).mockImplementation(() => {})])
)

afterEach(() => {
  setLogger()
  vi.restoreAllMocks()
})

describe('default implementation', () => {
  it.each(LEVELS)('forwards %s to console with its arguments', (level) => {
    const spies = silenceConsole()
    const details = { a: 1 }
    getLogger(['runtime'])[level]('message', details)
    expect(spies[level]).toHaveBeenCalledOnce()
    expect(spies[level]).toHaveBeenCalledWith('message', details)
  })
})

describe('setLogger', () => {
  it('routes every level to the logger returned by the factory', () => {
    const implementation = fakeLogger()
    setLogger(() => implementation)
    const logger = getLogger('requester')
    for (const level of LEVELS) logger[level]('message', { level })
    for (const level of LEVELS) {
      expect(implementation[level]).toHaveBeenCalledWith('message', { level })
    }
  })
  it.each([
    ['without argument', () => setLogger()],
    ['with undefined', () => setLogger(undefined)],
    ['with null', () => setLogger(null)]
  ])('resets to console when called %s', (name, reset) => {
    const spies = silenceConsole()
    const implementation = fakeLogger()
    setLogger(() => implementation)
    reset()
    getLogger('requester').error('message')
    expect(spies.error).toHaveBeenCalledWith('message')
    expect(implementation.error).not.toHaveBeenCalled()
  })
  it.each([
    ['a logger object', console],
    ['a string', 'console'],
    ['a number', 42]
  ])('rejects %s and preserves the factory and cache', (name, value) => {
    const implementation = fakeLogger()
    const factory = vi.fn(() => implementation)
    setLogger(factory)
    const logger = getLogger('requester')
    logger.info('before')
    expect(() => setLogger(value)).toThrow(
      new TypeError('setLogger expects a factory: (category) => logger')
    )
    logger.info('after')
    expect(factory).toHaveBeenCalledOnce()
    expect(implementation.info.mock.calls).toEqual([['before'], ['after']])
  })
  it('applies to loggers created before it was called', () => {
    const logger = getLogger('requester')
    const implementation = fakeLogger()
    setLogger(() => implementation)
    logger.warn('message')
    expect(implementation.warn).toHaveBeenCalledWith('message')
  })
  it('clears the cache, so a new factory is used everywhere', () => {
    const first = fakeLogger()
    const second = fakeLogger()
    const logger = getLogger('requester')
    setLogger(() => first)
    logger.info('one')
    setLogger(() => second)
    logger.info('two')
    expect(first.info.mock.calls).toEqual([['one']])
    expect(second.info.mock.calls).toEqual([['two']])
  })
})

describe('categories', () => {
  const capture = () => {
    const factory = vi.fn(() => fakeLogger())
    setLogger(factory)
    return factory
  }
  it.each([
    ['nothing', undefined, []],
    ['a string', 'requester', ['requester']],
    ['an array', ['runtime', 'requester'], ['runtime', 'requester']]
  ])('accepts %s as category', (name, category, expected) => {
    const factory = capture()
    getLogger(category).info('message')
    expect(factory).toHaveBeenCalledWith(expected)
  })
  it('getChild extends the category with a string or an array', () => {
    const factory = capture()
    const parent = getLogger('runtime')
    parent.getChild('bus').info('message')
    parent.getChild(['requester', 'retry']).info('message')
    parent.getChild('bus').getChild('listener').info('message')
    expect(factory.mock.calls).toEqual([
      [['runtime', 'bus']],
      [['runtime', 'requester', 'retry']],
      [['runtime', 'bus', 'listener']]
    ])
  })
  it('getChild does not alter the parent category', () => {
    const factory = capture()
    const parent = getLogger('runtime')
    parent.getChild('bus')
    parent.info('message')
    expect(factory).toHaveBeenCalledWith(['runtime'])
  })
  it('gives the factory a copy of the category', () => {
    const seen = []
    setLogger((category) => {
      seen.push([...category])
      category.push('mutated')
      return fakeLogger()
    })
    const logger = getLogger('runtime')
    logger.info('message')
    logger.getChild('bus').info('message')
    expect(seen).toEqual([['runtime'], ['runtime', 'bus']])
  })
})

describe('cache', () => {
  it('calls the factory once per category', () => {
    const factory = vi.fn(() => fakeLogger())
    setLogger(factory)
    const logger = getLogger('requester')
    logger.debug('one')
    logger.error('two')
    getLogger(['requester']).info('three')
    expect(factory).toHaveBeenCalledOnce()
  })
  it('calls the factory separately for each category', () => {
    const factory = vi.fn(() => fakeLogger())
    setLogger(factory)
    getLogger('bus').info('message')
    getLogger('requester').info('message')
    getLogger(['runtime', 'bus']).info('message')
    expect(factory).toHaveBeenCalledTimes(3)
  })
  it('does not call the factory until something is logged', () => {
    const factory = vi.fn(() => fakeLogger())
    setLogger(factory)
    getLogger('requester').getChild('retry')
    expect(factory).not.toHaveBeenCalled()
  })
})

describe('robustness', () => {
  it('ignores the methods a partial logger does not provide', () => {
    const implementation = { error: vi.fn() }
    setLogger(() => implementation)
    const logger = getLogger('requester')
    expect(() => logger.debug('message')).not.toThrow()
    logger.error('message')
    expect(implementation.error).toHaveBeenCalledWith('message')
  })
  it('calls the methods on the logger, preserving this', () => {
    const implementation = {
      lines: [],
      info (message) { this.lines.push(message) }
    }
    setLogger(() => implementation)
    getLogger('requester').info('message')
    expect(implementation.lines).toEqual(['message'])
  })
  it('never throws when the logger throws', () => {
    setLogger(() => ({ error () { throw new Error('broken transport') } }))
    expect(() => getLogger('requester').error('message')).not.toThrow()
  })
  it('falls back to console when the factory throws, and caches it', () => {
    const spies = silenceConsole()
    const factory = vi.fn(() => { throw new Error('broken factory') })
    setLogger(factory)
    const logger = getLogger('requester')
    expect(() => logger.error('one')).not.toThrow()
    logger.error('two')
    expect(spies.error.mock.calls).toEqual([['one'], ['two']])
    expect(factory).toHaveBeenCalledOnce()
  })
  it.each([null, undefined])('falls back to console when the factory returns %s', (value) => {
    const spies = silenceConsole()
    setLogger(() => value)
    getLogger('requester').warn('message')
    expect(spies.warn).toHaveBeenCalledWith('message')
  })
})
