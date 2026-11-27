import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { csv } from '../../src/io/csv.js'

const runtime = vi.hoisted(() => ({ locales: undefined }))

vi.mock('../../src/runtime/locales.js', async importOriginal => ({
  ...await importOriginal(),
  getLocales: () => runtime.locales
}))

const fixture = (name) => fileURLToPath(new URL(`./fixtures/${name}`, import.meta.url))
const text = (name) => readFile(fixture(name), 'utf8')

describe('csv.parse', () => {
  it('returns a normalized result with data, parseErrors and parseMeta only', async () => {
    expect(csv.parse(await text('points.csv'))).toEqual({
      data: expect.any(Array),
      parseErrors: expect.any(Array),
      parseMeta: expect.any(Object)
    })
  })
  it('parses rows as arrays by default (no header)', async () => {
    const { data } = csv.parse(await text('points.csv'))
    expect(data[0]).toEqual(['name', 'lon', 'lat', 'active'])
    expect(data[1]).toEqual(['Paris', '2.35', '48.85', 'true'])
  })
  it('parses rows as objects with header:true and keeps values as strings', async () => {
    const { data } = csv.parse(await text('points.csv'), { header: true })
    expect(data).toEqual([
      { name: 'Paris', lon: '2.35', lat: '48.85', active: 'true' },
      { name: 'Lyon', lon: '4.83', lat: '45.76', active: 'false' }
    ])
  })
  it('exposes parseMeta.fields with header:true', async () => {
    const { parseMeta } = csv.parse(await text('points.csv'), { header: true })
    expect(parseMeta.fields).toEqual(['name', 'lon', 'lat', 'active'])
  })
  it('skips empty lines by default', () => {
    const { data } = csv.parse('a,b\n1,2\n\n3,4\n', { header: true })
    expect(data).toEqual([{ a: '1', b: '2' }, { a: '3', b: '4' }])
  })
  it('counts a trailing empty line as a row when skipEmptyLines is off', async () => {
    const { data } = csv.parse(await text('points.csv'), { header: true, parser: { skipEmptyLines: false } })
    expect(data).toHaveLength(3)
  })
  it('honors a custom delimiter via parser', async () => {
    const { data } = csv.parse(await text('semicolon.csv'), { header: true, parser: { delimiter: ';' } })
    expect(data).toEqual([{ name: 'alpha', value: '10' }, { name: 'beta', value: '20' }])
  })
  it('handles quoted fields with embedded commas and escaped quotes', async () => {
    const { data } = csv.parse(await text('quoted.csv'), { header: true })
    expect(data[0]).toEqual({ name: 'Doe, John', note: 'he said "hi"' })
  })
  it('surfaces field-mismatch errors on ragged rows', async () => {
    const { parseErrors } = csv.parse(await text('ragged.csv'), { header: true })
    expect(parseErrors.map((error) => error.code)).toEqual(expect.arrayContaining(['TooFewFields', 'TooManyFields']))
  })
  it('supports greedy empty-line skipping via parser', () => {
    const { data } = csv.parse('a,b\n1,2\n   \n3,4\n', { header: true, parser: { skipEmptyLines: 'greedy' } })
    expect(data).toEqual([{ a: '1', b: '2' }, { a: '3', b: '4' }])
  })
  it.each([
    ['worker', true],
    ['download', true],
    ['step', () => {}],
    ['chunk', () => {}]
  ])('rejects the %s parser option', (name, value) => {
    expect(() => csv.parse('a,b', { parser: { [name]: value } })).toThrowError('Only synchronous non-streaming parsing is supported')
  })
  it('rejects a non-string input', () => {
    expect(() => csv.parse(42)).toThrowError('text must be a string')
  })
  it('rejects invalid options', () => {
    const message = 'options must be a valid options object'
    expect(() => csv.parse('a,b', { header: 'yes' })).toThrowError(message)
    expect(() => csv.parse('a,b', { header: false })).toThrowError(message)
    expect(() => csv.parse('a,b', { parser: 42 })).toThrowError(message)
    expect(() => csv.parse('a,b', { rowSchema: 'nope' })).toThrowError(message)
    expect(() => csv.parse('a,b', { locale: '' })).toThrowError(message)
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
  it('reports TooFewFields with its row and keeps missing columns as undefined keys', () => {
    const { data, parseErrors } = csv.parse('1,2', { header: ['x', 'y', 'z'] })
    expect(data[0]).toStrictEqual({ x: '1', y: '2', z: undefined })
    expect(parseErrors).toMatchObject([{ type: 'FieldMismatch', code: 'TooFewFields', row: 0 }])
  })
  it('reports TooManyFields with its row and collects extras in __parsed_extra', () => {
    const { data, parseErrors } = csv.parse('1,2,3\n1,2,3,4', { header: ['x', 'y', 'z'] })
    expect(data[1]).toEqual({ x: '1', y: '2', z: '3', __parsed_extra: ['4'] })
    expect(parseErrors).toMatchObject([{ type: 'FieldMismatch', code: 'TooManyFields', row: 1 }])
  })
  it('maps a column named __proto__ as data', () => {
    const row = csv.parse('a,b', { header: ['__proto__', 'name'] }).data[0]
    expect(Object.entries(row)).toEqual([['__proto__', 'a'], ['name', 'b']])
    expect(Object.getPrototypeOf(row)).toBe(Object.prototype)
  })
  it('rejects a header array with duplicate names', () => {
    expect(() => csv.parse('1,2', { header: ['x', 'x'] })).toThrowError('options must be a valid options object')
  })
  it('rejects a header array with empty or non-string names', () => {
    expect(() => csv.parse('1,2', { header: ['x', ''] })).toThrowError('options must be a valid options object')
    expect(() => csv.parse('1,2', { header: ['x', 2] })).toThrowError('options must be a valid options object')
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
    const result = csv.parse('name,value\nalpha,10', { header: true })
    expect(result).not.toHaveProperty('validationErrors')
  })
  it('reports validationErrors and keeps invalid rows in data', () => {
    const result = csv.parse('name,value\nalpha,10\nbeta,x', { header: true, rowSchema })
    expect(result.data).toHaveLength(2)
    expect(result.validationErrors).toMatchObject([{ row: 1, errors: [{ keyword: 'type', instancePath: '/value' }] }])
  })
  it('coerces values in place according to the schema', () => {
    const result = csv.parse('name,value\nalpha,10', { header: true, rowSchema })
    expect(result.data[0]).toEqual({ name: 'alpha', value: 10 })
    expect(result.validationErrors).toEqual([])
  })
  it('flags a row missing a required column', () => {
    const result = csv.parse('name\nalpha', { header: true, rowSchema })
    expect(result.validationErrors).toMatchObject([{ row: 0, errors: [{ keyword: 'required', params: { missingProperty: 'value' } }] }])
  })
  it('supports reusing the same rowSchema across calls', () => {
    const first = csv.parse('name,value\nalpha,1', { header: true, rowSchema })
    const second = csv.parse('name,value\nbeta,2', { header: true, rowSchema })
    expect(first.validationErrors).toEqual([])
    expect(second.validationErrors).toEqual([])
  })
  it('takes a rowSchema modified between two calls into account', () => {
    const schema = { type: 'object', properties: { value: { type: 'number' } } }
    expect(csv.parse('value\nx', { header: true, rowSchema: schema }).validationErrors).toHaveLength(1)
    schema.properties.value = { type: 'string' }
    expect(csv.parse('value\nx', { header: true, rowSchema: schema }).validationErrors).toEqual([])
  })
  it('isolates schemas sharing an $id across calls', () => {
    const a = { $id: 'shared', type: 'object', properties: { v: { type: 'number' } } }
    const b = { $id: 'shared', type: 'object', properties: { v: { type: 'string' } } }
    expect(csv.parse('v\nx', { header: true, rowSchema: a }).validationErrors).toHaveLength(1)
    expect(csv.parse('v\nx', { header: true, rowSchema: b }).validationErrors).toEqual([])
  })
  it('accepts every row with a true rowSchema', () => {
    expect(csv.parse('a\n1\n2', { header: true, rowSchema: true }).validationErrors).toEqual([])
  })
  it('flags every row with a false rowSchema', () => {
    const result = csv.parse('a\n1\n2', { header: true, rowSchema: false })
    expect(result.validationErrors).toMatchObject([
      { row: 0, errors: [{ keyword: 'false schema' }] },
      { row: 1, errors: [{ keyword: 'false schema' }] }
    ])
  })
  it('rejects an async rowSchema', () => {
    expect(() => csv.parse('a\n1', { header: true, rowSchema: { $async: true, ...rowSchema } })).toThrowError('rowSchema cannot be async')
  })
  it('reports additional properties when forbidden by the schema', () => {
    const schema = {
      type: 'object',
      properties: { name: { type: 'string' } },
      additionalProperties: false
    }
    const result = csv.parse('name,value\nalpha,10', { header: true, rowSchema: schema })
    expect(result.validationErrors).toMatchObject([{ row: 0, errors: [{ keyword: 'additionalProperties', params: { additionalProperty: 'value' } }] }])
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
    const result = csv.parse('value,active\nx,y', { header: true, rowSchema: schema })
    expect(result.validationErrors).toHaveLength(1)
    expect(result.validationErrors[0].errors.map((error) => error.instancePath)).toEqual(['/value', '/active'])
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
    const result = csv.parse('value,active\n10,invalid', { header: true, rowSchema: schema })
    expect(result.data[0]).toEqual({ value: 10, active: 'invalid' })
    expect(result.validationErrors).toMatchObject([{ row: 0, errors: [{ instancePath: '/active' }] }])
  })
  it('validates and coerces rows without a header', () => {
    const rowSchema = {
      type: 'array',
      items: { type: 'number' }
    }
    const result = csv.parse('1,2\n3,x', { rowSchema })
    expect(result.data).toEqual([[1, 2], [3, 'x']])
    expect(result.validationErrors).toMatchObject([
      {
        row: 1,
        errors: [{ keyword: 'type', instancePath: '/1' }]
      }
    ])
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

describe('csv.parse validation messages', () => {
  const rowSchema = { type: 'object', properties: { value: { type: 'integer' } } }
  const message = (result) => result.validationErrors[0].errors[0].message
  afterEach(() => {
    runtime.locales = undefined
  })
  it('keeps Ajv messages without any locale', () => {
    expect(message(csv.parse('value\nx', { header: true, rowSchema }))).toBe('must be integer')
  })
  it('localizes messages in the given locale', () => {
    expect(message(csv.parse('value\nx', { header: true, rowSchema, locale: 'fr' }))).toBe('doit être de type integer')
  })
  it('localizes messages in the current application locale', () => {
    runtime.locales = { getCurrent: () => 'fr' }
    expect(message(csv.parse('value\nx', { header: true, rowSchema }))).toBe('doit être de type integer')
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
  it('rejects a per-column dynamicTyping together with rowSchema', () => {
    expect(() => csv.parse('id\n00123', { header: true, parser: { dynamicTyping: { id: true } }, rowSchema })).toThrowError('dynamicTyping cannot be used with rowSchema')
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
    const { data } = await csv.read(fixture('points.csv'), { header: true })
    expect(data).toHaveLength(2)
    expect(data[0].name).toBe('Paris')
  })
  it('validates rows read from a source', async () => {
    const rowSchema = { type: 'object', properties: { lon: { type: 'number' }, active: { type: 'boolean' } } }
    const { data, validationErrors } = await csv.read(fixture('points.csv'), { header: true, rowSchema })
    expect(data[0]).toMatchObject({ lon: 2.35, active: true })
    expect(validationErrors).toEqual([])
  })
  it('propagates a source read failure', async () => {
    await expect(csv.read(fixture('does-not-exist.csv'))).rejects.toMatchObject({ code: csv.ERROR_CODES.READ_FAILED })
  })
})
