import { assert, is } from '../predicates/index.js'

// Internal parser shared by all helpers. Splits any URL — single or multi-host
// (e.g. a MongoDB replica set connection string) — into its components, without
// relying on the native URL parser which rejects comma-separated authorities.
// Mirrors the grammar used by is.url.
const URL_RE = /^([a-z][a-z0-9+.-]*:\/\/)([^/?#]+)(\/[^?#]*)?(\?[^#]*)?(#.*)?$/i

function parseUrl (value) {
  const match = value.match(URL_RE)
  if (!match) return null
  const [, scheme, authority, path = '', query = '', fragment = ''] = match
  // Normalize an empty path to '/', matching the standard URL form.
  return { scheme, authority, path: path || '/', query, fragment }
}

// Split an authority into userinfo (if any) and the list of host strings.
// userinfo is only carried by the first host: user:pass@h1,h2 -> userinfo on h1.
function splitAuthority (authority) {
  const hosts = authority.split(',')
  let userinfo = ''
  const at = hosts[0].lastIndexOf('@')
  if (at !== -1) {
    userinfo = hosts[0].slice(0, at)
    hosts[0] = hosts[0].slice(at + 1)
  }
  return { userinfo, hosts }
}

// Split a single "host:port" into { host, port }. port is null when absent.
function splitHostPort (hostString) {
  const colon = hostString.lastIndexOf(':')
  if (colon === -1) return { host: hostString, port: null }
  return { host: hostString.slice(0, colon), port: hostString.slice(colon + 1) }
}

// Rebuild a full URL string from parsed components.
function buildUrl ({ scheme, authority, path, query, fragment }) {
  return `${scheme}${authority}${path}${query}${fragment}`
}

// Parse a raw query string (with or without the leading '?') into ordered
// [key, value] pairs, keys and values still URL-encoded.
function parseQueryPairs (query) {
  const raw = query.startsWith('?') ? query.slice(1) : query
  if (!raw) return []
  return raw.split('&').filter(Boolean).map((pair) => {
    const eq = pair.indexOf('=')
    return eq === -1 ? [pair, ''] : [pair.slice(0, eq), pair.slice(eq + 1)]
  })
}

export const url = {

  parse (url, defaultPort = 80) {
    assert.all([
      { value: url, validator: is.url, message: 'url must be an url' },
      { value: defaultPort, validator: is.number, message: 'defaultPort must be a number' }
    ])
    const parsed = parseUrl(url)
    const { hosts } = splitAuthority(parsed.authority)
    const query = {}
    for (const [key, value] of parseQueryPairs(parsed.query)) {
      query[decodeURIComponent(key)] = decodeURIComponent(value)
    }
    return {
      hosts: hosts.map((h) => {
        const { host, port } = splitHostPort(h)
        return { host, port: port ? Number(port) : defaultPort }
      }),
      path: parsed.path,
      query
    }
  },

  build (baseUrl, params) {
    assert.all([
      { value: baseUrl, validator: is.url, message: 'baseUrl must be an url' },
      { value: params, validator: is.nonEmptyObject, message: 'params must be a non empty object' }
    ])
    return url.addQueryParam(baseUrl, params)
  },

  addQueryParam (url, params) {
    assert.all([
      { value: url, validator: is.url, message: 'url must be an url' },
      { value: params, validator: is.nonEmptyObject, message: 'params must be a non empty object' }
    ])
    const parsed = parseUrl(url)
    // Parse the existing query into ordered, still-encoded pairs.
    const pairs = parseQueryPairs(parsed.query)
    for (const [key, value] of Object.entries(params)) {
      if (!is.defined(value)) continue
      const encodedKey = encodeURIComponent(key)
      const encodedValue = encodeURIComponent(String(value))
      const existing = pairs.find(([k]) => k === encodedKey)
      if (existing) existing[1] = encodedValue // replace, like the former .set
      else pairs.push([encodedKey, encodedValue])
    }
    const queryString = pairs.map(([key, value]) => `${key}=${value}`).join('&')
    const query = pairs.length ? `?${queryString}` : ''
    return buildUrl({ ...parsed, query })
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
    const parsed = parseUrl(url)
    const { userinfo, hosts } = splitAuthority(parsed.authority)
    if (!userinfo) return buildUrl(parsed)
    // userinfo is "user" or "user:password"; mask whichever parts are present.
    const colon = userinfo.indexOf(':')
    const maskedUserinfo = colon === -1 ? mask : `${mask}:${mask}`
    const authority = `${maskedUserinfo}@${hosts.join(',')}`
    return buildUrl({ ...parsed, authority })
  }

}
