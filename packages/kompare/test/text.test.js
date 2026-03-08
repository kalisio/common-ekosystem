import { describe, it, expect, afterAll } from 'vitest'
import { text } from '../src/index.js'
import fs from 'fs'
import path from 'path'

describe('text.isEqual', () => {
  const sourcePath = path.join(__dirname, 'source_dataset.txt')
  const targetPath = path.join(__dirname, 'target_dataset.txt')

  afterAll(() => {
    if (fs.existsSync(sourcePath)) fs.unlinkSync(sourcePath)
    if (fs.existsSync(targetPath)) fs.unlinkSync(targetPath)
  })

  it('should return true for identical strings', () => {
    const content = 'Kalisio common-ekosystem'
    expect(text.isEqual(content, content)).toBe(true)
  })

  it('should return false for different strings', () => {
    const baseline = 'OPERATION_SUCCESSFUL'
    const current = 'OPERATION_FAILED'
    expect(text.isEqual(baseline, current)).toBe(false)
  })

  it('should ignore case when ignoreCase is true', () => {
    const referenceLabel = 'INTERNAL_SERVER_ERROR'
    const inputLabel = 'internal_server_error'
    expect(text.isEqual(referenceLabel, inputLabel, { ignoreCase: true })).toBe(true)
    expect(text.isEqual(referenceLabel, inputLabel, { ignoreCase: false })).toBe(false)
  })

  it('should ignore surrounding spaces when ignoreSpaces is true', () => {
    const sanitizedEmail = 'admin@kalisio.com'
    const rawEmail = '  admin@kalisio.com  '
    expect(text.isEqual(sanitizedEmail, rawEmail, { ignoreSpaces: true })).toBe(true)
    expect(text.isEqual(sanitizedEmail, rawEmail, { ignoreSpaces: false })).toBe(false)
  })

  it('should ignore accents when ignoreAccents is true', () => {
    const localizedHeader = 'résumé' //
    const normalizedHeader = 'resume'
    expect(text.isEqual(localizedHeader, normalizedHeader, { ignoreAccents: true })).toBe(true)
    expect(text.isEqual(localizedHeader, normalizedHeader, { ignoreAccents: false })).toBe(false)
  })

  it('should combine options correctly', () => {
    const unformattedInput = '  RÉSUMÉ  '
    const expectedOutput = 'resume'
    const options = { ignoreCase: true, ignoreSpaces: true, ignoreAccents: true }
    expect(text.isEqual(unformattedInput, expectedOutput, options)).toBe(true)
  })

  it('should validate file comparison methods', () => {
    const rawData = '  Kalisio Dataset  '
    const processedData = 'kalisio dataset'

    fs.writeFileSync(sourcePath, rawData)
    fs.writeFileSync(targetPath, processedData)

    const comparisonOptions = { ignoreSpaces: true, ignoreCase: true }

    expect(text.isEqualFile(processedData, sourcePath, comparisonOptions)).toBe(true)
    expect(text.isEqualFiles(sourcePath, targetPath, comparisonOptions)).toBe(true)

    const result = text.compare(rawData, rawData)
    expect(result.isEqual).toBe(true)
  })

  it('should return false if strings differ after normalization', () => {
    const statusReady = 'system-ready'
    const statusPending = 'system-pending'
    expect(text.isEqual(statusReady, statusPending, { ignoreCase: true, ignoreAccents: true })).toBe(false)
  })

  it('should return differences when texts do not match', () => {
    const t1 = 'Hello World'
    const t2 = 'Goodbye World'
    const result = text.compare(t1, t2)

    expect(result.isEqual).toBe(false)
    expect(result.differences.updated[0]).toMatchObject({
      oldValue: t1,
      newValue: t2
    })
  })
})
