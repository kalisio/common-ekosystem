import { describe, it, expect, afterAll } from 'vitest'
import { yaml } from '../src/index.js'
import fs from 'fs'
import path from 'path'

describe('yaml.isEqual', () => {
  const sourcePath = path.join(__dirname, 'source_dataset.yaml')
  const targetPath = path.join(__dirname, 'target_dataset.yaml')

  it('should return true for identical strings', () => {
    const content = 'project: kalisio-common-ekosystem'
    expect(yaml.isEqual(content, content)).toBe(true)
  })

  it('should return false for different strings', () => {
    const baseline = 'status: OPERATION_SUCCESSFUL'
    const current = 'status: OPERATION_FAILED'
    expect(yaml.isEqual(baseline, current)).toBe(false)
  })

  it('should ignore case when ignoreCase is true', () => {
    const referenceLabel = 'error: INTERNAL_SERVER_ERROR'
    const inputLabel = 'error: internal_server_error'
    expect(yaml.isEqual(referenceLabel, inputLabel, { ignoreCase: true })).toBe(true)
    expect(yaml.isEqual(referenceLabel, inputLabel, { ignoreCase: false })).toBe(false)
  })

  it('should ignore surrounding spaces when ignoreSpaces is true', () => {
    const sanitizedEmail = 'email: admin@kalisio.com'
    const rawEmail = '  email: admin@kalisio.com  '
    expect(yaml.isEqual(sanitizedEmail, rawEmail, { ignoreSpaces: true })).toBe(true)
    expect(yaml.isEqual(sanitizedEmail, rawEmail, { ignoreSpaces: false })).toBe(false)
  })

  it('should ignore accents when ignoreAccents is true', () => {
    const localizedHeader = 'title: résumé'
    const normalizedHeader = 'title: resume'
    expect(yaml.isEqual(localizedHeader, normalizedHeader, { ignoreAccents: true })).toBe(true)
    expect(yaml.isEqual(localizedHeader, normalizedHeader, { ignoreAccents: false })).toBe(false)
  })

  it('should combine options correctly', () => {
    const unformattedInput = '  title: RÉSUMÉ  '
    const expectedOutput = 'title: resume'
    const options = { ignoreCase: true, ignoreSpaces: true, ignoreAccents: true }
    expect(yaml.isEqual(unformattedInput, expectedOutput, options)).toBe(true)
  })

  it('should validate file comparison methods', () => {
    const rawData = '  name: Kalisio Dataset  '
    const processedData = 'name: kalisio dataset'

    fs.writeFileSync(sourcePath, rawData)
    fs.writeFileSync(targetPath, processedData)

    const comparisonOptions = { ignoreSpaces: true, ignoreCase: true }

    expect(yaml.isEqualFile(processedData, sourcePath, comparisonOptions)).toBe(true)
    expect(yaml.isEqualFiles(sourcePath, targetPath, comparisonOptions)).toBe(true)

    const result = yaml.compare(rawData, rawData)
    expect(result.isEqual).toBe(true)
  })

  it('should return false if strings differ after normalization', () => {
    const statusReady = 'system: ready'
    const statusPending = 'system: pending'
    expect(yaml.isEqual(statusReady, statusPending, { ignoreCase: true, ignoreAccents: true })).toBe(false)
  })

  afterAll(() => {
    if (fs.existsSync(sourcePath)) fs.unlinkSync(sourcePath)
    if (fs.existsSync(targetPath)) fs.unlinkSync(targetPath)
  })

  it('should return differences when texts do not match', () => {
    const y1 = 'greeting: Hello World'
    const y2 = 'greeting: Goodbye World'
    const result = yaml.compare(y1, y2)

    expect(result.isEqual).toBe(false)
    expect(result.differences.updated[0]).toMatchObject({
      path: 'yaml',
      oldValue: y1,
      newValue: y2
    })
  })
})
