import { describe, it, expect, beforeEach } from 'vitest'
import { Cache } from '../src/utils/cache'
import {
  toSVG,
  toSVGStyleElement,
  toSVGTextElement,
  toSVGIconElement,
  toSVGTitleElement,
  toSVGStyleAttributes,
  toSVGTransformAttribute
} from '../src/utils/svg'

describe('SVG', () => {
  let svgCache
  let mockParams

  beforeEach(() => {
    svgCache = new Cache()
    mockParams = {
      width: 100,
      height: 100,
      margin: 10,
      shape: '<circle cx="50" cy="50" r="40"/>'
    }
  })

  describe('toSVG', () => {
    it('should generate basic SVG', () => {
      const svg = toSVG(mockParams, { svgCache })
      expect(svg).toContain('<svg')
      expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"')
      expect(svg).toContain('width="100" height="100"')
      expect(svg).toContain(mockParams.shape)
    })

    it('should apply zoom factor', () => {
      mockParams.zoom = 2
      const svg = toSVG(mockParams, { svgCache })
      expect(svg).toContain('width="200" height="200"')
    })

    it('should apply margin to viewBox', () => {
      const svg = toSVG(mockParams, { svgCache })
      expect(svg).toContain('viewBox="-10 -10 120 120"')
    })

    it('should cache SVG when key is provided', () => {
      mockParams.key = 'circle-shape'
      toSVG(mockParams, { svgCache })
      expect(svgCache.has('circle-shape')).toBe(true)
    })

    it('should retrieve from cache when key exists', () => {
      mockParams.key = 'circle-shape'
      const firstSvg = toSVG(mockParams, { svgCache })
      const secondSvg = toSVG(mockParams, { svgCache })
      expect(firstSvg).toBe(secondSvg)
    })

    it('should include style element when provided', () => {
      mockParams.style = '.shape { fill: red; }'
      const svg = toSVG(mockParams, { svgCache })
      expect(svg).toContain('<style>.shape { fill: red; }</style>')
    })

    it('should include text element when provided', () => {
      mockParams.text = { label: 'Hello' }
      const svg = toSVG(mockParams, { svgCache })
      expect(svg).toContain('<text')
      expect(svg).toContain('Hello')
    })

    it('should include icon element when provided', () => {
      mockParams.icon = { classes: 'fa fa-star' }
      const svg = toSVG(mockParams, { svgCache })
      expect(svg).toContain('<foreignObject')
    })
  })

  describe('toSVGStyleElement', () => {
    it('should return empty string when no style', () => {
      expect(toSVGStyleElement({})).toBe('')
    })

    it('should return style element', () => {
      const result = toSVGStyleElement({ style: '.class { color: blue; }' })
      expect(result).toBe('<style>.class { color: blue; }</style>')
    })
  })

  describe('toSVGTextElement', () => {
    it('should return empty string when no text', () => {
      expect(toSVGTextElement({ height: 100 })).toBe('')
    })

    it('should return empty string when no label', () => {
      expect(toSVGTextElement({ text: {}, height: 100 })).toBe('')
    })

    it('should generate text element with label', () => {
      const result = toSVGTextElement({
        text: { label: 'Test' },
        height: 100
      })
      expect(result).toContain('<text')
      expect(result).toContain('Test')
      expect(result).toContain('text-anchor="middle"')
    })

    it('should apply font size with scale', () => {
      const result = toSVGTextElement({
        text: { label: 'Test', size: 12 },
        height: 100
      })
      expect(result).toContain('font-size="12px"')
    })

    it('should apply text color', () => {
      const result = toSVGTextElement({
        text: { label: 'Test', color: 'red' },
        height: 100
      })
      expect(result).toContain('fill="red"')
    })

    it('should apply font properties', () => {
      const result = toSVGTextElement({
        text: {
          label: 'Test',
          font: 'Arial',
          style: 'italic',
          weight: 'bold',
          variant: 'small-caps'
        },
        height: 100
      })
      expect(result).toContain('font-family="Arial"')
      expect(result).toContain('font-style="italic"')
      expect(result).toContain('font-weight="bold"')
      expect(result).toContain('font-variant="small-caps"')
    })

    it('should apply transform', () => {
      const result = toSVGTextElement({
        text: {
          label: 'Test',
          transform: { rotate: [45, 50, 50] }
        },
        height: 100
      })
      expect(result).toContain('transform="rotate(45 50 50)"')
    })
  })

  describe('toSVGIconElement', () => {
    it('should return empty string when no icon', () => {
      expect(toSVGIconElement({ height: 100 })).toBe('')
    })

    it('should return empty string when no classes or url', () => {
      expect(toSVGIconElement({ icon: {}, height: 100 })).toBe('')
    })

    it('should generate icon element with classes', () => {
      const result = toSVGIconElement({
        icon: { classes: 'fa fa-star' },
        height: 100
      })
      expect(result).toContain('<foreignObject')
      expect(result).toContain('fa fa-star')
    })

    it('should apply icon size', () => {
      const result = toSVGIconElement({
        icon: { classes: 'fa fa-star', size: 16 },
        height: 100
      })
      expect(result).toContain('font-size:16px')
    })

    it('should apply icon color', () => {
      const result = toSVGIconElement({
        icon: { classes: 'fa fa-star', color: 'blue' },
        height: 100
      })
      expect(result).toContain('color:blue;')
    })
  })

  describe('toSVGTitleElement', () => {
    it('should return empty string when no label', () => {
      expect(toSVGTitleElement({})).toBe('')
    })

    it('should generate title element', () => {
      const result = toSVGTitleElement({ label: 'My Shape' })
      expect(result).toBe('<title>My Shape</title>')
    })
  })

  describe('toSVGStyleAttributes', () => {
    it('should return empty string when no params', () => {
      expect(toSVGStyleAttributes()).toBe('')
    })

    it('should apply fill color', () => {
      const result = toSVGStyleAttributes({ color: 'red' })
      expect(result).toContain('fill="red"')
    })

    it('should apply fill opacity', () => {
      const result = toSVGStyleAttributes({ opacity: 0.5 })
      expect(result).toContain('fill-opacity="0.5"')
    })

    it('should not include stroke for transparent color', () => {
      const result = toSVGStyleAttributes({
        color: 'red',
        stroke: { color: 'transparent' }
      })
      expect(result).toBe('fill="red"')
      expect(result).not.toContain('stroke')
    })

    it('should apply basic stroke', () => {
      const result = toSVGStyleAttributes({
        stroke: { color: 'black', width: '2px' }
      })
      expect(result).toContain('stroke="black"')
      expect(result).toContain('stroke-width="2px"')
      expect(result).toContain('vector-effect="non-scaling-stroke"')
    })

    it('should apply stroke opacity', () => {
      const result = toSVGStyleAttributes({
        stroke: { color: 'black', opacity: 0.7 }
      })
      expect(result).toContain('stroke-opacity="0.7"')
    })

    it('should apply stroke dash properties', () => {
      const result = toSVGStyleAttributes({
        stroke: {
          color: 'black',
          dashArray: '5,5',
          dashOffset: '2'
        }
      })
      expect(result).toContain('stroke-dasharray="5,5"')
      expect(result).toContain('stroke-dashoffset="2"')
    })

    it('should apply stroke line properties', () => {
      const result = toSVGStyleAttributes({
        stroke: {
          color: 'black',
          lineCap: 'round',
          lineJoin: 'bevel',
          miterLimit: '4'
        }
      })
      expect(result).toContain('stroke-linecap="round"')
      expect(result).toContain('stroke-linejoin="bevel"')
      expect(result).toContain('stroke-miterlimit="4"')
    })
  })

  describe('toSVGTransformAttribute', () => {
    it('should return empty string when no transform', () => {
      expect(toSVGTransformAttribute()).toBe('')
    })

    it('should apply rotate transform', () => {
      const result = toSVGTransformAttribute({
        rotate: [45, 50, 50]
      })
      expect(result).toBe('transform="rotate(45 50 50)"')
    })

    it('should apply translate transform', () => {
      const result = toSVGTransformAttribute({
        translate: [10, 20]
      })
      expect(result).toBe('transform="translate(10 20)"')
    })

    it('should apply scale transform', () => {
      const result = toSVGTransformAttribute({
        scale: [2, 2]
      })
      expect(result).toBe('transform="scale(2 2)"')
    })

    it('should apply skew transforms', () => {
      const result = toSVGTransformAttribute({
        skewX: 10,
        skewY: 20
      })
      expect(result).toBe('transform="skewX(10) skewY(20)"')
    })

    it('should combine multiple transforms', () => {
      const result = toSVGTransformAttribute({
        rotate: [45, 50, 50],
        translate: [10, 20],
        scale: [2, 2]
      })
      expect(result).toContain('rotate(45 50 50)')
      expect(result).toContain('translate(10 20)')
      expect(result).toContain('scale(2 2)')
    })
  })
})
