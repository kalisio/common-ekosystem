import { DateTime } from '../../src/models/index.js'
import { timeSeries } from '../../src/utilities/index.js'

const t = (minutes) => Date.UTC(2026, 10, 22, 12, minutes)

describe('timeSeries', () => {
  describe('findNearest', () => {
    it('returns the closest index and difference in milliseconds', () => {
      expect(timeSeries.findNearest([t(0), t(10), t(30)], t(17)))
        .toEqual({ index: 1, difference: 7 * 60000 })
      expect(timeSeries.findNearest([t(0), t(10), t(30)], t(28)))
        .toEqual({ index: 2, difference: 2 * 60000 })
    })
    it('handles exact matches and boundaries', () => {
      const times = [t(0), t(10), t(30)]
      expect(timeSeries.findNearest(times, t(10))).toEqual({ index: 1, difference: 0 })
      expect(timeSeries.findNearest(times, t(-10))).toEqual({ index: 0, difference: 10 * 60000 })
      expect(timeSeries.findNearest(times, t(40))).toEqual({ index: 2, difference: 10 * 60000 })
    })
    it('prefers the earlier instant on ties', () => {
      expect(timeSeries.findNearest([t(0), t(10)], t(5)))
        .toEqual({ index: 0, difference: 5 * 60000 })
      expect(timeSeries.findNearest([t(0), t(10), t(30)], t(20)))
        .toEqual({ index: 1, difference: 10 * 60000 })
    })
    it('returns the first duplicate', () => {
      expect(timeSeries.findNearest([t(0), t(10), t(10), t(30)], t(10)))
        .toEqual({ index: 1, difference: 0 })
      expect(timeSeries.findNearest([t(0), t(10), t(10)], t(40)))
        .toEqual({ index: 1, difference: 30 * 60000 })
    })
    it('accepts Date, DateTime, number and ISO strings', () => {
      const times = [new Date(t(0)), new DateTime(t(10)), new Date(t(30)).toISOString()]
      expect(timeSeries.findNearest(times, new DateTime(t(9))))
        .toEqual({ index: 1, difference: 60000 })
    })
    it('returns null for an empty series', () => {
      expect(timeSeries.findNearest([], t(0))).toBe(null)
    })
    it('validates its arguments', () => {
      expect(() => timeSeries.findNearest(null, t(0))).toThrow('times must be an array')
    })
  })

  describe('findNext', () => {
    it('finds the first instant greater than or equal to the target', () => {
      expect(timeSeries.findNext([t(0), t(10), t(30)], t(12)))
        .toEqual({ index: 2, difference: 18 * 60000 })
      expect(timeSeries.findNext([t(0), t(10), t(30)], t(10)))
        .toEqual({ index: 1, difference: 0 })
    })
    it('handles boundaries', () => {
      const times = [t(0), t(10), t(30)]
      expect(timeSeries.findNext(times, t(-10)))
        .toEqual({ index: 0, difference: 10 * 60000 })
      expect(timeSeries.findNext(times, t(30)))
        .toEqual({ index: 2, difference: 0 })
      expect(timeSeries.findNext(times, t(40))).toBe(null)
    })
    it('returns the first duplicate', () => {
      expect(timeSeries.findNext([t(0), t(10), t(10), t(30)], t(10)))
        .toEqual({ index: 1, difference: 0 })
    })
    it('returns null for an empty series', () => {
      expect(timeSeries.findNext([], t(10))).toBe(null)
    })
    it('validates its arguments', () => {
      expect(() => timeSeries.findNext(null, t(0))).toThrow('times must be an array')
    })
  })

  describe('findPrevious', () => {
    it('finds the last instant less than or equal to the target', () => {
      expect(timeSeries.findPrevious([t(0), t(10), t(30)], t(28)))
        .toEqual({ index: 1, difference: 18 * 60000 })
      expect(timeSeries.findPrevious([t(0), t(10), t(30)], t(10)))
        .toEqual({ index: 1, difference: 0 })
    })
    it('handles boundaries', () => {
      const times = [t(0), t(10), t(30)]
      expect(timeSeries.findPrevious(times, t(-10))).toBe(null)
      expect(timeSeries.findPrevious(times, t(0)))
        .toEqual({ index: 0, difference: 0 })
      expect(timeSeries.findPrevious(times, t(40)))
        .toEqual({ index: 2, difference: 10 * 60000 })
    })
    it('returns the last duplicate', () => {
      expect(timeSeries.findPrevious([t(0), t(10), t(10), t(30)], t(10)))
        .toEqual({ index: 2, difference: 0 })
    })
    it('returns null for an empty series', () => {
      expect(timeSeries.findPrevious([], t(10))).toBe(null)
    })
    it('validates its arguments', () => {
      expect(() => timeSeries.findPrevious(null, t(0))).toThrow('times must be an array')
    })
  })

  describe('guessStep', () => {
    it('computes the minimum chronological gap', () => {
      expect(timeSeries.guessStep([t(0), t(10), t(30)]))
        .toBe(10 * 60000)
    })
    it('computes the maximum chronological gap', () => {
      expect(timeSeries.guessStep([t(0), t(10), t(30)], { mode: 'maximum' }))
        .toBe(20 * 60000)
    })
    it('handles regular time series', () => {
      const times = [t(0), t(10), t(20), t(30)]
      expect(timeSeries.guessStep(times)).toBe(10 * 60000)
      expect(timeSeries.guessStep(times, { mode: 'maximum' })).toBe(10 * 60000)
    })
    it('ignores duplicate timestamps', () => {
      const times = [t(0), t(0), t(10), t(10), t(30)]
      expect(timeSeries.guessStep(times)).toBe(10 * 60000)
      expect(timeSeries.guessStep(times, { mode: 'maximum' })).toBe(20 * 60000)
    })
    it('returns null for insufficient or indistinguishable samples', () => {
      expect(timeSeries.guessStep([])).toBe(null)
      expect(timeSeries.guessStep([t(0)])).toBe(null)
      expect(timeSeries.guessStep([t(0), t(0)])).toBe(null)
      expect(timeSeries.guessStep([t(0), t(0), t(0)])).toBe(null)
    })
    it('accepts Date, DateTime, number and ISO strings', () => {
      const times = [new Date(t(0)), new DateTime(t(10)), new Date(t(30)).toISOString()]
      expect(timeSeries.guessStep(times)).toBe(10 * 60000)
    })
    it('does not mutate the input array', () => {
      const times = [t(0), t(10), t(30)]
      timeSeries.guessStep(times)
      expect(times).toEqual([t(0), t(10), t(30)])
    })
    it('validates its arguments', () => {
      expect(() => timeSeries.guessStep('invalid')).toThrow('times must be an array')
      expect(() => timeSeries.guessStep([t(0), t(10)], { mode: 'mean' }))
        .toThrow('invalid step mode')
    })
  })
})
