import { LRUCache } from 'lru-cache'
import {
  toSVG,
  toSVGStyleElement,
  toSVGTextElement,
  toSVGIconElement,
  toSVGTitleElement,
  toSVGStyleAttributes,
  toSVGTransformAttribute
} from '../../../src/shapes/renderers'

describe('SVG', () => {
  let svgCache
  let mockParams

  beforeEach(() => {
    svgCache = new LRUCache({ max: 100 })
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
    it('should apply margin to viewBox', () => {
      const svg = toSVG(mockParams, { svgCache })
      expect(svg).toContain('viewBox="-10 -10 120 120"')
    })
    it('should default margin to 0', () => {
      delete mockParams.margin
      const svg = toSVG(mockParams, { svgCache })
      expect(svg).toContain('viewBox="0 0 100 100"')
    })
    it('should cache SVG when key is provided', () => {
      mockParams.key = 'circle-shape'
      toSVG(mockParams, { svgCache })
      expect(svgCache.has('circle-shape')).toBe(true)
    })
    it('should not cache SVG without key', () => {
      toSVG(mockParams, { svgCache })
      expect(svgCache.size).toBe(0)
    })
    it('should retrieve from cache when key exists', () => {
      mockParams.key = 'circle-shape'
      const firstSvg = toSVG(mockParams, { svgCache })
      const secondSvg = toSVG({ ...mockParams, shape: '<rect width="100" height="100"/>' }, { svgCache })
      expect(secondSvg).toBe(firstSvg)
    })
    it('should include style element before the shape', () => {
      mockParams.style = '.shape { fill: red; }'
      const svg = toSVG(mockParams, { svgCache })
      expect(svg).toContain(`<style>.shape { fill: red; }</style>${mockParams.shape}`)
    })
    it('should not wrap the shape in a group without text or icon', () => {
      const svg = toSVG(mockParams, { svgCache })
      expect(svg).not.toContain('<g')
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
    it('should group shape, text and icon in this order', () => {
      mockParams.text = { label: 'Hello' }
      mockParams.icon = { url: 'icon.png' }
      const svg = toSVG(mockParams, { svgCache })
      expect(svg).toContain(`<g>${mockParams.shape}<g transform="translate(50 50)"><text`)
      expect(svg).toContain('</text></g><image')
      expect(svg).toMatch(/\/><\/g><\/svg>$/)
    })
    it('should throw when width is missing', () => {
      delete mockParams.width
      expect(() => toSVG(mockParams, { svgCache })).toThrow('width must be a positive number')
    })
    it('should throw when height is missing', () => {
      delete mockParams.height
      expect(() => toSVG(mockParams, { svgCache })).toThrow('height must be a positive number')
    })
    it('should throw when width or height is not positive', () => {
      expect(() => toSVG({ ...mockParams, width: 0 }, { svgCache })).toThrow('width must be a positive number')
      expect(() => toSVG({ ...mockParams, height: -10 }, { svgCache })).toThrow('height must be a positive number')
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
      const result = toSVGTextElement({ text: { label: 'Test' }, height: 100 })
      expect(result).toContain('<text')
      expect(result).toContain('Test')
      expect(result).toContain('text-anchor="middle"')
    })
    it('should center the text in a group', () => {
      const result = toSVGTextElement({ text: { label: 'Test' }, height: 100 })
      expect(result).toMatch(/^<g transform="translate\(50 50\)"><text [^>]*>Test<\/text><\/g>$/)
    })
    it('should default font size to 12px', () => {
      const result = toSVGTextElement({ text: { label: 'Test' }, height: 100 })
      expect(result).toContain('font-size="12px"')
    })
    it('should apply font size with scale', () => {
      const result = toSVGTextElement({ text: { label: 'Test', size: 12 }, height: 50 })
      expect(result).toContain('font-size="24px"')
    })
    it('should apply text color', () => {
      const result = toSVGTextElement({ text: { label: 'Test', color: 'red' }, height: 100 })
      expect(result).toContain('fill="red"')
    })
    it('should apply font properties', () => {
      const result = toSVGTextElement({
        text: { label: 'Test', font: 'Arial', style: 'italic', weight: 'bold', variant: 'small-caps' },
        height: 100
      })
      expect(result).toContain('font-family="Arial"')
      expect(result).toContain('font-style="italic"')
      expect(result).toContain('font-weight="bold"')
      expect(result).toContain('font-variant="small-caps"')
    })
    it('should apply cursor', () => {
      const result = toSVGTextElement({ text: { label: 'Test', cursor: 'pointer' }, height: 100 })
      expect(result).toContain('cursor="pointer"')
    })
    it('should apply classes', () => {
      const result = toSVGTextElement({ text: { label: 'Test', classes: 'label' }, height: 100 })
      expect(result).toContain('class="label"')
    })
    it('should join an array of classes', () => {
      const result = toSVGTextElement({ text: { label: 'Test', classes: ['label', null, '', 'bold'] }, height: 100 })
      expect(result).toContain('class="label bold"')
    })
    it('should omit empty classes', () => {
      const result = toSVGTextElement({ text: { label: 'Test', classes: [] }, height: 100 })
      expect(result).not.toContain('class=')
    })
    it('should apply transform relative to the center', () => {
      const result = toSVGTextElement({ text: { label: 'Test', transform: { translate: [0, 75] } }, height: 100 })
      expect(result).toMatch(/^<g transform="translate\(50 50\)"><text [^>]*transform="translate\(0 75\)"/)
    })
    it('should throw when height is missing', () => {
      expect(() => toSVGTextElement({ text: { label: 'Test' } })).toThrow('height must be a positive number')
    })
    it('should rotate around the text anchor', () => {
      const result = toSVGTextElement({ text: { label: 'Test', transform: { rotate: [45] } }, height: 100 })
      expect(result).toContain('transform="rotate(45)"')
    })
    it('should render a numeric label 0', () => {
      const result = toSVGTextElement({ text: { label: 0 }, height: 100 })
      expect(result).toContain('>0</text>')
    })
    it('should ignore a blank label', () => {
      expect(toSVGTextElement({ text: { label: '  ' }, height: 100 })).toBe('')
    })
    it('should ignore blank class names', () => {
      const result = toSVGTextElement({ text: { label: 'Test', classes: ['label', ' ', 'bold'] }, height: 100 })
      expect(result).toContain('class="label bold"')
    })
  })

  describe('toSVGIconElement', () => {
    it('should return empty string when no icon', () => {
      expect(toSVGIconElement({ height: 100 })).toBe('')
    })
    it('should return empty string when no classes, symbol or url', () => {
      expect(toSVGIconElement({ icon: {}, height: 100 })).toBe('')
    })
    it('should generate icon element with classes', () => {
      const result = toSVGIconElement({ icon: { classes: 'fa fa-star' }, height: 100 })
      expect(result).toContain('<foreignObject')
      expect(result).toContain('class="fa fa-star"')
    })
    it('should join an array of classes', () => {
      const result = toSVGIconElement({ icon: { classes: ['fa', null, 'fa-star'] }, height: 100 })
      expect(result).toContain('class="fa fa-star"')
    })
    it('should default icon size to 12px', () => {
      const result = toSVGIconElement({ icon: { classes: 'fa fa-star' }, height: 100 })
      expect(result).toContain('font-size:12px')
    })
    it('should apply icon size', () => {
      const result = toSVGIconElement({ icon: { classes: 'fa fa-star', size: 16 }, height: 100 })
      expect(result).toContain('font-size:16px')
    })
    it('should apply icon size with scale', () => {
      const result = toSVGIconElement({ icon: { classes: 'fa fa-star', size: 16 }, height: 50 })
      expect(result).toContain('font-size:32px')
    })
    it('should apply icon color', () => {
      const result = toSVGIconElement({ icon: { classes: 'fa fa-star', color: 'blue' }, height: 100 })
      expect(result).toContain('color:blue;')
    })
    it('should generate icon element with external svg object id', () => {
      const result = toSVGIconElement({ icon: { symbol: '/symbols.svg#super-icon' }, height: 100 })
      expect(result).toContain('<use')
      expect(result).toContain('href="/symbols.svg#super-icon"')
    })
    it('should generate well-formed markup for a symbol', () => {
      const result = toSVGIconElement({ icon: { symbol: '#pin' }, height: 100 })
      expect(result).toBe('<svg x="0" y="0" width="100" height="100" opacity="1" fill="#000000"><use href="#pin"/></svg>')
    })
    it('should apply symbol size, color and opacity', () => {
      const result = toSVGIconElement({ icon: { symbol: '#pin', size: 25, color: 'red', opacity: 0.5 }, height: 50 })
      expect(result).toContain('x="25" y="25" width="50" height="50"')
      expect(result).toContain('opacity="0.5" fill="red"')
    })
    it('should generate image element with url', () => {
      const result = toSVGIconElement({ icon: { url: 'icon.png' }, height: 100 })
      expect(result).toBe('<image href="icon.png" x="0" y="0" width="100" height="100" preserveAspectRatio="xMidYMid meet"/>')
    })
    it('should apply image size with scale', () => {
      const result = toSVGIconElement({ icon: { url: 'icon.png', size: 25 }, height: 50 })
      expect(result).toContain('x="25" y="25" width="50" height="50"')
    })
    it('should prefer classes over symbol and url', () => {
      const result = toSVGIconElement({ icon: { classes: 'fa fa-star', symbol: '#pin', url: 'icon.png' }, height: 100 })
      expect(result).toContain('<foreignObject')
      expect(result).not.toContain('<use')
      expect(result).not.toContain('<image')
    })
    it('should not need height for an unsized symbol or url', () => {
      expect(toSVGIconElement({ icon: { symbol: '#pin' } })).toContain('width="100" height="100"')
      expect(toSVGIconElement({ icon: { url: 'icon.png' } })).toContain('width="100" height="100"')
    })
    it('should throw when height is missing for classes or a sized icon', () => {
      expect(() => toSVGIconElement({ icon: { classes: 'fa fa-star' } })).toThrow('height must be a positive number')
      expect(() => toSVGIconElement({ icon: { url: 'icon.png', size: 25 } })).toThrow('height must be a positive number')
    })
    it('should prefer symbol over url', () => {
      const result = toSVGIconElement({ icon: { symbol: '#pin', url: 'icon.png' }, height: 100 })
      expect(result).toContain('<use')
      expect(result).not.toContain('<image')
    })
    it('should return empty string for an empty classes array', () => {
      expect(toSVGIconElement({ icon: { classes: [] }, height: 100 })).toBe('')
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
    it('should render a numeric label 0', () => {
      expect(toSVGTitleElement({ label: 0 })).toBe('<title>0</title>')
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
    it('should keep a fill opacity of 0', () => {
      const result = toSVGStyleAttributes({ opacity: 0 })
      expect(result).toBe('fill-opacity="0"')
    })
    it('should ignore null color and opacity', () => {
      expect(toSVGStyleAttributes({ color: null, opacity: null })).toBe('')
    })
    it('should not include stroke for transparent color', () => {
      const result = toSVGStyleAttributes({ color: 'red', stroke: { color: 'transparent' } })
      expect(result).toBe('fill="red"')
      expect(result).not.toContain('stroke')
    })
    it('should default stroke to 1px black', () => {
      const result = toSVGStyleAttributes({ stroke: {} })
      expect(result).toBe('vector-effect="non-scaling-stroke" stroke-width="1px" stroke="black"')
    })
    it('should keep a stroke width of 0', () => {
      const result = toSVGStyleAttributes({ stroke: { color: 'black', width: 0 } })
      expect(result).toContain('stroke-width="0"')
    })
    it('should apply basic stroke', () => {
      const result = toSVGStyleAttributes({ stroke: { color: 'black', width: '2px' } })
      expect(result).toContain('stroke="black"')
      expect(result).toContain('stroke-width="2px"')
      expect(result).toContain('vector-effect="non-scaling-stroke"')
    })
    it('should apply stroke opacity', () => {
      const result = toSVGStyleAttributes({ stroke: { color: 'black', opacity: 0.7 } })
      expect(result).toContain('stroke-opacity="0.7"')
    })
    it('should apply stroke dash properties', () => {
      const result = toSVGStyleAttributes({ stroke: { color: 'black', dashArray: '5,5', dashOffset: '2' } })
      expect(result).toContain('stroke-dasharray="5,5"')
      expect(result).toContain('stroke-dashoffset="2"')
    })
    it('should apply stroke line properties', () => {
      const result = toSVGStyleAttributes({ stroke: { color: 'black', lineCap: 'round', lineJoin: 'bevel', miterLimit: '4' } })
      expect(result).toContain('stroke-linecap="round"')
      expect(result).toContain('stroke-linejoin="bevel"')
      expect(result).toContain('stroke-miterlimit="4"')
    })
    it('should keep a stroke opacity of 0', () => {
      const result = toSVGStyleAttributes({ stroke: { color: 'black', opacity: 0 } })
      expect(result).toContain('stroke-opacity="0"')
    })
  })

  describe('toSVGTransformAttribute', () => {
    it('should return empty string when no transform', () => {
      expect(toSVGTransformAttribute()).toBe('')
    })
    it('should apply rotate transform', () => {
      const result = toSVGTransformAttribute({ rotate: [45, 50, 50] })
      expect(result).toBe('transform="rotate(45 50 50)"')
    })
    it('should apply translate transform', () => {
      const result = toSVGTransformAttribute({ translate: [10, 20] })
      expect(result).toBe('transform="translate(10 20)"')
    })
    it('should apply scale transform', () => {
      const result = toSVGTransformAttribute({ scale: [2, 2] })
      expect(result).toBe('transform="scale(2 2)"')
    })
    it('should apply skew transforms', () => {
      const result = toSVGTransformAttribute({ skewX: 10, skewY: 20 })
      expect(result).toBe('transform="skewX(10) skewY(20)"')
    })
    it('should combine multiple transforms in order', () => {
      const result = toSVGTransformAttribute({ scale: [2, 2], translate: [10, 20], rotate: [45, 50, 50] })
      expect(result).toBe('transform="rotate(45 50 50) translate(10 20) scale(2 2)"')
    })
    it('should accept a number for rotate', () => {
      expect(toSVGTransformAttribute({ rotate: 45 })).toBe('transform="rotate(45)"')
    })
  })
})
