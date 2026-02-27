import { describe, it, expect, afterAll } from 'vitest'
import { xml } from '../src/index.js'
import fs from 'fs'
import path from 'path'

describe('xml.isEqual', () => {
  const sourcePath = path.join(__dirname, 'source_xml.xml')
  const targetPath = path.join(__dirname, 'target_xml.xml')

  it('should return true for identical XML strings', () => {
    const content = '<root><node>value</node></root>'
    expect(xml.isEqual(content, content)).toBe(true)
  })

  it('should return false for different XML strings', () => {
    const xml1 = '<status>SUCCESS</status>'
    const xml2 = '<status>FAILURE</status>'
    expect(xml.isEqual(xml1, xml2)).toBe(false)
  })

  it('should ignore case when ignoreCase is true', () => {
    const xml1 = '<TAG>Value</TAG>'
    const xml2 = '<tag>value</tag>'
    expect(xml.isEqual(xml1, xml2, { ignoreCase: true })).toBe(true)
    expect(xml.isEqual(xml1, xml2, { ignoreCase: false })).toBe(false)
  })

  it('should ignore surrounding spaces when ignoreSpaces is true', () => {
    const xml1 = '<root>data</root>'
    const xml2 = '  <root>data</root>  '
    expect(xml.isEqual(xml1, xml2, { ignoreSpaces: true })).toBe(true)
    expect(xml.isEqual(xml1, xml2, { ignoreSpaces: false })).toBe(false)
  })

  it('should ignore accents when ignoreAccents is true', () => {
    const xml1 = '<item>café</item>'
    const xml2 = '<item>cafe</item>'
    expect(xml.isEqual(xml1, xml2, { ignoreAccents: true })).toBe(true)
    expect(xml.isEqual(xml1, xml2, { ignoreAccents: false })).toBe(false)
  })

  it('should validate file comparison methods', () => {
    const rawData = '  <root>Kalisio</root>  '
    const processedData = '<root>kalisio</root>'

    fs.writeFileSync(sourcePath, rawData)
    fs.writeFileSync(targetPath, processedData)

    const options = { ignoreSpaces: true, ignoreCase: true }

    expect(xml.isEqualFile(processedData, sourcePath, options)).toBe(true)
    expect(xml.isEqualFiles(sourcePath, targetPath, options)).toBe(true)

    const result = xml.compare(rawData, rawData, options)
    expect(result.isEqual).toBe(true)
  })

  it('should return differences when XML does not match', () => {
    const xml1 = '<version>1.0</version>'
    const xml2 = '<version>2.0</version>'
    const result = xml.compare(xml1, xml2)

    expect(result.isEqual).toBe(false)
    expect(result.differences.updated[0]).toMatchObject({
      path: 'xml',
      oldValue: xml1,
      newValue: xml2
    })
  })

  afterAll(() => {
    if (fs.existsSync(sourcePath)) fs.unlinkSync(sourcePath)
    if (fs.existsSync(targetPath)) fs.unlinkSync(targetPath)
  })
})
