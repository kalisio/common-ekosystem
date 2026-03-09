import { describe, it, expect, afterAll } from 'vitest'
import { yaml } from '../src/index.js'
import fs from 'fs'
import path from 'path'

describe('yaml.isEqual', () => {
  const sourcePath = path.join(__dirname, 'source_yaml.yaml')
  const targetPath = path.join(__dirname, 'target_yaml.yaml')

  afterAll(() => {
    if (fs.existsSync(sourcePath)) fs.unlinkSync(sourcePath)
    if (fs.existsSync(targetPath)) fs.unlinkSync(targetPath)
  })

  it('should return true for identical strings', () => {
    const content = 'project: kalisio-common-ekosystem'
    expect(yaml.isEqual(content, content)).toBe(true)
  })

  it('should return false for different strings', () => {
    const baseline = 'status: SUCCESS'
    const current = 'status: FAILURE'
    expect(yaml.isEqual(baseline, current)).toBe(false)
  })

  it('should ignore case when ignoreCase is true', () => {
    const referenceLabel = 'label: Value'
    const inputLabel = 'label: value'
    expect(yaml.isEqual(referenceLabel, inputLabel, { ignoreCase: true })).toBe(true)
    expect(yaml.isEqual(referenceLabel, inputLabel, { ignoreCase: false })).toBe(false)
  })

  it('should ignore surrounding spaces when ignoreSpaces is true', () => {
    const sanitized = 'name: kalisio'
    const raw = '  name: kalisio  '
    expect(yaml.isEqual(sanitized, raw, { ignoreSpaces: true })).toBe(true)
  })

  it('should ignore accents when ignoreAccents is true', () => {
    const localized = 'item: café'
    const normalized = 'item: cafe'
    expect(yaml.isEqual(localized, normalized, { ignoreAccents: true })).toBe(true)
  })

  it('should validate structural equality (keys order)', () => {
    const y1 = 'id: 1\nactive: true'
    const y2 = 'active: true\nid: 1'
    expect(yaml.isEqual(y1, y2)).toBe(true)
  })

  it('should validate file comparison methods', () => {
    const rawData = '  name: Kalisio  '
    const processedData = 'name: kalisio'
    fs.writeFileSync(sourcePath, rawData)
    fs.writeFileSync(targetPath, processedData)
    const options = { ignoreSpaces: true, ignoreCase: true }
    expect(yaml.isEqualFile(processedData, sourcePath, options)).toBe(true)
    expect(yaml.isEqualFiles(sourcePath, targetPath, options)).toBe(true)
    const result = yaml.compare(rawData, rawData, options)
    expect(result.isEqual).toBe(true)
  })

  it('should return precise differences when YAML does not match', () => {
    const y1 = 'user:\n  name: henri\n  age: 19'
    const y2 = 'user:\n  name: henri\n  age: 20'
    const result = yaml.compare(y1, y2)
    expect(result.isEqual).toBe(false)
    expect(result.differences.updated[0]).toMatchObject({
      path: 'user.age',
      oldValue: 19,
      newValue: 20
    })
  })
})
