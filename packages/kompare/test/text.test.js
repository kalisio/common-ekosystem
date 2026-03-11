import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import { text } from '../src/text.js'

describe('text.isEqual', () => {
  it('identical strings', () => {
    const a = 'Hello World'
    const b = 'Hello World'
    expect(text.isEqual(a, b)).toBe(true)
  })

  it('different case without ignoreCase', () => {
    const a = 'Hello'
    const b = 'hello'
    expect(text.isEqual(a, b)).toBe(false)
  })

  it('different case with ignoreCase', () => {
    const a = 'Hello'
    const b = 'hello'
    expect(text.isEqual(a, b, { ignoreCase: true })).toBe(true)
  })

  it('ignore spaces', () => {
    const a = '  Hello '
    const b = 'Hello'
    expect(text.isEqual(a, b, { ignoreSpaces: true })).toBe(true)
  })

  it('ignore accents', () => {
    const a = 'École'
    const b = 'ecole'
    expect(text.isEqual(a, b, { ignoreCase: true, ignoreAccents: true })).toBe(true)
  })
})

describe('text file comparison', () => {
  const file1 = './test1.txt'
  const file2 = './test2.txt'

  it('string vs file', () => {
    const content = 'Hello World'
    fs.writeFileSync(file1, content)
    const result = text.isEqualFile(content, file1)
    expect(result).toBe(true)
    fs.unlinkSync(file1)
  })

  it('file vs file', () => {
    const content1 = '  Hello '
    const content2 = 'hello'
    fs.writeFileSync(file1, content1)
    fs.writeFileSync(file2, content2)
    const result = text.isEqualFiles(file1, file2, { ignoreSpaces: true, ignoreCase: true })
    expect(result).toBe(true)
    fs.unlinkSync(file1)
    fs.unlinkSync(file2)
  })
})
