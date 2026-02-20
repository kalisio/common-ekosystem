import { describe, it, expect, afterAll } from 'vitest'
import { json } from '../src/index.js'
import fs from 'fs'
import path from 'path'

describe('json.isEqual', () => {
  const tempFile1 = path.join(__dirname, 'test1.json')
  const tempFile2 = path.join(__dirname, 'test2.json')

  it('should validate all features', () => {
    const obj1 = {
      id: 'A-1',
      details: { version: 1.5, status: 'stable', tags: ['prod', 'web', 'api'] },
      metrics: [{ type: 'cpu', value: 45 }, { type: 'ram', value: 80 }],
      updatedAt: '2026-01-01'
    }

    const obj2 = {
      details: { status: 'stable', tags: ['api', 'prod', 'web'], version: 1.5 },
      metrics: [{ value: 80, type: 'ram' }, { value: 45, type: 'cpu' }],
      id: 'B-2',
      updatedAt: '2026-02-18'
    }

    expect(json.isEqual(obj1, obj2, { ignoredKeys: ['id', 'updatedAt'] })).toBe(true)
  })

  it('should detect value updates and type mismatches', () => {
    expect(json.isEqual({ a: 10 }, { a: 20 })).toBe(false)
    expect(json.isEqual({ a: 10 }, { a: '10' })).toBe(false)
    expect(json.isEqual({ a: { b: 1 } }, { a: { b: 2 } })).toBe(false)
  })

  it('should detect missing and extra keys', () => {
    const obj1 = { a: 1, b: 2 }
    const obj2 = { a: 1, c: 3 }

    const result = json.compare(obj1, obj2)

    expect(result.isEqual).toBe(false)
    expect(result.differences.missing).toContain('b')
    expect(result.differences.extra).toContain('c')
  })
  it('should validate file comparison methods', () => {
    const data = { a: 1, b: 2 }
    fs.writeFileSync(tempFile1, JSON.stringify(data))
    fs.writeFileSync(tempFile2, JSON.stringify({ b: 2, a: 1 }))

    expect(json.isEqualFile(data, tempFile1)).toBe(true)
    expect(json.isEqualFiles(tempFile1, tempFile2)).toBe(true)

    const result = json.compare(data, data)
    expect(result.isEqual).toBe(true)
  })

  it('should display summary table of test results', () => {
    const results = [
      { Feature: 'Normalization (Sorting)', Passed: json.isEqual({ z: 1, a: 2 }, { a: 2, z: 1 }) },
      { Feature: 'Array Reordering', Passed: json.isEqual([1, 2], [2, 1]) },
      { Feature: 'Key Exclusion', Passed: json.isEqual({ id: 1 }, { id: 2 }, { ignoredKeys: ['id'] }) },
      { Feature: 'Deep Diff Detection', Passed: !json.isEqual({ a: { b: 1 } }, { a: { b: 2 } }) }
    ]
    console.table(results)
  })
  afterAll(() => {
    if (fs.existsSync(tempFile1)) fs.unlinkSync(tempFile1)
    if (fs.existsSync(tempFile2)) fs.unlinkSync(tempFile2)
  })
  it('should detect nested differences', () => {
    const obj1 = {
      settings: {
        port: 8080,
        active: true
      }
    }
    const obj2 = {
      settings: {
        port: 9090,
        active: true
      }
    }

    const result = json.compare(obj1, obj2)

    expect(result.isEqual).toBe(false)
    expect(result.differences.updated[0].path).toBe('settings.port')
    expect(result.differences.updated[0].oldValue).toBe(8080)
    expect(result.differences.updated[0].newValue).toBe(9090)
  })
})
