import { setup } from '../src/setup.js'
import { getLocales } from '../src/runtime/locales.js'
import { EventBus } from '../src/runtime/event-bus.js'
import { getGlobalEventBus } from '../src/runtime/global-event-bus.js'
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
  it('configures the global event bus', () => {
    const bus = new EventBus()
    setup({ bus })
    expect(getGlobalEventBus()).toBe(bus)
  })
  it('accepts logger, locales and bus together', () => {
    const locales = { default: 'fr', fallback: 'en' }
    const bus = new EventBus()
    const implementation = { debug: vi.fn() }
    setup({ locales, bus, logger: () => implementation })
    expect(getLocales().getCurrent()).toBe('fr')
    expect([...getLocales().list()]).toEqual(['fr', 'en'])
    expect(getGlobalEventBus()).toBe(bus)
    getLogger('test').debug('ready')
    expect(implementation.debug).toHaveBeenCalledWith('ready')
  })
  it('accepts absent optional services', () => {
    expect(() => setup({ logger: undefined, locales: undefined, bus: undefined })).not.toThrow()
  })
  it('rejects null services', () => {
    expect(() => setup({ logger: null })).toThrow('invalid setup options')
    expect(() => setup({ locales: null })).toThrow('invalid setup options')
    expect(() => setup({ bus: null })).toThrow('invalid setup options')
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
  it('rejects an invalid event bus', () => {
    for (const bus of [42, 'event', {}, [], () => {}]) {
      expect(() => setup({ bus })).toThrow('invalid setup options')
    }
  })
  it('validates options before configuring services', () => {
    const bus = new EventBus()
    setup({ locales: { default: 'fr' }, bus })
    const locales = getLocales()
    expect(() => setup({
      locales: { default: 'de' },
      bus: new EventBus(),
      logger: 42
    })).toThrow('invalid setup options')
    expect(getLocales()).toBe(locales)
    expect(getGlobalEventBus()).toBe(bus)
  })
  it('preserves existing services when options are omitted', () => {
    const bus = new EventBus()
    const implementation = { info: vi.fn() }
    setup({
      locales: { default: 'fr' },
      bus,
      logger: () => implementation
    })
    const locales = getLocales()
    setup({})
    expect(getLocales()).toBe(locales)
    expect(getGlobalEventBus()).toBe(bus)
    getLogger('test').info('hello')
    expect(implementation.info).toHaveBeenCalledWith('hello')
  })
})
