import { setup } from '../src/setup.js'
import { getLocales } from '../src/runtime/locales.js'
import { EventBus } from '../src/runtime/event-bus.js'
import { getLogger, setLogger } from '../src/runtime/logger.js'

describe('setup', () => {
  afterEach(() => setLogger())

  it('accepts no options', () => {
    expect(() => setup()).not.toThrow()
    expect(() => setup({})).not.toThrow()
  })
  it('configures the logger', () => {
    const implementation = { info: vi.fn() }
    const factory = vi.fn(() => implementation)
    setup({ logger: factory })
    getLogger('test').info('hello')
    expect(factory).toHaveBeenCalledWith(['test'])
    expect(implementation.info).toHaveBeenCalledWith('hello')
  })
  it('updates an existing logger facade', () => {
    const logger = getLogger('test')
    const implementation = { info: vi.fn() }
    setup({ logger: () => implementation })
    logger.info('hello')
    expect(implementation.info).toHaveBeenCalledWith('hello')
  })
  it('configures the locales', () => {
    setup({ locales: { default: 'fr', fallback: 'en' } })
    expect(getLocales().getCurrent()).toBe('fr')
    expect([...getLocales().list()]).toEqual(['fr', 'en'])
  })
  it('accepts empty locales options', () => {
    setup({ locales: {} })
    expect(getLocales().getCurrent()).toBe('en')
    expect([...getLocales().list()]).toEqual(['en'])
  })
  it('configures a logger and locales with an event bus', () => {
    const bus = new EventBus()
    const listener = vi.fn()
    bus.on('locale:changed', listener)
    const implementation = { debug: vi.fn() }
    setup({ locales: { default: 'fr', fallback: 'en', bus }, logger: () => implementation })
    expect(getLocales().getCurrent()).toBe('fr')
    expect([...getLocales().list()]).toEqual(['fr', 'en'])
    getLocales().setCurrent('en')
    expect(listener).toHaveBeenCalledWith(expect.objectContaining({
      type: 'locale:changed',
      data: { locale: 'en', previous: 'fr' }
    }))
    getLogger('test').debug('ready')
    expect(implementation.debug).toHaveBeenCalledWith('ready')
  })
  it('accepts absent optional services', () => {
    expect(() => setup({ logger: undefined, locales: undefined })).not.toThrow()
  })
  it('rejects null services', () => {
    expect(() => setup({ logger: null })).toThrow('invalid setup options')
    expect(() => setup({ locales: null })).toThrow('invalid setup options')
  })
  it('rejects an invalid logger', () => {
    for (const logger of [42, 'logger', {}, []]) {
      expect(() => setup({ logger })).toThrow('invalid setup options')
    }
  })
  it('rejects invalid locales options', () => {
    for (const locales of [42, 'fr', [], () => {}]) {
      expect(() => setup({ locales })).toThrow('invalid setup options')
    }
  })
  it('rejects an invalid locale bus before configuring services', () => {
    const original = { info: vi.fn() }
    setup({ locales: {}, logger: () => original })
    const locales = getLocales()
    expect(() => setup({ locales: { bus: {} }, logger: () => ({}) }))
      .toThrow('bus must be an instance of EventBus')
    expect(getLocales()).toBe(locales)
    getLogger('test').info('hello')
    expect(original.info).toHaveBeenCalledWith('hello')
  })
  it('validates options before configuring services', () => {
    setup({ locales: { default: 'fr' } })
    const locales = getLocales()
    expect(() => setup({
      locales: { default: 'de' },
      logger: 42
    })).toThrow('invalid setup options')
    expect(getLocales()).toBe(locales)
  })
  it('preserves existing services when options are omitted', () => {
    const implementation = { info: vi.fn() }
    setup({
      locales: { default: 'fr' },
      logger: () => implementation
    })
    const locales = getLocales()
    setup({})
    expect(getLocales()).toBe(locales)
    getLogger('test').info('hello')
    expect(implementation.info).toHaveBeenCalledWith('hello')
  })
})
