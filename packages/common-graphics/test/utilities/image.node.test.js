import { describe, it, expect, vi, beforeAll, beforeEach, afterAll } from 'vitest'

// ─── Sharp mock ───────────────────────────────────────────────────────────────

const mockBuffer = Buffer.from('fake-output')
const mockSharpInstance = {
  metadata: vi.fn(),
  resize: vi.fn().mockReturnThis(),
  toFormat: vi.fn().mockReturnThis(),
  toBuffer: vi.fn().mockResolvedValue(mockBuffer)
}
const mockSharp = vi.fn(() => mockSharpInstance)

vi.mock('sharp', () => ({ default: mockSharp }))
vi.mock('node:fs/promises', () => ({
  readFile: vi.fn().mockResolvedValue(Buffer.from('file-bytes'))
}))

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const JPEG_META = { width: 200, height: 100, format: 'jpeg', size: 5000, channels: 3 }
const INPUT_BUF = Buffer.from('fake-jpeg-input')
const JPEG_DATA_URL = `data:image/jpeg;base64,${INPUT_BUF.toString('base64')}`

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('image – Node', () => {
  let image
  let readFile

  beforeAll(async () => {
    vi.stubGlobal('window', undefined)
    vi.resetModules()
    ;({ image } = await import('../../src/utilities/index.node'))
    ;({ readFile } = await import('node:fs/promises'))
  })

  afterAll(() => {
    vi.unstubAllGlobals()
  })

  beforeEach(() => {
    vi.clearAllMocks()
    mockSharpInstance.metadata.mockResolvedValue(JPEG_META)
    mockSharpInstance.resize.mockReturnThis()
    mockSharpInstance.toFormat.mockReturnThis()
    mockSharpInstance.toBuffer.mockResolvedValue(mockBuffer)
  })

  describe('resolveNodeImage()', () => {
    it('passes a Buffer through unchanged', async () => {
      await image.metadata(INPUT_BUF)
      expect(mockSharp).toHaveBeenCalledWith(INPUT_BUF)
    })
    it('reads a file path with fs.readFile', async () => {
      await image.metadata('/tmp/img.png')
      expect(readFile).toHaveBeenCalledWith('/tmp/img.png')
    })
    it('decodes a base64 data URL to a Buffer', async () => {
      await image.metadata(JPEG_DATA_URL)
      const [received] = mockSharp.mock.calls[0]
      expect(received.toString('base64')).toBe(INPUT_BUF.toString('base64'))
    })
    it('throws on an unsupported type', async () => {
      await expect(image.metadata({ not: 'supported' })).rejects.toThrow('unsupported node image')
    })
  })

  describe('metadata()', () => {
    it('returns sharp metadata from a Buffer', async () => {
      const result = await image.metadata(INPUT_BUF)
      expect(result).toMatchObject(JPEG_META)
    })
    it('falls back to buffer.byteLength when size is absent', async () => {
      const { size, ...metaWithoutSize } = JPEG_META
      mockSharpInstance.metadata.mockResolvedValueOnce(metaWithoutSize)
      const result = await image.metadata(INPUT_BUF)
      expect(result.size).toBe(INPUT_BUF.byteLength)
    })
    it('reads from a file path', async () => {
      await image.metadata('/tmp/photo.jpg')
      expect(readFile).toHaveBeenCalledWith('/tmp/photo.jpg')
    })
    it('decodes a data URL', async () => {
      await image.metadata(JPEG_DATA_URL)
      // sharp should receive the decoded bytes, not the data URL string
      const [buf] = mockSharp.mock.calls[0]
      expect(Buffer.isBuffer(buf)).toBe(true)
      expect(buf.toString()).toBe(INPUT_BUF.toString())
    })
    it('throws on unsupported input type', async () => {
      await expect(image.metadata(42)).rejects.toThrow('unsupported node image')
    })
  })

  describe('resize()', () => {
    it('calls sharp resize with correct dimensions', async () => {
      await image.resize(INPUT_BUF, 320, 240)
      expect(mockSharpInstance.resize).toHaveBeenCalledWith(320, 240)
    })
    it('returns the output buffer', async () => {
      const result = await image.resize(INPUT_BUF, 320, 240)
      expect(result).toBe(mockBuffer)
    })
    it('passes quality options to toFormat for jpeg', async () => {
      await image.resize(INPUT_BUF, 320, 240, 0.8)
      expect(mockSharpInstance.toFormat).toHaveBeenCalledWith('jpeg', { quality: 80 })
    })
    it('passes compressionLevel to toFormat for png', async () => {
      mockSharpInstance.metadata.mockResolvedValue({ ...JPEG_META, format: 'png' })
      await image.resize(INPUT_BUF, 320, 240, 0.8)
      expect(mockSharpInstance.toFormat).toHaveBeenCalledWith('png', {
        compressionLevel: expect.any(Number)
      })
    })
    it('enables palette for png when quality < 0.5', async () => {
      mockSharpInstance.metadata.mockResolvedValue({ ...JPEG_META, format: 'png' })
      await image.resize(INPUT_BUF, 320, 240, 0.4)
      expect(mockSharpInstance.toFormat).toHaveBeenCalledWith('png', {
        compressionLevel: expect.any(Number),
        palette: true
      })
    })
    it('throws when width is not a positive integer', async () => {
      await expect(image.resize(INPUT_BUF, -1, 240)).rejects.toThrow('width')
    })
    it('throws when height is not a positive integer', async () => {
      await expect(image.resize(INPUT_BUF, 320, 0)).rejects.toThrow('height')
    })
    it('throws when quality is out of range', async () => {
      await expect(image.resize(INPUT_BUF, 320, 240, 1.5)).rejects.toThrow('quality')
    })
  })

  describe('toDataURL()', () => {
    it('returns a correctly-prefixed data URL', async () => {
      const result = await image.toDataURL(INPUT_BUF)
      expect(result).toBe(`data:image/jpeg;base64,${INPUT_BUF.toString('base64')}`)
    })
    it('detects format via sharp', async () => {
      mockSharpInstance.metadata.mockResolvedValueOnce({ format: 'png' })
      const result = await image.toDataURL(INPUT_BUF)
      expect(result.startsWith('data:image/png;base64,')).toBe(true)
    })
  })

  describe('fromSVG()', () => {
    const SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"/>'
    it('converts SVG to PNG buffer by default', async () => {
      const result = await image.fromSVG(SVG)
      expect(mockSharpInstance.toFormat).toHaveBeenCalledWith('png', expect.any(Object))
      expect(result).toBe(mockBuffer)
    })
    it('converts SVG to jpeg when format is specified', async () => {
      await image.fromSVG(SVG, { format: 'jpeg', quality: 0.8 })
      expect(mockSharpInstance.toFormat).toHaveBeenCalledWith('jpeg', { quality: 80 })
    })
    it('converts SVG to webp when format is specified', async () => {
      await image.fromSVG(SVG, { format: 'webp', quality: 0.9 })
      expect(mockSharpInstance.toFormat).toHaveBeenCalledWith('webp', { quality: 90 })
    })
    it('passes the SVG as a Buffer to sharp', async () => {
      await image.fromSVG(SVG)
      const [buf] = mockSharp.mock.calls[0]
      expect(Buffer.isBuffer(buf)).toBe(true)
      expect(buf.toString()).toBe(SVG)
    })
  })
})
