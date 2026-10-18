import { xml } from '../../src/io/xml.js'
import { dom } from '../../src/utilities/index.js'

const XML = `
<Root xmlns:ows="urn:example:ows" xmlns:xlink="http://www.w3.org/1999/xlink">
  <ows:Title> Main title </ows:Title>
  <Group><ows:Title> Nested title </ows:Title></Group>
  <Value>42.5</Value>
  <Zero>0</Zero>
  <Negative>-12</Negative>
  <Invalid>abc</Invalid>
  <Infinite>Infinity</Infinite>
  <Empty> </Empty>
  <Resource xlink:href="https://example.com/resource" />
  <Direct href="https://example.com/direct" />
  <Both href="plain" xlink:href="qualified" />
  <EmptyAttribute href="" />
</Root>`

let root
beforeAll(async () => {
  const document = await xml.parse(XML, { output: 'dom' })
  root = document.documentElement
})

describe('dom.children', () => {
  it('should return direct element children only', () => {
    const result = dom.children(root)
    expect(result).toHaveLength(12)
    expect(result.every(node => node.nodeType === 1)).toBe(true)
  })
  it('should filter children by local name', () => {
    const result = dom.children(root, 'Title')
    expect(result).toHaveLength(1)
    expect(dom.text(result[0])).toBe('Main title')
  })
  it('should support prefixed elements', () => {
    const result = dom.children(root, 'Title')
    expect(result[0].nodeName).toBe('ows:Title')
  })
  it('should not include nested descendants', () => {
    expect(dom.children(root, 'Title')).toHaveLength(1)
    expect(dom.children(dom.child(root, 'Group'), 'Title')).toHaveLength(1)
  })
  it('should return an empty array when no element matches', () => {
    expect(dom.children(root, 'Unknown')).toEqual([])
  })
  it('should accept missing nodes', () => {
    expect(dom.children(null)).toEqual([])
    expect(dom.children(undefined, 'Title')).toEqual([])
  })
  it('should reject invalid nodes', () => {
    expect(() => dom.children(42)).toThrow()
    expect(() => dom.children('hello')).toThrow()
    expect(() => dom.children({})).toThrow()
    expect(() => dom.children([])).toThrow()
  })
  it('should reject invalid names', () => {
    expect(() => dom.children(root, '')).toThrow()
    expect(() => dom.children(root, 42)).toThrow()
  })
})

describe('dom.child', () => {
  it('should return the first matching direct child', () => {
    expect(dom.text(dom.child(root, 'Title'))).toBe('Main title')
  })
  it('should return the first element when no name is provided', () => {
    expect(dom.child(root).localName).toBe('Title')
  })
  it('should ignore nested descendants', () => {
    expect(dom.child(root, 'Title').parentNode).toBe(root)
    expect(dom.text(dom.child(dom.child(root, 'Group'), 'Title'))).toBe('Nested title')
  })
  it('should return null when no element matches', () => {
    expect(dom.child(root, 'Unknown')).toBeNull()
  })
  it('should accept missing nodes', () => {
    expect(dom.child(null, 'Title')).toBeNull()
    expect(dom.child(undefined)).toBeNull()
  })
  it('should reject invalid arguments', () => {
    expect(() => dom.child(42)).toThrow()
    expect(() => dom.child(root, '')).toThrow()
    expect(() => dom.child(root, 42)).toThrow()
  })
})

describe('dom.text', () => {
  it('should extract trimmed text content', () => {
    expect(dom.text(dom.child(root, 'Title'))).toBe('Main title')
  })
  it('should include descendant text content', () => {
    expect(dom.text(dom.child(root, 'Group'))).toBe('Nested title')
  })
  it('should return an empty string for empty content', () => {
    expect(dom.text(dom.child(root, 'Empty'))).toBe('')
  })
  it('should accept missing nodes', () => {
    expect(dom.text(null)).toBeUndefined()
    expect(dom.text(undefined)).toBeUndefined()
    expect(dom.text(dom.child(root, 'Unknown'))).toBeUndefined()
  })
  it('should reject invalid nodes', () => {
    expect(() => dom.text(42)).toThrow()
    expect(() => dom.text('hello')).toThrow()
    expect(() => dom.text({})).toThrow()
    expect(() => dom.text([])).toThrow()
  })
})

describe('dom.number', () => {
  it('should extract a numeric value', () => {
    expect(dom.number(dom.child(root, 'Value'))).toBe(42.5)
  })
  it('should support zero and negative numbers', () => {
    expect(dom.number(dom.child(root, 'Zero'))).toBe(0)
    expect(dom.number(dom.child(root, 'Negative'))).toBe(-12)
  })
  it('should reject non-numeric values', () => {
    expect(dom.number(dom.child(root, 'Invalid'))).toBeUndefined()
  })
  it('should reject non-finite values', () => {
    expect(dom.number(dom.child(root, 'Infinite'))).toBeUndefined()
  })
  it('should return undefined for empty content', () => {
    expect(dom.number(dom.child(root, 'Empty'))).toBeUndefined()
  })
  it('should accept missing nodes', () => {
    expect(dom.number(null)).toBeUndefined()
    expect(dom.number(undefined)).toBeUndefined()
  })
  it('should reject invalid nodes', () => {
    expect(() => dom.number(42)).toThrow()
    expect(() => dom.number({})).toThrow()
    expect(() => dom.number([])).toThrow()
  })
})

describe('dom.attribute', () => {
  it('should read an unqualified attribute', () => {
    expect(dom.attribute(dom.child(root, 'Direct'), 'href')).toBe('https://example.com/direct')
  })
  it('should find a namespaced attribute by local name', () => {
    expect(dom.attribute(dom.child(root, 'Resource'), 'href')).toBe('https://example.com/resource')
  })
  it('should accept a qualified attribute name', () => {
    expect(dom.attribute(dom.child(root, 'Resource'), 'xlink:href')).toBe('https://example.com/resource')
  })
  it('should prefer an exact attribute match', () => {
    const node = dom.child(root, 'Both')
    expect(dom.attribute(node, 'href')).toBe('plain')
    expect(dom.attribute(node, 'xlink:href')).toBe('qualified')
  })
  it('should preserve an empty attribute value', () => {
    expect(dom.attribute(dom.child(root, 'EmptyAttribute'), 'href')).toBe('')
  })
  it('should return undefined for a missing attribute', () => {
    expect(dom.attribute(dom.child(root, 'Resource'), 'unknown')).toBeUndefined()
  })
  it('should accept missing nodes', () => {
    expect(dom.attribute(null, 'href')).toBeUndefined()
    expect(dom.attribute(undefined, 'href')).toBeUndefined()
  })
  it('should reject invalid nodes', () => {
    expect(() => dom.attribute(42, 'href')).toThrow()
    expect(() => dom.attribute('hello', 'href')).toThrow()
    expect(() => dom.attribute({}, 'href')).toThrow()
  })
  it('should reject invalid attribute names', () => {
    expect(() => dom.attribute(root, '')).toThrow()
    expect(() => dom.attribute(root, null)).toThrow()
    expect(() => dom.attribute(root, 42)).toThrow()
  })
})
