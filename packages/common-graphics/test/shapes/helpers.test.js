import { describe, expect, it } from 'vitest'
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
        icon: {
          transform: {
            translate: [50, 50]
          }
        },
        text: {
          transform: {
            translate: [50, 50]
          }
        },
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
          value: 'A'
        },
        style: '.shape {}'
      }, '<path />')
      expect(result.icon).toEqual({
        transform: {
          translate: [50, 50]
        },
        classes: ['icon']
      })
      expect(result.text).toEqual({
        transform: {
          translate: [50, 50]
        },
        value: 'A'
      })
      expect(result.style).toBe('.shape {}')
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
