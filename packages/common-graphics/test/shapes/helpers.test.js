import { computeStandardSize, setupStandardShape } from '../../src/shapes/helpers.js'

describe('shape helpers', () => {
  describe('computeStandardSize', () => {
    it('computes size from size', () => {
      expect(computeStandardSize({ size: [20, 30] })).toEqual({
        width: 20,
        height: 30
      })
    })
    it('computes size from radius', () => {
      expect(computeStandardSize({ radius: 10 })).toEqual({
        width: 20,
        height: 20
      })
    })
    it('uses the default size', () => {
      expect(computeStandardSize({})).toEqual({
        width: 50,
        height: 50
      })
    })
  })
  describe('setupStandardShape', () => {
    it('sets up a standard shape', () => {
      const result = setupStandardShape({}, '<path />')
      expect(result).toEqual({
        width: 50,
        height: 50,
        margin: 0,
        shape: '<path />',
        icon: undefined,
        text: undefined,
        style: undefined
      })
    })
    it('computes margin from stroke width', () => {
      const result = setupStandardShape({
        stroke: {
          width: 3
        }
      }, '<path />')
      expect(result.margin).toBe(3)
    })
    it('uses the default stroke width as margin', () => {
      const result = setupStandardShape({
        stroke: {}
      }, '<path />')
      expect(result.margin).toBe(1)
    })
    it('preserves icon, text and style parameters', () => {
      const result = setupStandardShape({
        icon: {
          classes: ['icon']
        },
        text: {
          label: 'A'
        },
        style: '.shape {}'
      }, '<path />')
      expect(result.icon).toEqual({
        classes: ['icon']
      })
      expect(result.text).toEqual({
        label: 'A'
      })
      expect(result.style).toBe('.shape {}')
    })
    it('preserves overlay origins and transformations', () => {
      const icon = {
        classes: ['icon'],
        origin: [25, 30],
        transform: {
          rotate: [45]
        }
      }
      const text = {
        label: 'A',
        origin: [50, 40],
        transform: {
          translate: [0, -10]
        }
      }
      const result = setupStandardShape({ icon, text }, '<path />')
      expect(result.icon).toEqual(icon)
      expect(result.text).toEqual(text)
    })
    it('uses a custom size computation function', () => {
      const computeSize = () => ({
        width: 80,
        height: 40
      })
      const result = setupStandardShape({}, '<path />', computeSize)
      expect(result.width).toBe(80)
      expect(result.height).toBe(40)
    })
  })
})
