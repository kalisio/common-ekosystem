// --- Errors and versions ------------------------------------------------------

// Error codes shared by every connector. HTTP and parsing failures keep the
// codes of common-core (READ_FAILED, HTTP_ERROR, PARSE_FAILED).
export const ERROR_CODES = {
  INVALID_CAPABILITIES: 'INVALID_CAPABILITIES',
  UNSUPPORTED_VERSION: 'UNSUPPORTED_VERSION',
  OWS_EXCEPTION: 'OWS_EXCEPTION'
}

export function failure (code, message) {
  const error = new Error(message)
  error.code = code
  return error
}

// Throw UNSUPPORTED_VERSION unless `value` is one of `supported`. Versions are
// compared as written: capabilities documents always state them in full
// ('1.3.0'), and so must callers requesting a version.
export function assertSupportedVersion (service, value, supported) {
  if (!supported.includes(value)) {
    throw failure(ERROR_CODES.UNSUPPORTED_VERSION, `unsupported ${service} version ${value ?? '(none)'}, expected ${supported.join(' or ')}`)
  }
}

// --- Tile levels --------------------------------------------------------------

// Tile pyramids identify their levels with strings: '0', '1', ... but also
// 'EPSG:900913:0', 'EPSG:900913:1', ... (GeoServer gridsets). When every
// identifier is a common prefix followed by consecutive integers, a level is
// addressable from a zoom placeholder: return { template: '<prefix>{z}',
// minZoom, maxZoom }. Otherwise return undefined.
// The check is purely syntactic: the integers are whatever the identifiers
// end with, and callers must verify they match the zoom levels a protocol
// advertises (a TMS TileSet order, for instance) before relying on them.
export function zoomTemplate (identifiers) {
  if (!identifiers.length) return undefined
  const parts = identifiers.map((identifier) => {
    let index = identifier.length
    while (index > 0 && identifier[index - 1] >= '0' && identifier[index - 1] <= '9') index--
    return index === identifier.length ? null : [identifier.slice(0, index), identifier.slice(index)]
  })
  if (parts.some((part) => !part)) return undefined
  const prefix = parts[0][0]
  const levels = parts.map((part) => parseInt(part[1], 10))
  const consistent = parts.every((part, index) =>
    part[0] === prefix && String(levels[index]) === part[1] && (index === 0 || levels[index] === levels[index - 1] + 1))
  if (!consistent) return undefined
  return { template: `${prefix}{z}`, minZoom: levels[0], maxZoom: levels[levels.length - 1] }
}
