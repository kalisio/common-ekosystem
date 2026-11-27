import Ajv from 'ajv'
import addFormats from 'ajv-formats'
import addKeywords from 'ajv-keywords'
import localize from 'ajv-i18n'
import { assert, is, conform, optional } from '../predicates/index.js'
import { getLocales } from '../runtime/locales.js'

const VALIDATE_OPTIONS_SCHEMA = {
  ajv: optional(v => is.function(v?.compile)),
  ajvOptions: optional(is.plainObject)
}

function createAjv (options = {}) {
  const ajv = new Ajv({ allErrors: true, ...options })
  addFormats(ajv)
  addKeywords(ajv)
  return ajv
}

function findLocalizer (locale) {
  if (Object.hasOwn(localize, locale)) return localize[locale]
  const language = locale.split('-')[0]
  if (Object.hasOwn(localize, language)) return localize[language]
}

// Duck typing so that errors thrown by another copy of Ajv are recognized too
function isValidationError (error) {
  return error?.ajv === true && error.validation === true
}

function createSuccess () {
  return { valid: true, errors: [] }
}

function createFailure (errors, locale) {
  // Ajv reuses validator.errors across calls and ajv-i18n mutates messages in place
  errors = errors.map(error => ({ ...error }))
  locale = locale ?? getLocales()?.getCurrent()
  const localizer = locale && findLocalizer(locale)
  if (localizer) localizer(errors)
  return { valid: false, errors }
}

function createSyncValidator (validator) {
  return (data, { locale } = {}) => {
    if (validator(data)) return createSuccess()
    return createFailure(validator.errors, locale)
  }
}

function createAsyncValidator (validator) {
  return async (data, { locale } = {}) => {
    try {
      await validator(data)
    } catch (error) {
      if (!isValidationError(error)) throw error
      return createFailure(error.errors, locale)
    }
    return createSuccess()
  }
}

export function validate (schema, options = {}) {
  assert.all([
    {
      value: schema,
      validator: v => is.plainObject(v) || is.boolean(v),
      message: 'schema must be a valid JSON schema'
    },
    {
      value: options,
      validator: v => conform.schema(v, VALIDATE_OPTIONS_SCHEMA),
      message: 'options must be a valid options object'
    }
  ])
  const { ajv, ajvOptions } = options
  const instance = ajv ?? createAjv(ajvOptions)
  const validator = instance.compile(schema)
  return validator.$async
    ? createAsyncValidator(validator)
    : createSyncValidator(validator)
}
