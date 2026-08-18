import { describe, it, expect, vi, beforeEach } from 'vitest'

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

  beforeEach(() => {
    vi.clearAllMocks()
    image.fromSVG.mockResolvedValue(Buffer.from('fake-png'))
    image.toDataURL.mockResolvedValue('data:image/png;base64,abc123')
  })

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
