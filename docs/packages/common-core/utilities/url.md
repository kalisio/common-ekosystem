
---
title: url
description: Utility functions for building, encoding, parsing, and manipulating URLs, including URL templates.
---

# url

Utility functions for building, encoding, parsing, and manipulating URLs.

Supports URL templates containing placeholders such as `{z}`, `{x}`, `{y}`, `{-y}`, `{TileMatrix}`, or `{bbox-epsg-3857}`, as well as multi-host connection strings.

Except for `isWithin`, these utilities accept a URL string or a native `URL` instance. Functions that parse or build connection strings also support comma-separated host authorities.

## build

### Signature

```js
url.build(baseUrl, params, options = {})
```

### Description

Builds a URL by adding the defined entries of `params` as query parameters. Existing parameters are preserved unless their keys are replaced. When an existing key is replaced, its first occurrence keeps its position and subsequent occurrences are removed.

The original URL is not re-encoded, so placeholders already present in its path or query string remain unchanged. By default, placeholders in newly added values are percent-encoded. Set `preservePlaceholders` to `true` to preserve recognized placeholders in those values.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `baseUrl` | `string \| URL` | yes | Base URL, including an authority |
| `params` | `object` | yes | Non-empty object containing query parameters |
| `options` | `object` | no | URL construction options |
| `options.preservePlaceholders` | `boolean` | no | Preserve recognized placeholders in new values (default: `false`) |

### Returns

| Type | Description |
|------|-------------|
| `string` | Constructed URL with query parameters |

### Throws

Throws if `baseUrl` is invalid, `params` is not a non-empty object, or `options` is invalid.

### Examples

```js
url.build('https://api.example.com/search', { q: 'hello', page: 1 })
// 'https://api.example.com/search?q=hello&page=1'

url.build('https://api.example.com', { q: 'hello', filter: undefined })
// 'https://api.example.com/?q=hello'

url.build('https://api.example.com/search?page=1', { page: 2 })
// 'https://api.example.com/search?page=2'

url.build('https://example.com/tiles/{z}/{x}/{y}.png', { matrix: '{TileMatrix}' })
// 'https://example.com/tiles/{z}/{x}/{y}.png?matrix=%7BTileMatrix%7D'

url.build('https://example.com/tiles', { matrix: 'level {TileMatrix}' }, { preservePlaceholders: true })
// 'https://example.com/tiles?matrix=level%20{TileMatrix}'
```

## parse

### Signature

```js
url.parse(url, defaultPort = 80)
```

### Description

Parses a URL and extracts its hosts, path, and query parameters. Supports single-host and comma-separated multi-host URLs, such as MongoDB replica-set connection strings. Each host has its own port; when none is specified, `defaultPort` is used regardless of the URL scheme. An empty path is normalized to `/`.

Query parameter names and values are decoded using `decodeURIComponent()`. A `+` is **not** converted to a space. If a parameter occurs multiple times, the last value is retained. Malformed percent-encoded query parameters may throw a `URIError`.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `url` | `string \| URL` | yes | URL to parse |
| `defaultPort` | `number` | no | Finite fallback port when no explicit port is provided (default: `80`); not checked for TCP port range |

### Returns

| Type | Description |
|------|-------------|
| `object` | Object containing `hosts`, `path`, and `query` |

| Property | Type | Description |
|----------|------|-------------|
| `hosts` | `Array<{ host: string, port: number }>` | Parsed hosts and ports |
| `path` | `string` | URL path, `/` when empty |
| `query` | `object` | Decoded query parameters; repeated keys use the last value |

### Throws

Throws if `url` is invalid or `defaultPort` is not a finite number. Malformed percent-encoded query keys or values may throw a `URIError`.

### Examples

