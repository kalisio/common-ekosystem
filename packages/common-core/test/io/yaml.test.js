import { describe, it, expect } from 'vitest'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { FAILSAFE_SCHEMA } from 'js-yaml'
import { yaml } from '../../src/io/yaml.js'

const fixture = (name) => fileURLToPath(
  new URL(`./fixtures/${name}`, import.meta.url)
)

describe('yaml.parse', () => {
  it('parses YAML into an object', () => {
    expect(yaml.parse('note:\n  to: World\n')).toEqual({
      note: {
        to: 'World'
      }
    })
  })
  it('parses scalars with their native types', () => {
    expect(yaml.parse('count: 42\nenabled: true\n')).toEqual({
      count: 42,
      enabled: true
    })
  })
  it('parses a real YAML fixture', async () => {
    const result = yaml.parse(await readFile(fixture('note.yaml'), 'utf-8'))
    expect(result.note.category).toBe('reminder')
    expect(result.note.to).toBe('World')
  })
  it('decodes special characters', async () => {
    const result = yaml.parse(await readFile(fixture('note.yaml'), 'utf-8'))
    expect(result.note.body).toBe('Hello & welcome')
  })
  it('supports parser options', () => {
    // FAILSAFE_SCHEMA resolves every scalar as a string
    const result = yaml.parse('value: 42', {
      parser: { schema: FAILSAFE_SCHEMA }
    })
    expect(result.value).toBe('42')
  })
  it('wraps malformed YAML as PARSE_FAILED', () => {
    let error
    try {
      yaml.parse('note: [unclosed')
    } catch (cause) {
      error = cause
    }
    expect(error?.code).toBe(yaml.ERROR_CODES.PARSE_FAILED)
  })
  it('exposes the underlying error as cause', () => {
    let error
    try {
      yaml.parse('note: [unclosed')
    } catch (cause) {
      error = cause
    }
    expect(error?.cause).toBeInstanceOf(Error)
  })
  it('rejects a non-string input', () => {
    expect(() => yaml.parse(42)).toThrowError()
  })
  it('rejects an invalid parser option', () => {
    expect(() => yaml.parse('a: 1', { parser: 'nope' })).toThrowError()
  })
})

describe('yaml.read', () => {
  it('reads and parses a YAML fixture', async () => {
    const result = await yaml.read(fixture('note.yaml'))
    expect(result.note.from).toBe('Kalisio')
  })
  it('propagates source errors', async () => {
    await expect(yaml.read(fixture('does-not-exist.yaml'))).rejects.toMatchObject({
      code: yaml.ERROR_CODES.READ_FAILED
    })
  })
})
