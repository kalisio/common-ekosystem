import { is, assert } from '../predicates/index.js'
import { createRequester } from '../runtime/index.js'

export function request (url, options = {}) {
  assert.that(url, is.url, 'url must be a valid url')
  const client = createRequester(options)
  return {

    get url () {
      return url
    },

    get signal () {
      return client.signal
    },

    get aborted () {
      return client.aborted
    },

    abort (reason) {
      client.abort(reason)
    },

    fetch (options = {}) {
      return client.fetch(url, options)
    }

  }
}