```js
url.parse('https://example.com:3000/api/users')
// { hosts: [{ host: 'example.com', port: 3000 }], path: '/api/users', query: {} }

url.parse('https://example.com/api/users?active=true')
// { hosts: [{ host: 'example.com', port: 80 }], path: '/api/users', query: { active: 'true' } }

url.parse('https://example.com/api/users', 443)
// { hosts: [{ host: 'example.com', port: 443 }], path: '/api/users', query: {} }

url.parse('mongodb://db1:27017,db2:27018/mydb?replicaSet=rs0')
// {
//   hosts: [{ host: 'db1', port: 27017 }, { host: 'db2', port: 27018 }],
//   path: '/mydb',
//   query: { replicaSet: 'rs0' }
// }

url.parse('https://example.com/?q=a+b&q=c%20d').query
// { q: 'c d' }
```

## addQueryParam

### Signature

```js
url.addQueryParam(url, params, options = {})
```

### Description

Adds query parameters to an existing URL. Only defined values are added. When a key already exists, its first occurrence is updated in place and any subsequent occurrences of that key are removed. Other existing parameters retain their order and original percent-encoding.

New keys and values are encoded using `encodeURIComponent()`. Existing URL text, including placeholders and encoded braces, is not globally re-encoded. Rebuilding the query string can, however, normalize its structure (for example, a parameter without `=` becomes `key=`).

By default, placeholders in newly added values are encoded. With `preservePlaceholders: true`, recognized placeholders such as `{TileMatrix}` or `{-y}` remain literal while surrounding text is encoded. Braces that do not match the supported placeholder syntax are encoded.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `url` | `string \| URL` | yes | URL to extend |
| `params` | `object` | yes | Non-empty object containing query parameters |
| `options` | `object` | no | Query construction options |
| `options.preservePlaceholders` | `boolean` | no | Preserve recognized placeholders in new values (default: `false`) |

### Returns

| Type | Description |
|------|-------------|
| `string` | URL with updated query parameters |

### Throws

Throws if `url` is invalid, `params` is not a non-empty object, or `options` is invalid.

### Examples

```js
url.addQueryParam('https://api.example.com?q=hello', { page: 2 })
// 'https://api.example.com/?q=hello&page=2'

url.addQueryParam('https://example.com/?a=1&a=2&b=3', { a: 4 })
// 'https://example.com/?a=4&b=3'

url.addQueryParam('https://example.com/?a=1#frag', { auth: 'token' })
// 'https://example.com/?a=1&auth=token#frag'

url.addQueryParam('mongodb://h1:27017,h2:27017/db?replicaSet=rs0', { auth: 'token' })
// 'mongodb://h1:27017,h2:27017/db?replicaSet=rs0&auth=token'

url.addQueryParam('https://example.com/tiles/{z}/{x}/{y}.png', { matrix: '{TileMatrix}' })
// 'https://example.com/tiles/{z}/{x}/{y}.png?matrix=%7BTileMatrix%7D'

url.addQueryParam(
  'https://example.com/wmts',
  { TILEMATRIX: 'EPSG:900913:{z}', TILEROW: '{y}', TILECOL: '{x}' },
  { preservePlaceholders: true }
)
// 'https://example.com/wmts?TILEMATRIX=EPSG%3A900913%3A{z}&TILEROW={y}&TILECOL={x}'
```

## encode

### Signature

```js
url.encode(url, options = {})
```

### Description

Encodes a URL with `encodeURI()`. Spaces, non-ASCII characters, and braces are percent-encoded by default, while URL structural characters recognized by `encodeURI()` are preserved.

With `preservePlaceholders: true`, recognized template placeholders such as `{z}`, `{-y}`, `{TileMatrix}`, and `{bbox-epsg-3857}` remain literal, while the surrounding text is encoded. This is not a general-purpose template parser.

The operation can encode an existing `%` character again; it is not intended to be idempotent on already encoded URLs.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `url` | `string \| URL` | yes | URL to encode |
| `options` | `object` | no | Encoding options |
| `options.preservePlaceholders` | `boolean` | no | Preserve recognized URL placeholders (default: `false`) |

### Returns

| Type | Description |
|------|-------------|
| `string` | Encoded URL |

