import { describe, it, expect, vi, beforeEach, beforeAll, afterAll } from 'vitest'

// ─── Browser API mocks (not provided by happy-dom) ───────────────────────────

const mockBitmap = { width: 200, height: 100, close: vi.fn() }
const mockOutputBlob = new Blob(['fake-output'], { type: 'image/jpeg' })
const mockCtx = { drawImage: vi.fn() }
const mockCanvas = {
  getContext: vi.fn(() => mockCtx),
  convertToBlob: vi.fn().mockResolvedValue(mockOutputBlob)
}

global.createImageBitmap = vi.fn().mockResolvedValue(mockBitmap)
global.OffscreenCanvas = vi.fn(() => mockCanvas)

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const JPEG_BLOB = new Blob(['fake-jpeg'], { type: 'image/jpeg' })
const PNG_BLOB = new Blob(['fake-png'], { type: 'image/png' })

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('image – Browser', () => {
  let image

  beforeAll(async () => {
    vi.stubGlobal('window', globalThis)
    vi.stubGlobal('createImageBitmap', vi.fn().mockResolvedValue(mockBitmap))
    vi.stubGlobal('OffscreenCanvas', vi.fn(function () { return mockCanvas }))
    vi.resetModules()
    ;({ image } = await import('../../src/utilities'))
  })

  afterAll(() => vi.unstubAllGlobals())

  beforeEach(async () => {
    vi.clearAllMocks()
    createImageBitmap.mockResolvedValue(mockBitmap)
    mockCanvas.convertToBlob.mockResolvedValue(mockOutputBlob)
    mockCanvas.getContext.mockReturnValue(mockCtx)
  })

  // ── resolveBrowserImage() (via metadata) ────────────────────────────────────

  describe('resolveBrowserImage()', () => {
    it('accepts a Blob directly', async () => {
      await image.metadata(JPEG_BLOB)
      expect(createImageBitmap).toHaveBeenCalledWith(JPEG_BLOB)
    })

    it('fetches a URL and returns its blob', async () => {
      const fetchBlob = new Blob(['fetched'], { type: 'image/png' })
      global.fetch = vi.fn().mockResolvedValue({ blob: () => Promise.resolve(fetchBlob) })
      await image.metadata('https://example.com/img.png')
      expect(fetch).toHaveBeenCalledWith('https://example.com/img.png')
      expect(createImageBitmap).toHaveBeenCalledWith(fetchBlob)
    })

    it('throws on unsupported input', async () => {
      await expect(image.metadata(42)).rejects.toThrow('Unsupported browser image')
    })
  })

  // ── metadata() ──────────────────────────────────────────────────────────────

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

  // ── resize() ────────────────────────────────────────────────────────────────

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

  // ── toDataURL() ─────────────────────────────────────────────────────────────

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

  // ── fromSVG() ─────────────────────────────────────────────────────────────

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

    it('creates the bitmap from an SVG blob', async () => {
      await image.fromSVG(SVG)
      const [blob] = createImageBitmap.mock.calls[0]
      expect(blob.type).toBe('image/svg+xml')
    })

    it('closes the bitmap after drawing', async () => {
      await image.fromSVG(SVG)
      expect(mockBitmap.close).toHaveBeenCalled()
    })
  })
})
