import { describe, it, expect, vi, beforeAll, beforeEach, afterEach, afterAll } from 'vitest'

describe('toPNG – Node', () => {
  let toPNG, image

  beforeAll(async () => {
    vi.stubGlobal('window', undefined)
    vi.resetModules()
    ;({ toPNG } = await import('../../../src/shapes/renderers'))
    ;({ image } = await import('../../../src/utilities'))
  })

  afterAll(() => vi.unstubAllGlobals())

  beforeEach(() => {
    vi.spyOn(image, 'fromSVG').mockResolvedValue(Buffer.from('fake-png'))
    vi.spyOn(image, 'toDataURL').mockResolvedValue('data:image/png;base64,abc123')
  })

  afterEach(() => vi.restoreAllMocks())

  const makeContext = () => ({ pngCache: new Map(), svgCache: new Map() })

  it('converts SVG to a PNG data URL', async () => {
    const result = await toPNG({}, makeContext())
    expect(image.fromSVG).toHaveBeenCalledOnce()
    expect(image.toDataURL).toHaveBeenCalledWith(Buffer.from('fake-png'))
    expect(result).toBe('data:image/png;base64,abc123')
  })

  it('returns cached PNG without recomputing', async () => {
    const context = {
      pngCache: new Map([['my-key', 'data:image/png;base64,cached']]),
      svgCache: new Map()
    }
    const result = await toPNG({ key: 'my-key' }, context)
    expect(image.fromSVG).not.toHaveBeenCalled()
    expect(result).toBe('data:image/png;base64,cached')
  })

  it('stores the result in cache when a key is provided', async () => {
    const context = makeContext()
    await toPNG({ key: 'my-key' }, context)
    expect(context.pngCache.get('my-key')).toBe('data:image/png;base64,abc123')
  })

  it('does not store in cache when no key is provided', async () => {
    const context = makeContext()
    await toPNG({}, context)
    expect(context.pngCache.size).toBe(0)
  })
})
