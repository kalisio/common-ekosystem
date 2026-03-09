import { describe, it, expect, afterAll } from 'vitest'
import { xml } from '../src/index.js'
import fs from 'fs'
import path from 'path'

describe('xml.isEqual', () => {
  const sourcePath = path.join(__dirname, 'source_xml.xml')
  const targetPath = path.join(__dirname, 'target_xml.xml')

  afterAll(() => {
    if (fs.existsSync(sourcePath)) fs.unlinkSync(sourcePath)
    if (fs.existsSync(targetPath)) fs.unlinkSync(targetPath)
  })

  it('should return true for identical strings', () => {
    const content = '<root><node>value</node></root>'
    expect(xml.isEqual(content, content)).toBe(true)
  })

  it('should return false for different strings', () => {
    const baseline = '<status>SUCCESS</status>'
    const current = '<status>FAILURE</status>'
    expect(xml.isEqual(baseline, current)).toBe(false)
  })

  it('should ignore case when ignoreCase is true', () => {
    const referenceLabel = '<tag>Value</tag>'
    const inputLabel = '<tag>value</tag>'
    expect(xml.isEqual(referenceLabel, inputLabel, { ignoreCase: true })).toBe(true)
    expect(xml.isEqual(referenceLabel, inputLabel, { ignoreCase: false })).toBe(false)
  })

  it('should ignore surrounding spaces when ignoreSpaces is true', () => {
    const sanitized = '<root>data</root>'
    const raw = '  <root>data</root>  '
    expect(xml.isEqual(sanitized, raw, { ignoreSpaces: true })).toBe(true)
  })

  it('should ignore accents when ignoreAccents is true', () => {
    const localized = '<item>café</item>'
    const normalized = '<item>cafe</item>'
    expect(xml.isEqual(localized, normalized, { ignoreAccents: true })).toBe(true)
  })

  it('should validate structural equality (attributes order)', () => {
    const xml1 = '<user id="1" active="true"/>'
    const xml2 = '<user active="true" id="1"/>'
    expect(xml.isEqual(xml1, xml2)).toBe(true)
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

  it('should return precise differences when XML does not match', () => {
    const xml1 = '<user name="henri" age="19"/>'
    const xml2 = '<user name="henri" age="20"/>'
    const result = xml.compare(xml1, xml2)
    expect(result.isEqual).toBe(false)
    expect(result.differences.updated[0]).toMatchObject({
      path: 'user.age',
      oldValue: '19',
      newValue: '20'
    })
  })
})
