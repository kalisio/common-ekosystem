import { assert, conform, is } from '../predicates/index.js'
import { object } from './object.js'

// Internal parser shared by all helpers. Splits any URL — single or multi-host
// (e.g. a MongoDB replica set connection string) — into its components, without
// relying on the native URL parser which rejects comma-separated authorities.
// Mirrors the grammar used by is.authorityUrl.
const URL_RE = /^([a-z][a-z0-9+.-]*:\/\/)([^/?#]+)(\/[^?#]*)?(\?[^#]*)?(#.*)?$/i

// Template placeholders, as used by tile engines and OGC templates: {z}, {x},
// {y}, {-y}, {s}, {TileMatrix}, {bbox-epsg-3857}...
const PLACEHOLDERS_RE = /(\{-?[A-Za-z][\w-]*\})/

const ENCODED_SEPARATOR_RE = /%(?:2f|5c)/i

const PLACEHOLDER_OPTIONS_SCHEMA = {
  preservePlaceholders: is.boolean
}

const PLACEHOLDER_DEFAULTS = { preservePlaceholders: false }

function isValidScopeUrl (value) {
  if (!is.string(value) || value.includes('\\')) return false
  if (!is.authorityUrl(value) || !URL.canParse(value)) return false
  return !new URL(value).hostname.includes(',')
}

function parseUrl (value) {
  const match = URL_RE.exec(String(value))
  if (!match) return null
  const [, scheme, authority, path = '', query = '', fragment = ''] = match
  // Normalize an empty path to '/', matching the standard URL form.
  return { scheme, authority, path: path || '/', query, fragment }
}

// Split an authority into userinfo (if any) and the list of host strings.
// userinfo is only carried by the first host: user:pass@h1,h2 -> userinfo on h1.
function splitAuthority (authority) {
  const at = authority.lastIndexOf('@')
  const userinfo = at === -1 ? '' : authority.slice(0, at)
  return { userinfo, hosts: authority.slice(at + 1).split(',') }
}

// Split a single "host:port" into { host, port }. port is null when absent.
function splitHostPort (hostString) {
  const colon = hostString.lastIndexOf(':')
  // A colon inside brackets belongs to an IPv6 address, not to a port
  if (colon === -1 || colon < hostString.lastIndexOf(']')) return { host: hostString, port: null }
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

// Encode a query value. With `preservePlaceholders`, only the text between
// placeholders is encoded: split() with a capturing group alternates text and
// placeholders, so odd indexes are placeholders, kept literal.
function encodeQueryValue (value, preservePlaceholders) {
  if (!preservePlaceholders) return encodeURIComponent(value)
  return value.split(PLACEHOLDERS_RE)
    .map((part, index) => index % 2 === 1 ? part : encodeURIComponent(part))
    .join('')
}

export const url = {

  parse (url, defaultPort = 80) {
    assert.all([
      { value: url, validator: is.authorityUrl, message: 'url must be an url' },
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

  build (baseUrl, params, options = {}) {
    assert.all([
      { value: baseUrl, validator: is.authorityUrl, message: 'baseUrl must be an url' },
      { value: params, validator: is.nonEmptyObject, message: 'params must be a non empty object' }
    ])
    return url.addQueryParam(baseUrl, params, options)
  },

  // The URL itself is never re-encoded, so placeholders it holds (in the path
  // or the existing query) are kept as written. `options.preservePlaceholders`
  // also keeps placeholders literal in the added values.
  addQueryParam (url, params, options) {
    const settings = object.defaults(PLACEHOLDER_DEFAULTS, options)
    assert.all([
      { value: url, validator: is.authorityUrl, message: 'url must be an url' },
      { value: params, validator: is.nonEmptyObject, message: 'params must be a non empty object' },
      { value: settings, validator: (v) => conform.schema(v, PLACEHOLDER_OPTIONS_SCHEMA), message: 'options must be a valid options object' }
    ])
    const parsed = parseUrl(url)
    // Parse the existing query into ordered, still-encoded pairs.
    const pairs = parseQueryPairs(parsed.query)
    for (const [key, value] of Object.entries(params)) {
      if (!is.defined(value)) continue
      const encodedKey = encodeURIComponent(key)
      const encodedValue = encodeQueryValue(String(value), settings.preservePlaceholders)
      const first = pairs.findIndex(([k]) => k === encodedKey)
      if (first === -1) {
        pairs.push([encodedKey, encodedValue])
        continue
      }
      pairs[first][1] = encodedValue
      // Like URLSearchParams.set: the other occurrences of the key are removed
      for (let i = pairs.length - 1; i > first; i--) {
        if (pairs[i][0] === encodedKey) pairs.splice(i, 1)
      }
    }
    const queryString = pairs.map(([key, value]) => `${key}=${value}`).join('&')
    const query = pairs.length ? `?${queryString}` : ''
    return buildUrl({ ...parsed, query })
  },

  encode (url, options) {
    const settings = object.defaults(PLACEHOLDER_DEFAULTS, options)
    assert.all([
      { value: url, validator: is.authorityUrl, message: 'url must be an url' },
      { value: settings, validator: (v) => conform.schema(v, PLACEHOLDER_OPTIONS_SCHEMA), message: 'options must be a valid options object' }
    ])
    url = String(url)
    if (!settings.preservePlaceholders) return encodeURI(url)
    return url.split(PLACEHOLDERS_RE)
      .map((part, index) => index % 2 === 1 ? part : encodeURI(part))
      .join('')
  },

  obfuscate (url, mask = '*****') {
    assert.all([
      { value: url, validator: is.authorityUrl, message: 'url must be an url' },
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
  },

  isWithin (value, baseUrl) {
    assert.that(baseUrl, isValidScopeUrl, 'baseUrl must be an url')
    const base = new URL(baseUrl)
    assert.that(base,
      v => !v.username && !v.password && !ENCODED_SEPARATOR_RE.test(v.pathname) && !/\/{2,}$/.test(v.pathname),
      'baseUrl must not contain credentials or ambiguous separators'
    )
    // An invalid value is within no scope: false rather than an error, as for a predicate
    if (!isValidScopeUrl(value)) return false
    const target = new URL(value)
    if (target.protocol !== base.protocol || target.host !== base.host) return false
    if (target.username || target.password || ENCODED_SEPARATOR_RE.test(target.pathname)) return false
    const basePath = base.pathname.replace(/\/$/, '')
    return basePath === '' || target.pathname === basePath || target.pathname.startsWith(`${basePath}/`)
  }
}
