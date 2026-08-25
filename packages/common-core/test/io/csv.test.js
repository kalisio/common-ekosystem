import { describe, it, expect } from 'vitest'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { csv } from '../../src/io/index.js'

const fixture = (name) => fileURLToPath(new URL(`./fixtures/${name}`, import.meta.url))
const text = (name) => readFile(fixture(name), 'utf8')

describe('csv.parse', () => {
  it('returns a normalized result with data, parseErrors and parseMeta', async () => {
    const result = csv.parse(await text('points.csv'))
    expect(result).toHaveProperty('data')
    expect(result).toHaveProperty('parseErrors')
    expect(result).toHaveProperty('parseMeta')
    expect(result).not.toHaveProperty('errors')
    expect(result).not.toHaveProperty('meta')
  })
  it('parses rows as arrays by default (no header)', async () => {
    const { data } = csv.parse(await text('points.csv'), { parser: { skipEmptyLines: true } })
    expect(data[0]).toEqual(['name', 'lon', 'lat', 'active'])
    expect(data[1]).toEqual(['Paris', '2.35', '48.85', 'true'])
  })
  it('parses rows as objects with header:true and keeps values as strings', async () => {
    const { data } = csv.parse(await text('points.csv'), { header: true, parser: { skipEmptyLines: true } })
    expect(data).toEqual([
      { name: 'Paris', lon: '2.35', lat: '48.85', active: 'true' },
      { name: 'Lyon', lon: '4.83', lat: '45.76', active: 'false' }
    ])
  })
  it('exposes parseMeta.fields with header:true', async () => {
    const { parseMeta } = csv.parse(await text('points.csv'), { header: true, parser: { skipEmptyLines: true } })
    expect(parseMeta.fields).toEqual(['name', 'lon', 'lat', 'active'])
  })
  it('counts a trailing empty line as a row when skipEmptyLines is off', async () => {
    const { data } = csv.parse(await text('points.csv'), { header: true })
    expect(data).toHaveLength(3)
  })
  it('honors a custom delimiter via parser', async () => {
    const { data } = csv.parse(await text('semicolon.csv'), { header: true, parser: { delimiter: ';', skipEmptyLines: true } })
    expect(data).toEqual([{ name: 'alpha', value: '10' }, { name: 'beta', value: '20' }])
  })
  it('handles quoted fields with embedded commas and escaped quotes', async () => {
    const { data } = csv.parse(await text('quoted.csv'), { header: true, parser: { skipEmptyLines: true } })
    expect(data[0]).toEqual({ name: 'Doe, John', note: 'he said "hi"' })
  })
  it('surfaces field-mismatch errors on ragged rows', async () => {
    const { parseErrors } = csv.parse(await text('ragged.csv'), { header: true, parser: { skipEmptyLines: true } })
    const codes = parseErrors.map((error) => error.code)
    expect(codes).toContain('TooFewFields')
    expect(codes).toContain('TooManyFields')
  })
  it('supports greedy empty-line skipping via parser', () => {
    const { data } = csv.parse('a,b\n1,2\n   \n3,4\n', { header: true, parser: { skipEmptyLines: 'greedy' } })
    expect(data).toEqual([{ a: '1', b: '2' }, { a: '3', b: '4' }])
  })
  it('rejects a non-string input', () => {
    expect(() => csv.parse(42)).toThrowError()
  })
  it('rejects invalid options', () => {
    expect(() => csv.parse('a,b', { header: 'yes' })).toThrowError()
    expect(() => csv.parse('a,b', { header: false })).toThrowError()
    expect(() => csv.parse('a,b', { parser: 42 })).toThrowError()
    expect(() => csv.parse('a,b', { rowSchema: 'nope' })).toThrowError()
  })
})

describe('csv.parse with a custom header', () => {
  it('maps every line to the given names, consuming no header line', () => {
    const { data } = csv.parse('name,lon\nParis,2.35', { header: ['a', 'b'] })
    expect(data).toEqual([{ a: 'name', b: 'lon' }, { a: 'Paris', b: '2.35' }])
  })
  it('sets parseMeta.fields to the provided header', () => {
    const { parseMeta } = csv.parse('Paris,2.35', { header: ['name', 'lon'] })
    expect(parseMeta.fields).toEqual(['name', 'lon'])
  })
  it('reports TooFewFields and leaves missing columns undefined', () => {
    const { data, parseErrors } = csv.parse('1,2', { header: ['x', 'y', 'z'] })
    expect(data[0]).toEqual({ x: '1', y: '2', z: undefined })
    expect(data[0].z).toBeUndefined()
    expect(parseErrors.map((error) => error.code)).toContain('TooFewFields')
  })
  it('reports TooManyFields and collects extras in __parsed_extra', () => {
    const { data, parseErrors } = csv.parse('1,2,3,4', { header: ['x', 'y', 'z'] })
    expect(data[0]).toEqual({ x: '1', y: '2', z: '3', __parsed_extra: ['4'] })
    expect(parseErrors.map((error) => error.code)).toContain('TooManyFields')
  })
  it('rejects a header array with duplicate names', () => {
    expect(() => csv.parse('1,2', { header: ['x', 'x'] })).toThrowError()
  })
  it('rejects a header array with empty or non-string names', () => {
    expect(() => csv.parse('1,2', { header: ['x', ''] })).toThrowError()
    expect(() => csv.parse('1,2', { header: ['x', 2] })).toThrowError()
  })
})

