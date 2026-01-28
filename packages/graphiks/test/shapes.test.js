import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { describe, it, expect } from 'vitest'
import { Graphiks } from '../src/graphiks.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const svgDir = join(__dirname, 'data', 'reference', 'svg')

describe('shapes', () => {
  const graphiks = new Graphiks()

  const BasicShapes = [
    { shape: 'circle', color: 'red' },
    { shape: 'cross', color: 'red' },
    { shape: 'heart', color: 'red' },
    { shape: 'rect', color: 'green' },
    { shape: 'rounded-rect', color: 'green' },
    { shape: 'diamond', color: 'green' },
    { shape: 'triangle', color: 'blue' },
    { shape: 'triangle-down', color: 'blue' },
    { shape: 'triangle-right', color: 'blue' },
    { shape: 'triangle-left', color: 'blue' },
    { shape: 'marker-pin', color: 'purple' },
    { shape: 'square-pin', color: 'purple' },
    { shape: 'star4', color: 'lime' },
    { shape: 'star5', color: 'lime' },
    { shape: 'star6', color: 'lime' },
    { shape: 'pentagon', color: 'yellow' },
    { shape: 'hexagon', color: 'yellow' },
    { shape: 'polygon', color: 'yellow' },
    {
      shape: 'donut',
      slices: [
        { value: 10, label: 'slice a', color: 'red' },
        { value: 25, label: 'slice b', color: 'green' },
        { value: 18, label: 'slice c', color: 'blue' }
      ]
    },
    {
      shape: 'pie',
      slices: [
        { value: 12, label: 'slice a', color: 'red' },
        { value: 30, label: 'slice b', color: 'green' },
        { value: 10, label: 'slice c', color: 'blue' }
      ]
    }
  ]

  it('should list the shapes', () => {
    const shapes = graphiks.listShapeTypes()
    expect(Array.isArray(shapes)).toBe(true)
  })

  it('should have the circle shape registered', () => {
    const hasCircle = graphiks.hasShapeType('circle')
    expect(hasCircle).toBe(true)
  })

  it('should not have the dummy shape registered', () => {
    const hasDummy = graphiks.hasShapeType('dummy')
    expect(hasDummy).toBe(false)
  })

  it('should render the registered shapes correctly', () => {
    if (!existsSync(svgDir)) {
      mkdirSync(svgDir, { recursive: true })
    }
    for (const shape of BasicShapes) {
      const graphic = graphiks.renderShape(shape)
      expect(graphic).not.toBeNull()
      const svg = graphic.toSVG()
      const svgFile = join(svgDir, `${shape.shape}.svg`)
      if (!existsSync(svgFile)) {
        // Create svg if it doesn't exist
        writeFileSync(svgFile, svg)
        console.log(`✓ Created snapshot: ${svgFile}`)
      }
      // Compare the reference file
      const referenceSvg = readFileSync(svgFile, 'utf8')
      expect(referenceSvg).toBe(svg)
    }
  })
})