### Throws

Throws if `url` is invalid or `options` is invalid.

### Examples

```js
url.encode('https://example.com/path with spaces')
// 'https://example.com/path%20with%20spaces'

url.encode('https://example.com/tiles/{z}/{x}/{y}.png')
// 'https://example.com/tiles/%7Bz%7D/%7Bx%7D/%7By%7D.png'

url.encode('https://example.com/my tiles/{z}/{x}/{y}.png', { preservePlaceholders: true })
// 'https://example.com/my%20tiles/{z}/{x}/{y}.png'
```

## obfuscate

### Signature

```js
url.obfuscate(url, mask = '*****')
```

### Description

Replaces the username and password in a URL's authority with the given mask. If both are present, each is masked separately; if only the username exists, it is masked once. Supports single-host and multi-host connection strings.

**Only credentials in the URL authority are masked.** Query parameters, paths, and fragments are preserved unchanged and may still contain secrets. Do not assume the result is safe to log if credentials or tokens occur elsewhere in the URL.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `url` | `string \| URL` | yes | URL to obfuscate |
| `mask` | `string` | no | Credential replacement text (default: `'*****'`) |

### Returns

| Type | Description |
|------|-------------|
| `string` | URL with authority credentials replaced by the mask |

### Throws

Throws if `url` is invalid or `mask` is not a string.

### Examples

```js
url.obfuscate('https://user:password@example.com')
// 'https://*****:*****@example.com/'

url.obfuscate('https://user@example.com')
// 'https://*****@example.com/'

url.obfuscate('mongodb://user:password@db1:27017,db2:27018/mydb')
// 'mongodb://*****:*****@db1:27017,db2:27018/mydb'

url.obfuscate('https://user:pass@example.com/path?token=secret#frag')
// 'https://*****:*****@example.com/path?token=secret#frag'
```

## isWithin

### Signature

```js
url.isWithin(value, baseUrl)
```

### Description

Checks whether a URL belongs to the scope defined by a base URL. Both URLs must have the same protocol, host, and effective port. The target path must equal the base path or be its descendant on a path-segment boundary.

The WHATWG `URL` parser normalizes default ports and path segments such as `.` and `..` before comparison. Scheme and host comparisons follow WHATWG normalization; path comparisons remain case-sensitive. A single trailing slash in the base path is ignored. Query parameters and fragments do not affect the result.

Both arguments must be absolute URL strings with one host. Relative URLs, multi-host URLs, backslashes, encoded path separators (`%2F`, `%5C`), and credentials are rejected. Base paths ending in multiple slashes are rejected as ambiguous.

Invalid **targets** return `false`; invalid **base URLs** throw. The operation is not restricted to HTTP(S).

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `value` | `string` | yes | Target URL to check |
| `baseUrl` | `string` | yes | Base URL defining the allowed scope |

### Returns

| Type | Description |
|------|-------------|
| `boolean` | `true` if the target belongs to the base scope; otherwise `false` |

### Throws

Throws if `baseUrl` is invalid, contains credentials or ambiguous separators, or ends with multiple slashes. Invalid `value` inputs return `false` instead.

### Examples

```js
url.isWithin('https://example.com/api', 'https://example.com/api')
// true

url.isWithin('https://example.com/api/files/1', 'https://example.com/api/')
// true

url.isWithin('https://example.com/api-other', 'https://example.com/api')
// false

url.isWithin('https://example.com/api/a/../files', 'https://example.com/api')
// true

url.isWithin('https://example.com/api/../admin', 'https://example.com/api')
// false

url.isWithin('https://example.com:443/api/files', 'https://example.com/api')
// true

url.isWithin('https://example.com/api%2Ffiles', 'https://example.com/api')
// false

url.isWithin('https://user:pass@example.com/api/files', 'https://example.com/api')
// false

url.isWithin('https://example.com/api/files', 'https://user:pass@example.com/api')
// throws AssertionError
```
