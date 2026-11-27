import Ajv from 'ajv'
import { validate } from '../../src/operators/validate.js'

const runtime = vi.hoisted(() => ({ locales: undefined }))

vi.mock('../../src/runtime/locales.js', async importOriginal => ({
  ...await importOriginal(),
  getLocales: () => runtime.locales
}))

const schema = {
  type: 'object',
  required: ['name', 'email'],
  properties: {
    name: { type: 'string' },
    email: { type: 'string', format: 'email' }
  }
}

const asyncSchema = { $async: true, ...schema }
const valid = { name: 'Ada', email: 'ada@kalisio.com' }
const english = ["must have required property 'name'", "must have required property 'email'"]
const french = ['requiert la propriété name', 'requiert la propriété email']

function messages (result) {
  return result.errors.map(error => error.message)
}

function createAsyncAjv (validate) {
  const ajv = new Ajv()
  ajv.addKeyword({
    keyword: 'check',
    async: true,
    errors: false,
    validate
  })
  return ajv
}

describe('validate', () => {
  beforeEach(() => {
    runtime.locales = undefined
  })

  describe('arguments', () => {
    it.each([
      ['undefined', undefined],
      ['null', null],
      ['string', 'invalid'],
      ['number', 42],
      ['array', []],
      ['function', () => {}]
    ])('rejects a schema of type %s', (type, schema) => {
      expect(() => validate(schema)).toThrow()
    })
    it.each([
      ['null', null],
      ['string', 'invalid'],
      ['number', 42],
      ['boolean', true],
      ['array', []]
    ])('rejects options of type %s', (type, options) => {
      expect(() => validate(schema, options)).toThrow()
    })
    it.each([
      ['empty object', {}],
      ['invalid compile method', { compile: true }],
      ['string', 'invalid'],
      ['number', 42]
    ])('rejects an invalid Ajv instance (%s)', (type, ajv) => {
      expect(() => validate(schema, { ajv })).toThrow()
    })
    it.each([
      ['string', 'invalid'],
      ['number', 42],
      ['boolean', true],
      ['array', []]
    ])('rejects ajvOptions of type %s', (type, ajvOptions) => {
      expect(() => validate(schema, { ajvOptions })).toThrow()
    })
    it('accepts empty options', () => {
      expect(validate(schema, {})(valid).valid).toBe(true)
    })
    it('accepts an empty schema', () => {
      expect(validate({})({}).valid).toBe(true)
    })
    it('accepts a true boolean schema', () => {
      const validator = validate(true)
      expect(validator({}).valid).toBe(true)
      expect(validator(null).valid).toBe(true)
      expect(validator(42).valid).toBe(true)
    })
    it('accepts a false boolean schema', () => {
      const validator = validate(false)
      expect(validator({}).valid).toBe(false)
      expect(validator(null).valid).toBe(false)
      expect(validator(42).valid).toBe(false)
    })
  })

  describe('compilation', () => {
    it('compiles the schema only once', () => {
      const ajv = new Ajv()
      const compile = vi.spyOn(ajv, 'compile')
      const validator = validate({ type: 'string' }, { ajv })
      expect(validator('Ada').valid).toBe(true)
      expect(validator(42).valid).toBe(false)
      expect(compile).toHaveBeenCalledTimes(1)
    })
    it('rejects an invalid schema', () => {
      expect(() => validate({ type: 'unknown' })).toThrow()
    })
    it('does not compile when arguments are invalid', () => {
      const ajv = new Ajv()
      const compile = vi.spyOn(ajv, 'compile')
      expect(() => validate([], { ajv })).toThrow()
      expect(() => validate({}, { ajv, ajvOptions: [] })).toThrow()
      expect(compile).not.toHaveBeenCalled()
    })
    it('does not cache validators across calls', () => {
      const schema = { type: 'string' }
      const first = validate(schema)
      schema.type = 'number'
      const second = validate(schema)
      expect(first('Ada').valid).toBe(true)
      expect(first(42).valid).toBe(false)
      expect(second('Ada').valid).toBe(false)
      expect(second(42).valid).toBe(true)
    })
  })

  describe('configuration', () => {
    it('collects all errors by default', () => {
      const result = validate(schema)({})
      expect(result.valid).toBe(false)
      expect(messages(result)).toEqual(english)
    })
    it('supports ajv-formats', () => {
      const validator = validate(schema)
      expect(validator(valid).valid).toBe(true)
      expect(messages(validator({ ...valid, email: 'ada' })))
        .toEqual(['must match format "email"'])
    })
    it('supports ajv-keywords', () => {
      const validator = validate({ type: 'number', range: [1, 3] })
      expect(validator(2).valid).toBe(true)
      expect(validator(5).valid).toBe(false)
    })
    it('forwards ajvOptions to Ajv', () => {
      const validator = validate(schema, {
        ajvOptions: { allErrors: false }
      })
      expect(validator({}).errors).toHaveLength(1)
    })
    it('supports data coercion through ajvOptions', () => {
      const validator = validate({
        type: 'object',
        properties: { age: { type: 'integer' } }
      }, {
        ajvOptions: { coerceTypes: true }
      })
      const data = { age: '42' }
      expect(validator(data).valid).toBe(true)
      expect(data.age).toBe(42)
    })
    it('does not configure the given Ajv instance', () => {
      expect(() => validate(schema, { ajv: new Ajv() }))
        .toThrow(/unknown format "email"/)
    })
    it('uses custom formats registered on the given Ajv instance', () => {
      const ajv = new Ajv()
      ajv.addFormat('identifier', /^[A-Z]+$/)
      const validator = validate({
        type: 'string',
        format: 'identifier'
      }, { ajv })
      expect(validator('ADA').valid).toBe(true)
      expect(validator('ada').valid).toBe(false)
    })
  })

  describe('sync', () => {
    it('returns a sync validator for a sync schema', () => {
      expect(validate(schema)(valid))
        .toEqual({ valid: true, errors: [] })
    })
    it('reports structured validation errors', () => {
      const result = validate(schema)({ ...valid, email: 'ada' })
      expect(result.valid).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0]).toMatchObject({
        instancePath: '/email',
        schemaPath: '#/properties/email/format',
        keyword: 'format',
        params: { format: 'email' }
      })
    })
    it('clears errors after a successful validation', () => {
      const validator = validate(schema)
      expect(validator({}).valid).toBe(false)
      expect(validator(valid)).toEqual({ valid: true, errors: [] })
    })
    it('preserves errors returned by previous validations', () => {
      const validator = validate(schema)
      const result = validator({})
      validator(valid)
      expect(messages(result)).toEqual(english)
    })
  })

  describe('async', () => {
    it('returns an async validator for an async schema', async () => {
      const result = validate(asyncSchema)(valid)
      expect(result).toBeInstanceOf(Promise)
      expect(await result).toEqual({ valid: true, errors: [] })
    })
    it('reports validation errors', async () => {
      const result = await validate(asyncSchema)({})
      expect(result.valid).toBe(false)
      expect(messages(result)).toEqual(english)
    })
    it('supports asynchronous custom keywords', async () => {
      const ajv = createAsyncAjv(async (enabled, value) => {
        return !enabled || value === 'Ada'
      })
      const validator = validate({
        $async: true,
        type: 'string',
        check: true
      }, { ajv })
      expect(await validator('Ada'))
        .toEqual({ valid: true, errors: [] })
      const result = await validator('John')
      expect(result.valid).toBe(false)
      expect(result.errors[0].keyword).toBe('check')
    })
    it('recognizes validation errors without relying on class identity', async () => {
      const errors = [{ keyword: 'check', message: 'rejected' }]
      const error = Object.assign(new Error('validation failed'), {
        ajv: true,
        validation: true,
        errors
      })
      const ajv = createAsyncAjv(async () => { throw error })
      const validator = validate({
        $async: true,
        check: true
      }, { ajv })
      expect(await validator({})).toEqual({ valid: false, errors })
    })
    it('rethrows technical errors', async () => {
      const error = new Error('boom')
      const ajv = createAsyncAjv(async () => { throw error })
      const validator = validate({
        $async: true,
        check: true
      }, { ajv })
      await expect(validator({})).rejects.toBe(error)
    })
    it('does not mistake unrelated errors for Ajv validation errors', async () => {
      const error = Object.assign(new Error('boom'), {
        validation: true
      })
      const ajv = createAsyncAjv(async () => { throw error })
      const validator = validate({
        $async: true,
        check: true
      }, { ajv })
      await expect(validator({})).rejects.toBe(error)
    })
    it('supports concurrent validations', async () => {
      let release
      const pending = new Promise(resolve => { release = resolve })
      const ajv = createAsyncAjv(async (enabled, value) => {
        await pending
        return !enabled || value === 'Ada'
      })
      const validator = validate({
        $async: true,
        type: 'string',
        check: true
      }, { ajv })
      const results = Promise.all([
        validator('Ada'),
        validator('John'),
        validator('Jane')
      ])
      release()
      const [success, first, second] = await results
      expect(success).toEqual({ valid: true, errors: [] })
      expect(first.valid).toBe(false)
      expect(second.valid).toBe(false)
      expect(first.errors[0].keyword).toBe('check')
      expect(second.errors[0].keyword).toBe('check')
      expect(first.errors).not.toBe(second.errors)
      expect(first.errors[0]).not.toBe(second.errors[0])
    })
  })

  describe('localization', () => {
    it('localizes errors in the given locale', () => {
      expect(messages(validate(schema)({}, { locale: 'fr' })))
        .toEqual(french)
    })
    it('falls back to the language of a regional locale', () => {
      expect(messages(validate(schema)({}, { locale: 'fr-FR' })))
        .toEqual(french)
    })
    it('uses a regional localizer when available', () => {
      expect(messages(validate(schema)({}, { locale: 'pt-BR' }))[0])
        .toBe('deve ter a propriedade obrigatória name')
    })
    it('keeps Ajv messages for an unsupported locale', () => {
      expect(messages(validate(schema)({}, { locale: 'xx' })))
        .toEqual(english)
    })
    it('uses the current application locale', () => {
      runtime.locales = { getCurrent: () => 'fr' }
      expect(messages(validate(schema)({}))).toEqual(french)
    })
    it('prefers the given locale over the application one', () => {
      runtime.locales = { getCurrent: () => 'fr' }
      expect(messages(validate(schema)({}, { locale: 'pt-BR' }))[0])
        .toBe('deve ter a propriedade obrigatória name')
    })
    it('reflects application locale changes without recompiling', () => {
      let locale = 'xx'
      runtime.locales = { getCurrent: () => locale }
      const validator = validate(schema)
      expect(messages(validator({}))).toEqual(english)
      locale = 'fr'
      expect(messages(validator({}))).toEqual(french)
    })
    it('does not mutate the original Ajv errors', () => {
      const ajv = new Ajv()
      const schema = {
        type: 'object',
        required: ['name'],
        properties: { name: { type: 'string' } }
      }
      const compiled = ajv.compile(schema)
      const validator = validate(schema, { ajv })
      const result = validator({}, { locale: 'fr' })
      expect(messages(result)).toEqual([french[0]])
      expect(compiled.errors[0].message).toBe(english[0])
      expect(result.errors[0]).not.toBe(compiled.errors[0])
    })
    it('does not leak a localization into the next call', () => {
      const validator = validate(schema)
      const result = validator({}, { locale: 'fr' })
      expect(messages(validator({}))).toEqual(english)
      expect(messages(result)).toEqual(french)
    })
    it('localizes async validation errors', async () => {
      expect(messages(await validate(asyncSchema)({}, { locale: 'fr' })))
        .toEqual(french)
    })
    it('supports concurrent validations with different locales', async () => {
      const validator = validate(asyncSchema)
      const [original, localized, success] = await Promise.all([
        validator({}),
        validator({}, { locale: 'fr' }),
        validator(valid)
      ])
      expect(messages(original)).toEqual(english)
      expect(messages(localized)).toEqual(french)
      expect(success).toEqual({ valid: true, errors: [] })
    })
    it('uses the application locale at the end of an async validation', async () => {
      let locale = 'xx'
      runtime.locales = { getCurrent: () => locale }
      const validator = validate(asyncSchema)
      const result = validator({})
      locale = 'fr'
      expect(messages(await result)).toEqual(french)
    })
  })
})
