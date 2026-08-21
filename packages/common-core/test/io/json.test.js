import { describe, it, expect } from 'vitest'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { json } from '../../src/io/index.js'

const dataDir = join(dirname(fileURLToPath(import.meta.url)), 'data')
const fixture = (name) => join(dataDir, name)

describe('json.parse', () => {
  it('parses a real JSON object fixture', async () => {
    const object = json.parse(await readFile(fixture('object.json'), 'utf-8'))
    expect(object).toMatchObject({
      name: 'station-01',
      active: true,
      count: 3,
      tags: ['a', 'b'],
      location: { lon: 2.35, lat: 48.85 }
    })
  })
  it('parses a top-level array fixture', async () => {
    expect(json.parse(await readFile(fixture('collection.json'), 'utf-8'))).toEqual([1, 2, 3])
  })
  it('parses JSON primitive values', () => {
    expect(json.parse('null')).toBeNull()
    expect(json.parse('true')).toBe(true)
    expect(json.parse('42')).toBe(42)
    expect(json.parse('"value"')).toBe('value')
  })
  it('applies a reviver', () => {
    expect(json.parse('{"a":1}', { reviver: (key, value) => (key === 'a' ? value + 1 : value) })).toEqual({ a: 2 })
  })
  it('throws PARSE_FAILED with a SyntaxError cause on invalid JSON', async () => {
    const text = await readFile(fixture('invalid.json'), 'utf-8')
    expect(() => json.parse(text)).toThrow(expect.objectContaining({
      code: json.ERROR_CODES.PARSE_FAILED,
      cause: expect.any(SyntaxError)
    }))
  })
  it('rejects a non-string input', () => {
    expect(() => json.parse(42)).toThrowError()
  })
  it('rejects invalid options', () => {
    expect(() => json.parse('{}', { reviver: true })).toThrowError()
  })
})

describe('json.read', () => {
  it('reads and parses a JSON fixture from a path', async () => {
    expect(await json.read(fixture('object.json'))).toMatchObject({ name: 'station-01' })
  })
  it('propagates a parse failure from a fixture', async () => {
    await expect(json.read(fixture('invalid.json'))).rejects.toMatchObject({
      code: json.ERROR_CODES.PARSE_FAILED,
      cause: expect.any(SyntaxError)
    })
  })
  it('propagates source errors', async () => {
    await expect(json.read(fixture('does-not-exist.csv'))).rejects.toMatchObject({ code: json.ERROR_CODES.READ_FAILED })
  })
})
