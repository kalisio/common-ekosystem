import { describe, it, expect, vi, beforeEach, beforeAll, afterAll } from 'vitest'

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const JPEG_BLOB = new Blob(['fake-jpeg'], { type: 'image/jpeg' })
const PNG_BLOB = new Blob(['fake-png'], { type: 'image/png' })

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('image – Browser', () => {
  let image

  const mockBitmap = { width: 200, height: 100, close: vi.fn() }
  const mockOutputBlob = new Blob(['fake-output'], { type: 'image/jpeg' })
  const mockCtx = { drawImage: vi.fn() }
  const mockCanvas = {
    getContext: vi.fn(() => mockCtx),
    convertToBlob: vi.fn().mockResolvedValue(mockOutputBlob)
  }

  beforeAll(async () => {
    // Inject window/document for browser mode
    vi.stubGlobal('window', globalThis)
    vi.stubGlobal('document', {})
    // Stubs missing browser APIs
    vi.stubGlobal('createImageBitmap', vi.fn().mockResolvedValue(mockBitmap))
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
    ;({ image } = await import('../../src/utilities/index.browser'))
  })

  afterAll(() => {
    delete URL.createObjectURL
    delete URL.revokeObjectURL
    vi.unstubAllGlobals()
  })

  beforeEach(() => {
    vi.clearAllMocks()
    createImageBitmap.mockResolvedValue(mockBitmap)
    mockCanvas.convertToBlob.mockResolvedValue(mockOutputBlob)
    mockCanvas.getContext.mockReturnValue(mockCtx)
    URL.createObjectURL.mockReturnValue('blob:fake-url')
  })

  describe('resolve()', () => {
    it('accepts a Blob directly', async () => {
      expect(await image.resolve(JPEG_BLOB)).toBe(JPEG_BLOB)
    })
    it('fetches a URL and returns its blob', async () => {
      const fetchBlob = new Blob(['fetched'], { type: 'image/png' })
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ blob: () => Promise.resolve(fetchBlob) }))
      const result = await image.resolve('https://example.com/img.png')
      expect(fetch).toHaveBeenCalledWith('https://example.com/img.png')
      expect(result).toBe(fetchBlob)
    })
    it('throws when img is undefined', async () => {
      await expect(image.resolve(undefined)).rejects.toThrow('img must be defined')
    })
    it('throws on unsupported input', async () => {
      await expect(image.resolve(42)).rejects.toThrow('unsupported browser image')
    })
  })

  describe('metadata()', () => {
    it('returns width, height, size and format', async () => {
      const result = await image.metadata(JPEG_BLOB)
      expect(result).toEqual({
        width: 200,
        height: 100,
        size: JPEG_BLOB.size,
        format: 'jpeg'
      })
    })
    it('closes the bitmap after reading', async () => {
      await image.metadata(JPEG_BLOB)
      expect(mockBitmap.close).toHaveBeenCalled()
    })
    it('extracts format from blob.type', async () => {
      const result = await image.metadata(PNG_BLOB)
      expect(result.format).toBe('png')
    })
  })

  describe('resize()', () => {
    it('calls createImageBitmap with resize options', async () => {
      await image.resize(JPEG_BLOB, 320, 240)
      expect(createImageBitmap).toHaveBeenCalledWith(JPEG_BLOB, {
        resizeWidth: 320,
        resizeHeight: 240,
        resizeQuality: 'high'
      })
    })
    it('draws the bitmap onto an OffscreenCanvas', async () => {
      await image.resize(JPEG_BLOB, 320, 240)
      expect(OffscreenCanvas).toHaveBeenCalledWith(320, 240)
      expect(mockCtx.drawImage).toHaveBeenCalledWith(mockBitmap, 0, 0)
    })
    it('closes the bitmap after drawing', async () => {
      await image.resize(JPEG_BLOB, 320, 240)
      expect(mockBitmap.close).toHaveBeenCalled()
    })
    it('returns the blob from convertToBlob', async () => {
      const result = await image.resize(JPEG_BLOB, 320, 240)
      expect(result).toBe(mockOutputBlob)
    })
    it('preserves the original mime type', async () => {
      await image.resize(JPEG_BLOB, 320, 240, 0.8)
      expect(mockCanvas.convertToBlob).toHaveBeenCalledWith({
        type: 'image/jpeg',
        quality: 0.8
      })
    })
    it('throws when the 2D context is unavailable', async () => {
      mockCanvas.getContext.mockReturnValueOnce(null)
      await expect(image.resize(JPEG_BLOB, 320, 240)).rejects.toThrow('2D context not available')
    })
    it('throws when width is not a positive integer', async () => {
      await expect(image.resize(JPEG_BLOB, -1, 240)).rejects.toThrow('width')
    })
    it('throws when height is not a positive integer', async () => {
      await expect(image.resize(JPEG_BLOB, 320, 0)).rejects.toThrow('height')
    })
    it('throws when quality is out of range', async () => {
      await expect(image.resize(JPEG_BLOB, 320, 240, 2)).rejects.toThrow('quality')
    })
  })

  describe('toDataURL()', () => {
    it('returns a data URL with the correct mime type', async () => {
      const result = await image.toDataURL(JPEG_BLOB)
      expect(result.startsWith('data:image/jpeg;base64,')).toBe(true)
    })
    it('returns a valid base64 string', async () => {
      const result = await image.toDataURL(JPEG_BLOB)
      const base64Part = result.split(',')[1]
      expect(() => atob(base64Part)).not.toThrow()
    })
  })

  describe('fromSVG()', () => {
    const SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"/>'
    it('converts SVG to PNG blob by default', async () => {
      const result = await image.fromSVG(SVG)
      expect(mockCanvas.convertToBlob).toHaveBeenCalledWith({ type: 'image/png', quality: 1 })
      expect(result).toBe(mockOutputBlob)
    })
    it('converts SVG to jpeg when format is specified', async () => {
      await image.fromSVG(SVG, { format: 'jpeg', quality: 0.8 })
      expect(mockCanvas.convertToBlob).toHaveBeenCalledWith({ type: 'image/jpeg', quality: 0.8 })
    })
    it('creates a blob URL from the SVG and revokes it', async () => {
      await image.fromSVG(SVG)
      expect(URL.createObjectURL).toHaveBeenCalled()
      expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:fake-url')
    })
    it('draws onto an OffscreenCanvas with natural dimensions', async () => {
      await image.fromSVG(SVG)
      expect(OffscreenCanvas).toHaveBeenCalledWith(200, 100)
      expect(mockCtx.drawImage).toHaveBeenCalled()
    })
    it('throws on an unsupported format', async () => {
      await expect(image.fromSVG(SVG, { format: 'gif' })).rejects.toThrow()
    })
    it('throws on out-of-range quality', async () => {
      await expect(image.fromSVG(SVG, { quality: 2 })).rejects.toThrow()
    })
    it('throws when svg is undefined', async () => {
      await expect(image.fromSVG(undefined)).rejects.toThrow('svg must be defined')
    })
    it('revokes the blob URL even when rendering fails', async () => {
      mockCanvas.getContext.mockReturnValueOnce(null)
      await expect(image.fromSVG(SVG)).rejects.toThrow('2D context not available')
      expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:fake-url')
    })
  })
})
