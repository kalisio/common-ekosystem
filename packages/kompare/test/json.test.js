import { describe, it, expect } from 'vitest'
import { compareJsonObjects } from '../src/json.js'

describe('JSON Comparison', () => {
  it('should validate all features', () => {
    const obj1 = {
      id: 'A-1',
      details: {
        version: 1.5,
        status: 'stable',
        tags: ['prod', 'web', 'api']
      },
      metrics: [
        { type: 'cpu', value: 45 },
        { type: 'ram', value: 80 }
      ],
      updatedAt: '2026-01-01'
    }

    const obj2 = {
      details: {
        status: 'stable',
        tags: ['api', 'prod', 'web'],
        version: 1.5
      },
      metrics: [
        { value: 80, type: 'ram' },
        { value: 45, type: 'cpu' }
      ],
      id: 'B-2',
      updatedAt: '2026-02-18'
    }

    const ignored = ['id', 'updatedAt']
    expect(compareJsonObjects(obj1, obj2, ignored)).toBe(true)
  })

  it('should detect value updates and type mismatches', () => {
    expect(compareJsonObjects({ a: 10 }, { a: 20 })).toBe(false)
    expect(compareJsonObjects({ a: 10 }, { a: '10' })).toBe(false)
    expect(compareJsonObjects({ a: { b: 1 } }, { a: { b: 2 } })).toBe(false)
  })

  it('should detect missing or extra keys', () => {
    expect(compareJsonObjects({ a: 1 }, { })).toBe(false)
    expect(compareJsonObjects({ }, { b: 2 })).toBe(false)
  })

  it('should display summary table of test results', () => {
    const results = [
      { Feature: 'Normalization (Sorting)', Passed: compareJsonObjects({ z: 1, a: 2 }, { a: 2, z: 1 }) },
      { Feature: 'Array Reordering', Passed: compareJsonObjects([1, 2], [2, 1]) },
      { Feature: 'Key Exclusion', Passed: compareJsonObjects({ id: 1 }, { id: 2 }, ['id']) },
      { Feature: 'Deep Diff Detection', Passed: !compareJsonObjects({ a: { b: 1 } }, { a: { b: 2 } }) }
    ]
    console.table(results)
  })
})
