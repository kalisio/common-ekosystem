import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import { json } from '../src/json.js'

describe('json.isEqual', () => {
  it('identical structured objects with different array order', () => {
    const a = {
      order: {
        id: 100,
        items: [
          { sku: 'B2', name: 'Pen' },
          { sku: 'A1', name: 'Book' }
        ]
      }
    }
    const b = {
      order: {
        id: 100,
        items: [
          { sku: 'A1', name: 'Book' },
          { sku: 'B2', name: 'Pen' }
        ]
      }
    }
    expect(json.isEqual(a, b)).toBe(true)
  })

  it('detect value change in nested object', () => {
    const a = { order: { id: 100, customer: { name: 'Alice' } } }
    const b = { order: { id: 100, customer: { name: 'Bob' } } }
    expect(json.isEqual(a, b)).toBe(false)
  })

  it('ignore specific keys', () => {
    const a = { id: 1, token: 'abc', name: 'Alice' }
    const b = { id: 2, token: 'def', name: 'Alice' }
    expect(json.isEqual(a, b, { ignoredKeys: ['id', 'token'] })).toBe(true)
  })
})

describe('json.compare', () => {
  it('detect updated nested value', () => {
    const a = { order: { id: 100, customer: { name: 'Alice' } } }
    const b = { order: { id: 100, customer: { name: 'Bob' } } }
    const result = json.compare(a, b)
    expect(result.isEqual).toBe(false)
    expect(result.differences.updated[0].path).toBe('order.customer.name')
  })

  it('detect extra and missing properties', () => {
    const a = { order: { id: 100, status: 'pending' } }
    const b = { order: { id: 100, priority: 'high' } }
    const result = json.compare(a, b)
    expect(result.isEqual).toBe(false)
    expect(result.differences.extra).toContain('order.priority')
    expect(result.differences.missing).toContain('order.status')
  })
})

describe('json file comparison', () => {
  const file1 = './test1.json'
  const file2 = './test2.json'

  it('object vs file with array order changed', () => {
    const obj = {
      order: {
        id: 100,
        items: [
          { sku: 'B2', name: 'Pen' },
          { sku: 'A1', name: 'Book' }
        ]
      }
    }
    fs.writeFileSync(file1, JSON.stringify(obj, null, 2))
    const result = json.isEqualFile(obj, file1)
    expect(result).toBe(true)
    fs.unlinkSync(file1)
  })

  it('file vs file identical with different array order', () => {
    const obj1 = {
      order: {
        id: 100,
        items: [
          { sku: 'B2', name: 'Pen' },
          { sku: 'A1', name: 'Book' }
        ]
      }
    }
    const obj2 = {
      order: {
        id: 100,
        items: [
          { sku: 'A1', name: 'Book' },
          { sku: 'B2', name: 'Pen' }
        ]
      }
    }
    fs.writeFileSync(file1, JSON.stringify(obj1, null, 2))
    fs.writeFileSync(file2, JSON.stringify(obj2, null, 2))
    const result = json.isEqualFiles(file1, file2)
    expect(result).toBe(true)
    fs.unlinkSync(file1)
    fs.unlinkSync(file2)
  })
})
