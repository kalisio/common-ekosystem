import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest'

const mockOutputBlob = new Blob(['fake-output'], { type: 'image/png' })
const mockCtx = { drawImage: vi.fn() }
const mockCanvas = {
  getContext: vi.fn(() => mockCtx),
  convertToBlob: vi.fn().mockResolvedValue(mockOutputBlob)
}

describe('toPNG – Browser', () => {
  let toPNG

  beforeAll(async () => {
    // Inject window/document for browser mode
    vi.stubGlobal('window', globalThis)
    vi.stubGlobal('document', {})
    // Stubs missing browser APIs
    vi.stubGlobal('OffscreenCanvas', vi.fn(function () { return mockCanvas }))
    vi.stubGlobal('Image', vi.fn(function () {
      const img = this
      img.naturalWidth = 200
      img.naturalHeight = 100
      Object.defineProperty(img, 'src', {
        get () { return img._src },
        set (value) { img._src = value; setTimeout(() => img.onload?.(), 0) }
      })
    }))
    // Patch URL
    URL.createObjectURL = vi.fn(() => 'blob:fake-url')
    URL.revokeObjectURL = vi.fn()
    // Reset modules after stubs
    vi.resetModules()
    ;({ toPNG } = await import('../../../src/shapes/renderers'))
  })

  afterAll(() => {
    delete URL.createObjectURL
    delete URL.revokeObjectURL
    vi.unstubAllGlobals()
  })

  beforeEach(() => {
    vi.clearAllMocks()
    mockCanvas.convertToBlob.mockResolvedValue(mockOutputBlob)
    mockCanvas.getContext.mockReturnValue(mockCtx)
    URL.createObjectURL.mockReturnValue('blob:fake-url')
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
    expect(URL.createObjectURL).not.toHaveBeenCalled()
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
