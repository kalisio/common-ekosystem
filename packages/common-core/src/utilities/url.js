import { assert, is } from '../predicates/index.js'

export const url = {

  build (baseUrl, params) {
    assert.all([
      { value: baseUrl, validator: is.url, message: 'baseUrl must be an url' },
      { value: params, validator: is.nonEmptyObject, message: 'params must be a non empty object' }
    ])
    const url = new URL(baseUrl)
    Object.entries(params).forEach(([key, value]) => {
      if (is.defined(value)) url.searchParams.set(key, String(value))
    })
    return url.toString()
  },

  parse (url, defaultPort = 80) {
    assert.all([
      { value: url, validator: is.url, message: 'url must be an url' },
      { value: defaultPort, validator: is.number, message: 'defaultPort must be a number' }
    ])
    const u = new URL(url)
    return {
      host: u.hostname,
      port: u.port ? Number(u.port) : defaultPort,
      path: u.pathname
    }
  },

  addQueryParam (url, params) {
    assert.all([
      { value: url, validator: is.url, message: 'url must be an url' },
      { value: params, validator: is.nonEmptyObject, message: 'params must be a non empty object' }
    ])
    const u = new URL(url)
    for (const [key, value] of Object.entries(params)) {
      if (is.defined(value)) u.searchParams.set(key, String(value))
    }
    return u.toString()
  },

  encode (url) {
    assert.that(url, is.url, 'url must be an url')
    return encodeURI(url)
  },

  obfuscate (url, mask = '*****') {
    assert.all([
      { value: url, validator: is.url, message: 'url must be an url' },
      { value: mask, validator: is.string, message: 'mask must be a string' }
    ])
    const u = new URL(url)
    if (u.username) u.username = mask
    if (u.password) u.password = mask
    return u.toString()
  }

}
