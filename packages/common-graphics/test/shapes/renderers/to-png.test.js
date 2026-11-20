vi.mock('#utilities', () => ({
  image: {
    fromSVG: vi.fn(),
    toDataURL: vi.fn()
  }
}))

const { toPNG } = await import('../../../src/shapes/renderers')
const { image } = await import('#utilities')

describe('toPNG', () => {
  const makeContext = () => ({ pngCache: new Map(), svgCache: new Map() })
  const makeParams = (params) => ({ width: 32, height: 32, shape: '<circle cx="50" cy="50" r="40"/>', ...params })

  beforeEach(() => {
    vi.clearAllMocks()
    image.fromSVG.mockResolvedValue(Buffer.from('fake-png'))
    image.toDataURL.mockResolvedValue('data:image/png;base64,abc123')
  })

  it('converts SVG to a PNG data URL', async () => {
    const result = await toPNG(makeParams(), makeContext())
    expect(image.fromSVG).toHaveBeenCalledOnce()
    expect(image.fromSVG).toHaveBeenCalledWith(expect.stringContaining('width="32" height="32"'))
    expect(image.toDataURL).toHaveBeenCalledWith(Buffer.from('fake-png'))
    expect(result).toBe('data:image/png;base64,abc123')
  })
  it('returns cached PNG without recomputing', async () => {
    const context = {
      pngCache: new Map([['my-key', 'data:image/png;base64,cached']]),
      svgCache: new Map()
    }
    const result = await toPNG(makeParams({ key: 'my-key' }), context)
    expect(image.fromSVG).not.toHaveBeenCalled()
    expect(result).toBe('data:image/png;base64,cached')
  })
  it('stores the result in cache when a key is provided', async () => {
    const context = makeContext()
    await toPNG(makeParams({ key: 'my-key' }), context)
    expect(context.pngCache.get('my-key')).toBe('data:image/png;base64,abc123')
  })
  it('also caches the SVG under the same key', async () => {
    const context = makeContext()
    await toPNG(makeParams({ key: 'my-key' }), context)
    expect(context.svgCache.get('my-key')).toMatch(/^<svg /)
  })
  it('does not store in cache when no key is provided', async () => {
    const context = makeContext()
    await toPNG(makeParams(), context)
    expect(context.pngCache.size).toBe(0)
    expect(context.svgCache.size).toBe(0)
  })
  it('throws when dimensions are missing', async () => {
    await expect(toPNG({}, makeContext())).rejects.toThrow('width must be a positive number')
    expect(image.fromSVG).not.toHaveBeenCalled()
  })
})