describe('csv.parse with a rowSchema', () => {
  const rowSchema = {
    type: 'object',
    properties: {
      name: { type: 'string' },
      value: { type: 'number' }
    },
    required: ['value']
  }
  it('does not add validationErrors when no rowSchema is given', () => {
    const result = csv.parse('name,value\nalpha,10', { header: true, parser: { skipEmptyLines: true } })
    expect(result).not.toHaveProperty('validationErrors')
  })
  it('reports validationErrors and keeps invalid rows in data', () => {
    const result = csv.parse('name,value\nalpha,10\nbeta,x', { header: true, parser: { skipEmptyLines: true }, rowSchema })
    expect(result.data).toHaveLength(2)
    expect(result.validationErrors).toHaveLength(1)
    expect(result.validationErrors[0].row).toBe(1)
  })
  it('coerces values in place according to the schema', () => {
    const result = csv.parse('name,value\nalpha,10', { header: true, parser: { skipEmptyLines: true }, rowSchema })
    expect(result.data[0].value).toBe(10)
    expect(result.validationErrors).toEqual([])
  })
  it('flags a row missing a required column', () => {
    const result = csv.parse('name\nalpha', { header: true, parser: { skipEmptyLines: true }, rowSchema })
    expect(result.validationErrors).toHaveLength(1)
    expect(result.validationErrors[0].errors[0].keyword).toBe('required')
  })
  it('supports reusing the same rowSchema across calls', () => {
    const first = csv.parse('name,value\nalpha,1', { header: true, rowSchema })
    const second = csv.parse('name,value\nbeta,2', { header: true, rowSchema })
    expect(first.validationErrors).toEqual([])
    expect(second.validationErrors).toEqual([])
  })
  it('isolates schemas sharing an $id across calls', () => {
    const a = { $id: 'shared', type: 'object', properties: { v: { type: 'number' } } }
    const b = { $id: 'shared', type: 'object', properties: { v: { type: 'string' } } }
    expect(() => csv.parse('v\n1', { header: true, rowSchema: a })).not.toThrow()
    expect(() => csv.parse('v\n1', { header: true, rowSchema: b })).not.toThrow()
  })
  it('rejects a boolean rowSchema', () => {
    expect(() => csv.parse('a\n1', { header: true, rowSchema: true })).toThrowError()
    expect(() => csv.parse('a\n1', { header: true, rowSchema: false })).toThrowError()
  })
  it('reports additional properties when forbidden by the schema', () => {
    const schema = {
      type: 'object',
      properties: { name: { type: 'string' } },
      additionalProperties: false
    }
    const result = csv.parse('name,value\nalpha,10', { header: true, parser: { skipEmptyLines: true }, rowSchema: schema })
    expect(result.validationErrors).toHaveLength(1)
    expect(result.validationErrors[0].errors[0].keyword).toBe('additionalProperties')
  })
  it('reports all validation errors for a row', () => {
    const schema = {
      type: 'object',
      properties: {
        value: { type: 'number' },
        active: { type: 'boolean' }
      },
      required: ['value', 'active']
    }
    const result = csv.parse('value,active\nx,y', { header: true, parser: { skipEmptyLines: true }, rowSchema: schema })
    expect(result.validationErrors).toHaveLength(1)
    expect(result.validationErrors[0].errors.length).toBeGreaterThan(1)
  })
  it('keeps invalid rows even when some values are coerced', () => {
    const schema = {
      type: 'object',
      properties: {
        value: { type: 'number' },
        active: { type: 'boolean' }
      },
      required: ['value', 'active']
    }
    const result = csv.parse('value,active\n10,invalid', { header: true, parser: { skipEmptyLines: true }, rowSchema: schema })
    expect(result.data[0].value).toBe(10)
    expect(result.data[0].active).toBe('invalid')
    expect(result.validationErrors).toHaveLength(1)
  })
  it('validates rows mapped with a custom header', () => {
    const schema = {
      type: 'object',
      properties: {
        name: { type: 'string' },
        value: { type: 'number' }
      },
      required: ['name', 'value']
    }
    const result = csv.parse('alpha,10\nbeta,20', { header: ['name', 'value'], rowSchema: schema })
    expect(result.data).toEqual([{ name: 'alpha', value: 10 }, { name: 'beta', value: 20 }])
    expect(result.validationErrors).toEqual([])
  })
})

describe('csv.parse rowSchema and dynamicTyping', () => {
  const rowSchema = {
    type: 'object',
    properties: { id: { type: 'string' } }
  }
  it('rejects dynamicTyping together with rowSchema', () => {
    expect(() => csv.parse('id\n00123', { header: true, parser: { dynamicTyping: true }, rowSchema })).toThrowError('dynamicTyping cannot be used with rowSchema')
  })
  it('allows dynamicTyping without a rowSchema', () => {
    const { data } = csv.parse('id\n00123', { header: true, parser: { dynamicTyping: true } })
    expect(data[0].id).toBe(123)
  })
  it('allows dynamicTyping:false together with rowSchema', () => {
    const result = csv.parse('id\n00123', { header: true, parser: { dynamicTyping: false }, rowSchema })
    expect(result.data[0].id).toBe('00123')
    expect(result.validationErrors).toEqual([])
  })
})

describe('csv.read', () => {
  it('reads and parses a CSV fixture from a path', async () => {
    const { data } = await csv.read(fixture('points.csv'), { header: true, parser: { skipEmptyLines: true } })
    expect(data).toHaveLength(2)
    expect(data[0].name).toBe('Paris')
  })
  it('propagates a source read failure', async () => {
    await expect(csv.read(fixture('does-not-exist.csv'))).rejects.toMatchObject({ code: csv.ERROR_CODES.READ_FAILED })
  })
})
