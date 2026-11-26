import { assert, is } from '../predicates/index.js'
import { Registry } from '../structures/registry.js'
import { getGlobalEventBus } from './global-event-bus.js'

class Locales {
  #locales = new Registry('locales')
  #resources = new Registry('locale-resources')
  #current
  #default
  #fallback

  constructor ({ default: defaultCode = 'en', fallback = 'en' } = {}) {
    this.#default = Locales.#normalize(defaultCode)
    this.#fallback = Locales.#normalize(fallback)
    this.#current = this.#default

    this.#locales.register(this.#default, {})
    if (this.#fallback !== this.#default) {
      this.#locales.register(this.#fallback, {})
    }
  }

  static #normalize (code) {
    assert.that(code, is.nonEmptyString, 'locale must be a non-empty string')
    const normalized = Intl.getCanonicalLocales(code)[0]
    if (!normalized) throw new RangeError(`Invalid locale: ${String(code)}`)
    return normalized
  }

  static #candidates (requested, fallback, { skipInvalid = false } = {}) {
    const codes = new Set()
    const add = (code) => {
      const parts = Locales.#normalize(code).split('-')
      while (parts.length > 0) {
        codes.add(parts.join('-'))
        parts.pop()
      }
    }
    for (const code of requested) {
      if (skipInvalid) {
        try {
          add(code)
        } catch {
          // Ignore invalid locale preferences.
        }
      } else {
        add(code)
      }
    }
    add(fallback)
    return [...codes]
  }

  register (code, metadata = {}) {
    assert.that(metadata, is.plainObject, 'metadata must be a plain object')
    return this.#locales.register(Locales.#normalize(code), metadata)
  }

  list () {
    return this.#locales.keys()
  }

  getCurrent () {
    return this.#current
  }

  setCurrent (code) {
    const locale = Locales.#normalize(code)
    if (!this.#locales.has(locale)) throw new RangeError(`Unknown locale: ${locale}`)
    if (locale === this.#current) return
    const previous = this.#current
    this.#current = locale
    getGlobalEventBus()?.emit('locale:changed', { locale, previous })
  }

  resolve (...codes) {
    const requested = codes.length > 0 ? codes : [this.#current]
    for (const candidate of Locales.#candidates(requested, this.#fallback, { skipInvalid: true })) {
      if (this.#locales.has(candidate)) return candidate
    }
  }

  registerResources (namespace, resources) {
    assert.all([
      { value: namespace, validator: is.nonEmptyString, message: 'namespace must be a non-empty string' },
      { value: resources, validator: is.plainObject, message: 'resources must be a plain object' }
    ])
    const contribution = new Map()
    for (const [code, resource] of Object.entries(resources)) {
      const locale = Locales.#normalize(code)
      assert.that(resource, is.defined, 'resource must be defined')
      if (contribution.has(locale)) throw new Error(`Duplicate resource locale: ${locale}`)
      contribution.set(locale, resource)
    }
    const existing = this.#resources.get(namespace)
    const updated = [...(existing ?? []), contribution]
    if (existing) this.#resources.replace(namespace, updated)
    else this.#resources.register(namespace, updated)
  }

  // Returns contributions ordered by locale specificity, then newest first.
  // No merging or loading takes place: each package interprets its own data.
  getResources (namespace, code = this.#current) {
    assert.that(namespace, is.nonEmptyString, 'namespace must be a non-empty string')
    const contributions = this.#resources.get(namespace) ?? []
    const result = []
    for (const locale of Locales.#candidates([code], this.#fallback)) {
      for (let i = contributions.length - 1; i >= 0; i--) {
        if (contributions[i].has(locale)) {
          result.push({ locale, resource: contributions[i].get(locale) })
        }
      }
    }
    return result
  }
}

let globalLocales = null

export function setLocales (options = {}) {
  assert.that(options, is.plainObject, 'options must be a plain object')
  globalLocales = new Locales(options)
}

export function getLocales () {
  return globalLocales
}
