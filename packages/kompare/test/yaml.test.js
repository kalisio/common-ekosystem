import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import { yaml } from '../src/yaml.js'

describe('yaml.isEqual', () => {
  it('identical structured YAML', () => {
    const a = `
order:
  id: 100
  customer:
    name: Alice
    country: FR
  items:
    - sku: A1
      name: Book
    - sku: B2
      name: Pen
`
    const b = `
order:
  id: 100
  customer:
    name: Alice
    country: FR
  items:
    - sku: A1
      name: Book
    - sku: B2
      name: Pen
`
    expect(yaml.isEqual(a, b)).toBe(true)
  })

  it('detect value change in nested object', () => {
    const a = `
order:
  id: 100
  customer:
    name: Alice
    country: FR
`
    const b = `
order:
  id: 100
  customer:
    name: Alice
    country: US
`
    expect(yaml.isEqual(a, b)).toBe(false)
  })

  it('ignore case option for structured YAML', () => {
    const a = `
status:
  state: Active
`
    const b = `
status:
  state: active
`
    expect(yaml.isEqual(a, b, { ignoreCase: true })).toBe(true)
  })
})

describe('yaml.compare', () => {
  it('detect updated nested value', () => {
    const a = `
order:
  id: 100
  customer:
    name: Alice
`
    const b = `
order:
  id: 100
  customer:
    name: Bob
`
    const result = yaml.compare(a, b)
    expect(result.isEqual).toBe(false)
    expect(result.differences.updated[0].path).toBe('order.customer.name')
  })

  it('detect extra property in object', () => {
    const a = `
order:
  id: 100
`
    const b = `
order:
  id: 100
  status: shipped
`
    const result = yaml.compare(a, b)
    expect(result.isEqual).toBe(false)
    expect(result.differences.extra).toContain('order.status')
  })

  it('detect missing property', () => {
    const a = `
order:
  id: 100
  status: shipped
`
    const b = `
order:
  id: 100
`
    const result = yaml.compare(a, b)
    expect(result.isEqual).toBe(false)
    expect(result.differences.missing).toContain('order.status')
  })
})

describe('yaml file comparison', () => {
  const file1 = './test1.yaml'
  const file2 = './test2.yaml'

  it('string vs file with structured YAML', () => {
    const content = `
order:
  id: 100
  customer:
    name: Alice
`
    fs.writeFileSync(file1, content)
    const result = yaml.isEqualFile(content, file1)
    expect(result).toBe(true)
    fs.unlinkSync(file1)
  })

  it('file vs file with identical structured YAML', () => {
    const content = `
order:
  id: 100
  customer:
    name: Alice
`
    fs.writeFileSync(file1, content)
    fs.writeFileSync(file2, content)
    const result = yaml.isEqualFiles(file1, file2)
    expect(result).toBe(true)
    fs.unlinkSync(file1)
    fs.unlinkSync(file2)
  })
})
