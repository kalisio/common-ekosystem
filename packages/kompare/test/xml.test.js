import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import { xml } from '../src/xml.js'

describe('xml.isEqual', () => {
  it('identical structured XML', () => {
    const a = `
<order>
  <id>100</id>
  <customer>
    <name>Alice</name>
    <country>FR</country>
  </customer>
  <items>
    <item sku="A1">Book</item>
    <item sku="B2">Pen</item>
  </items>
</order>
`
    const b = `
<order>
  <id>100</id>
  <customer>
    <name>Alice</name>
    <country>FR</country>
  </customer>
  <items>
    <item sku="A1">Book</item>
    <item sku="B2">Pen</item>
  </items>
</order>
`
    expect(xml.isEqual(a, b)).toBe(true)
  })

  it('detect value change in nested element', () => {
    const a = `
<order>
  <id>100</id>
  <customer>
    <name>Alice</name>
  </customer>
</order>
`
    const b = `
<order>
  <id>100</id>
  <customer>
    <name>Bob</name>
  </customer>
</order>
`
    expect(xml.isEqual(a, b)).toBe(false)
  })

  it('ignore case option in element text', () => {
    const a = '<status><state>Active</state></status>'
    const b = '<status><state>active</state></status>'
    expect(xml.isEqual(a, b, { ignoreCase: true })).toBe(true)
  })
})

describe('xml.compare', () => {
  it('detect updated nested element', () => {
    const a = `
<order>
  <id>100</id>
  <customer>
    <name>Alice</name>
  </customer>
</order>
`
    const b = `
<order>
  <id>100</id>
  <customer>
    <name>Bob</name>
  </customer>
</order>
`
    const result = xml.compare(a, b)
    expect(result.isEqual).toBe(false)
    expect(result.differences.updated[0].path).toBe('order.customer.name')
  })

  it('detect extra element', () => {
    const a = `
<order>
  <id>100</id>
</order>
`
    const b = `
<order>
  <id>100</id>
  <status>shipped</status>
</order>
`
    const result = xml.compare(a, b)
    expect(result.isEqual).toBe(false)
    expect(result.differences.extra).toContain('order.status')
  })

  it('detect missing element', () => {
    const a = `
<order>
  <id>100</id>
  <status>shipped</status>
</order>
`
    const b = `
<order>
  <id>100</id>
</order>
`
    const result = xml.compare(a, b)
    expect(result.isEqual).toBe(false)
    expect(result.differences.missing).toContain('order.status')
  })
})

describe('xml file comparison', () => {
  const file1 = './test1.xml'
  const file2 = './test2.xml'

  it('string vs file with structured XML', () => {
    const content = `
<order>
  <id>100</id>
  <customer>
    <name>Alice</name>
  </customer>
</order>
`
    fs.writeFileSync(file1, content)
    const result = xml.isEqualFile(content, file1)
    expect(result).toBe(true)
    fs.unlinkSync(file1)
  })

  it('file vs file with identical structured XML', () => {
    const content = `
<order>
  <id>100</id>
  <customer>
    <name>Alice</name>
  </customer>
</order>
`
    fs.writeFileSync(file1, content)
    fs.writeFileSync(file2, content)
    const result = xml.isEqualFiles(file1, file2)
    expect(result).toBe(true)
    fs.unlinkSync(file1)
    fs.unlinkSync(file2)
  })
})
