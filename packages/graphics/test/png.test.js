import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createCanvas, Image } from '@napi-rs/canvas'
import { Cache } from '../src/utils/cache'
import { toPNG } from '../src/utils/png'

const __dirname = dirname(fileURLToPath(import.meta.url))
const pngDir = join(__dirname, 'data', 'reference', 'png')

// Setup Canvas API for Node
global.document = {
  createElement: (tag) => {
    if (tag === 'canvas') {
      return createCanvas(100, 100)
    }
  }
}

// Mock Image class that properly loads SVG content
class MockImage extends Image {
  constructor () {
    super()
    this._src = ''
    this._loadedSvg = false
  }

  set src (value) {
    this._src = value

    // Decode base64 SVG data URL
    if (value.startsWith('data:image/svg+xml;base64,')) {
      try {
        const base64 = value.replace('data:image/svg+xml;base64,', '')
        const svgContent = Buffer.from(base64, 'base64').toString('utf-8')

        // Load SVG into the native Image
        super.src = Buffer.from(svgContent)
        this._loadedSvg = true

        // Trigger onload after image is ready
        setImmediate(() => {
          if (this.onload) {
            this.onload()
          }
        })
      } catch (err) {
        setImmediate(() => {
          if (this.onerror) {
            this.onerror(err)
          }
        })
      }
    } else {
      super.src = value
      setImmediate(() => {
        if (this.onload) {
          this.onload()
        }
      })
    }
  }

  get src () {
    return this._src
  }
}

global.Image = MockImage

global.URL = {
  createObjectURL: vi.fn((blob) => {
    // Convert blob content to data URL for testing
    return `data:image/svg+xml;base64,${Buffer.from(blob.content[0]).toString('base64')}`
  }),
  revokeObjectURL: vi.fn()
}

global.Blob = class Blob {
  constructor (content, options) {
    this.content = content
    this.options = options
  }
}

describe('toPNG', () => {
  let pngCache
  let svgCache
  let mockParams

  beforeEach(() => {
    pngCache = new Cache()
    svgCache = new Cache()
    mockParams = {
      shape: '<circle cx="50" cy="50" r="50" fill="red"></circle>',
      width: 100,
      height: 100,
      margin: 0
    }
    if (!existsSync(pngDir)) {
      mkdirSync(pngDir, { recursive: true })
    }
  })

  it('should generate valid PNG data URL', async () => {
    const png = await toPNG(mockParams, { pngCache, svgCache })
    expect(png).toMatch(/^data:image\/png;base64,/)
    const base64 = png.replace('data:image/png;base64,', '')
    expect(base64.length).toBeGreaterThan(100)
  })

  it('should match reference snapshot for red circle', async () => {
    const png = await toPNG(mockParams, { pngCache, svgCache })
    const pngFile = join(pngDir, 'circle.png')
    // Extract base64 and convert to buffer
    const base64 = png.replace('data:image/png;base64,', '')
    const currentBuffer = Buffer.from(base64, 'base64')
    if (!existsSync(pngFile)) {
      // Create snapshot if it doesn't exist
      writeFileSync(pngFile, currentBuffer)
      console.log(`✓ Created snapshot: ${pngFile}`)
    }
    // Compare with snapshot
    const referenceBuffer = readFileSync(pngFile)
    expect(currentBuffer.equals(referenceBuffer)).toBe(true)
  })

  it('should match reference snapshot for blue rectangle', async () => {
    mockParams = {
      shape: '<rect x="0" y="0" width="100" height="100" fill="blue" stroke-color="black" stroke-width="2"></rect>',
      width: 100,
      height: 100,
      margin: 2
    }
    const png = await toPNG(mockParams, { pngCache, svgCache })
    const pngFile = join(pngDir, 'rect.png')
    const base64 = png.replace('data:image/png;base64,', '')
    const currentBuffer = Buffer.from(base64, 'base64')
    if (!existsSync(pngFile)) {
      writeFileSync(pngFile, currentBuffer)
      console.log(`✓ Created snapshot: ${pngFile}`)
    }
    const referenceBuffer = readFileSync(pngFile)
    expect(currentBuffer.equals(referenceBuffer)).toBe(true)
  })

  it('should generate different PNGs for different shapes', async () => {
    const circlePng = await toPNG(mockParams, { pngCache, svgCache })
    mockParams = {
      shape: 'rect x="0" y="0" width="100" height="100" fill="green" stroke-color="black" stroke-width="2"></rect>',
      width: 100,
      height: 100,
      margin: 2
    }
    const rectPng = await toPNG(mockParams, { pngCache, svgCache })
    expect(circlePng).not.toBe(rectPng)
  })

  it('should cache PNG when key is provided', async () => {
    mockParams.key = 'circle-png'
    const png = await toPNG(mockParams, { pngCache, svgCache })
    expect(pngCache.has('circle-png')).toBe(true)
    expect(pngCache.get('circle-png')).toBe(png)
  })

  it('should retrieve identical PNG from cache', async () => {
    mockParams.key = 'circle-png'
    const firstPng = await toPNG(mockParams, { pngCache, svgCache })
    const secondPng = await toPNG(mockParams, { pngCache, svgCache })
    expect(firstPng).toBe(secondPng)
  })

  it('should not cache when no key provided', async () => {
    await toPNG(mockParams, { pngCache, svgCache })
    expect(pngCache.size).toBe(0)
  })

  it('should generate consistent PNG for same params', async () => {
    const png1 = await toPNG(mockParams, { pngCache, svgCache })
    const png2 = await toPNG(mockParams, { pngCache, svgCache })
    expect(png1).toBe(png2)
  })
})
