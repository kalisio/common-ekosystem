import en from '../../foundation/i18n/en.json'

export const VALIDATION_CODES = Object.freeze(
  Object.fromEntries(
    Object.keys(en.VALIDATION).map(code => [code, code])
  )
)
