import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest'

const mockBitmap = { width: 200, height: 100, close: vi.fn() }
const mockOutputBlob = new Blob(['fake-output'], { type: 'image/png' })
const mockCtx = { drawImage: vi.fn() }
const mockCanvas = {
  getContext: vi.fn(() => mockCtx),
  convertToBlob: vi.fn().mockResolvedValue(mockOutputBlob)
}

describe('toPNG – Browser', () => {
  let toPNG

  beforeAll(async () => {
    vi.stubGlobal('window', globalThis)
    vi.stubGlobal('createImageBitmap', vi.fn().mockResolvedValue(mockBitmap))
    vi.stubGlobal('OffscreenCanvas', vi.fn(function () { return mockCanvas }))
    vi.resetModules()
    ;({ toPNG } = await import('../../../src/shapes/renderers'))
  })

  afterAll(() => vi.unstubAllGlobals())

  beforeEach(() => {
    vi.clearAllMocks()
    createImageBitmap.mockResolvedValue(mockBitmap)
    mockCanvas.convertToBlob.mockResolvedValue(mockOutputBlob)
    mockCanvas.getContext.mockReturnValue(mockCtx)
  })

  const makeContext = () => ({ pngCache: new Map(), svgCache: new Map() })

  it('converts SVG to a PNG data URL', async () => {
    const result = await toPNG({}, makeContext())
    expect(result).toMatch(/^data:image\/png;base64,/)
  })

  it('returns cached PNG without recomputing', async () => {
    const context = {
      pngCache: new Map([['my-key', 'data:image/png;base64,cached']]),
      svgCache: new Map()
    }
    const result = await toPNG({ key: 'my-key' }, context)
    expect(createImageBitmap).not.toHaveBeenCalled()
    expect(result).toBe('data:image/png;base64,cached')
  })

  it('stores the result in cache when a key is provided', async () => {
    const context = makeContext()
    await toPNG({ key: 'my-key' }, context)
    expect(context.pngCache.get('my-key')).toMatch(/^data:image\/png;base64,/)
  })

  it('does not store in cache when no key is provided', async () => {
    const context = makeContext()
    await toPNG({}, context)
    expect(context.pngCache.size).toBe(0)
  })
})
