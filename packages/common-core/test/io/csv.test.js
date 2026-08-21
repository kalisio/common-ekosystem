import { describe, it, expect } from 'vitest'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { csv } from '../../src/io/index.js'

const dataDir = join(dirname(fileURLToPath(import.meta.url)), 'data')
const fixture = (name) => join(dataDir, name)
const text = (name) => readFile(fixture(name), 'utf-8')

describe('csv.parse', () => {
  it('returns the full papaparse result', async () => {
    const result = csv.parse(await text('points.csv'))
    expect(result).toHaveProperty('data')
    expect(result).toHaveProperty('errors')
    expect(result).toHaveProperty('meta')
  })
  it('parses rows as objects with the header option and keeps values as strings', async () => {
    const { data } = csv.parse(await text('points.csv'), { header: true, skipEmptyLines: true })
    expect(data).toEqual([
      { name: 'Paris', lon: '2.35', lat: '48.85', active: 'true' },
      { name: 'Lyon', lon: '4.83', lat: '45.76', active: 'false' }
    ])
  })
  it('counts a trailing empty line as a row when skipEmptyLines is off', async () => {
    const { data } = csv.parse(await text('points.csv'), { header: true })
    expect(data).toHaveLength(3)
  })
  it('honors a custom delimiter', async () => {
    const { data } = csv.parse(await text('semicolon.csv'), { header: true, delimiter: ';', skipEmptyLines: true })
    expect(data).toEqual([{ name: 'alpha', value: '10' }, { name: 'beta', value: '20' }])
  })
  it('handles quoted fields with embedded commas and escaped quotes', async () => {
    const { data } = csv.parse(await text('quoted.csv'), { header: true, skipEmptyLines: true })
    expect(data[0]).toEqual({ name: 'Doe, John', note: 'he said "hi"' })
  })
  it('surfaces field-mismatch errors on ragged rows', async () => {
    const { errors } = csv.parse(await text('ragged.csv'), { header: true, skipEmptyLines: true })
    const codes = errors.map((error) => error.code)
    expect(codes).toContain('TooFewFields')
    expect(codes).toContain('TooManyFields')
  })
  it('supports greedy empty-line skipping', () => {
    const { data } = csv.parse('a,b\n1,2\n   \n3,4\n', { header: true, skipEmptyLines: 'greedy' })
    expect(data).toEqual([{ a: '1', b: '2' }, { a: '3', b: '4' }])
  })
  it('rejects a non-string input', () => {
    expect(() => csv.parse(42)).toThrowError()
  })
  it('rejects invalid options', () => {
    expect(() => csv.parse('a,b', { header: 'yes' })).toThrowError()
    expect(() => csv.parse('a,b', { delimiter: 42 })).toThrowError()
    expect(() => csv.parse('a,b', { skipEmptyLines: 'yes' })).toThrowError()
  })
})

describe('csv.read', () => {
  it('reads and parses a CSV fixture from a path', async () => {
    const { data } = await csv.read(fixture('points.csv'), { header: true, skipEmptyLines: true })
    expect(data).toHaveLength(2)
    expect(data[0].name).toBe('Paris')
  })
  it('propagates a source read failure', async () => {
    await expect(csv.read(fixture('does-not-exist.csv'))).rejects.toMatchObject({ code: csv.ERROR_CODES.READ_FAILED })
  })
  it('propagates source errors', async () => {
    await expect(csv.read(fixture('does-not-exist.csv'))).rejects.toMatchObject({ code: csv.ERROR_CODES.READ_FAILED })
  })
})
