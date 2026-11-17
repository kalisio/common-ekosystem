---
title: url
description: Utility functions for building, encoding, parsing, and manipulating URLs, including URL templates.
---

# url
Utility functions for building, encoding, parsing, and manipulating URLs.

Supports URL templates containing placeholders such as `{z}`, `{x}`, `{y}`, `{-y}`, `{TileMatrix}` or `{bbox-epsg-3857}`, as well as multi-host connection strings.

## build
### Signature
```js

url.build (baseUrl, params, options = {})

```

### Description
Builds a URL from a base URL and a parameters object.

Only defined values are added as query parameters. Existing query parameters are preserved, and parameters with matching keys are replaced.

The original URL is not re-encoded, so placeholders already present in its path or query string are preserved.

When `preservePlaceholders` is enabled, recognized template placeholders in newly added query parameter values are also preserved instead of being percent-encoded.

### Parameters
| Name | Type | Required | Description |

|------|------|----------|-------------|

| `baseUrl` | `string` | yes | The base URL |

| `params` | `object` | yes | Non-empty object containing query parameters |

| `options` | `object` | no | URL construction options |

| `options.preservePlaceholders` | `boolean` | no | Preserve template placeholders in newly added parameter values (default: `false`) |

### Returns
| Type | Description |

|------|-------------|

| `string` | The constructed URL with query parameters |

### Throws
Throws an error if `baseUrl` is not a valid URL, `params` is not a non-empty object, or `options` is invalid.

### Examples
```js

url.build('https://api.example.com/search', { q: 'hello', page: 1 })

// 'https://api.example.com/search?q=hello&page=1'

url.build('https://api.example.com', { q: 'hello', filter: undefined })

// 'https://api.example.com/?q=hello'

url.build('https://api.example.com/search?page=1', { page: 2 })

// 'https://api.example.com/search?page=2'

```

Placeholders already present in the original URL are preserved:

```js

url.build('https://example.com/tiles/{z}/{x}/{y}.png', { key: '123' })

// 'https://example.com/tiles/{z}/{x}/{y}.png?key=123'

```

By default, placeholders in newly added parameter values are encoded:

```js

url.build('https://example.com/tiles', { matrix: '{TileMatrix}' })

// 'https://example.com/tiles?matrix=%7BTileMatrix%7D'

```

They can be preserved explicitly:

```js

url.build(

   'https://example.com/tiles',

   { matrix: '{TileMatrix}' },

   { preservePlaceholders: true }

)

// 'https://example.com/tiles?matrix={TileMatrix}'

```

Ordinary characters surrounding placeholders remain correctly encoded:

```js

url.build(

   'https://example.com/tiles',

   { matrix: 'level {TileMatrix}' },

   { preservePlaceholders: true }

)

// 'https://example.com/tiles?matrix=level%20{TileMatrix}'

```

## parse
### Signature
```js

url.parse (url, defaultPort = 80)

```

### Description
Parses a URL and extracts its hosts, path, and query parameters.

Supports single-host and multi-host URLs, including connection strings containing comma-separated authorities, such as MongoDB replica sets.

Each host is returned with its associated port. When a port is not specified, `defaultPort` is used.

Query parameter names and values are URL-decoded.

An empty path is normalized to `/`.

### Parameters
| Name | Type | Required | Description |

|------|------|----------|-------------|

| `url` | `string` | yes | The URL to parse |

| `defaultPort` | `number` | no | Fallback port when no explicit port is provided (default: `80`) |

### Returns
| Type | Description |

|------|-------------|

| `object` | An object containing `hosts`, `path`, and `query` |

The returned object has the following structure:

| Property | Type | Description |

|----------|------|-------------|

| `hosts` | `Array<{ host: string, port: number }>` | List of parsed hosts and their ports |

| `path` | `string` | URL path, normalized to `/` when empty |

| `query` | `object` | Decoded query parameters |

### Throws
Throws an error if `url` is not a valid URL or if `defaultPort` is not a valid number.

### Examples
```js

url.parse('https://example.com:3000/api/users')

// {

//   hosts: [{ host: 'example.com', port: 3000 }],

//   path: '/api/users',

//   query: {}

// }

url.parse('https://example.com/api/users?active=true')

// {

//   hosts: [{ host: 'example.com', port: 80 }],

//   path: '/api/users',

//   query: { active: 'true' }

// }

url.parse('https://example.com/api/users', 443)

// {

//   hosts: [{ host: 'example.com', port: 443 }],

//   path: '/api/users',

//   query: {}

// }

```

Multi-host URLs are also supported:

```js

url.parse('mongodb://db1:27017,db2:27018/mydb?replicaSet=rs0')

// {

//   hosts: [

//     { host: 'db1', port: 27017 },

//     { host: 'db2', port: 27018 }

//   ],

//   path: '/mydb',

//   query: { replicaSet: 'rs0' }

// }

```

The default port is used regardless of the URL scheme. For example, an HTTPS URL without an explicit port returns port `80` unless another default is provided.

## addQueryParam
### Signature
```js

url.addQueryParam (url, params, options = {})

```

### Description
Adds query parameters to an existing URL.

Existing parameters are preserved. Only defined values are added. If a parameter already exists, its value is replaced.

The original URL is not re-encoded. Existing placeholders in its path and query string are therefore preserved as written.

The `preservePlaceholders` option controls whether recognized template placeholders in newly added query parameter values remain literal.

Query parameters are encoded individually using `encodeURIComponent()`.

### Parameters
| Name | Type | Required | Description |

|------|------|----------|-------------|

| `url` | `string` | yes | The URL to extend |

| `params` | `object` | yes | Non-empty object containing query parameters |

| `options` | `object` | no | URL construction options |

| `options.preservePlaceholders` | `boolean` | no | Preserve template placeholders in newly added parameter values (default: `false`) |

### Returns
| Type | Description |

|------|-------------|

| `string` | The URL with the additional query parameters |

### Throws
Throws an error if `url` is not a valid URL, `params` is not a non-empty object, or `options` is invalid.

### Examples
```js

url.addQueryParam('https://api.example.com?q=hello', { page: 2 })

// 'https://api.example.com/?q=hello&page=2'

url.addQueryParam('https://api.example.com?page=1', { page: 2 })

// 'https://api.example.com/?page=2'

url.addQueryParam('https://api.example.com/search', {

   q: 'hello world',

   filter: undefined

})

// 'https://api.example.com/search?q=hello%20world'

```

Existing URL template placeholders remain unchanged:

```js

url.addQueryParam(

   'https://example.com/tiles/{z}/{x}/{y}.png',

   { key: '123' }

)

// 'https://example.com/tiles/{z}/{x}/{y}.png?key=123'

```

Preserve placeholders in newly added parameter values:

```js

url.addQueryParam(

   'https://example.com/tiles',

   { matrix: '{TileMatrix}', row: '{TileRow}', col: '{TileCol}' },

   { preservePlaceholders: true }

)

// 'https://example.com/tiles?matrix={TileMatrix}&row={TileRow}&col={TileCol}'

```

## encode
### Signature
```js

url.encode (url, options = {})

```

### Description
Encodes a URL using JavaScript's `encodeURI()` function.

Characters such as spaces and braces are percent-encoded by default, while URL structural characters handled by `encodeURI()` are preserved.

When `preservePlaceholders` is enabled, recognized URL template placeholders are kept literal, and only the text surrounding them is encoded.

Supported placeholder syntax includes identifiers such as `{z}`, `{x}`, `{y}`, `{-y}`, `{s}`, `{TileMatrix}` and `{bbox-epsg-3857}`.

This is not a general-purpose template parser: only placeholders matching the supported syntax are preserved.

### Parameters
| Name | Type | Required | Description |

|------|------|----------|-------------|

| `url` | `string` | yes | The URL to encode |

| `options` | `object` | no | Encoding options |

| `options.preservePlaceholders` | `boolean` | no | Preserve recognized URL template placeholders (default: `false`) |

### Returns
| Type | Description |

|------|-------------|

| `string` | The encoded URL |

### Throws
Throws an error if `url` is not a valid URL or if `options` is invalid.

### Examples
```js

url.encode('https://example.com/path with spaces')

// 'https://example.com/path%20with%20spaces'

url.encode('https://example.com/tiles/{z}/{x}/{y}.png')

// 'https://example.com/tiles/%7Bz%7D/%7Bx%7D/%7By%7D.png'

```

Preserve URL template placeholders:

```js

url.encode(

   'https://example.com/tiles/{z}/{x}/{y}.png',

   { preservePlaceholders: true }

)

// 'https://example.com/tiles/{z}/{x}/{y}.png'

url.encode(

   'https://example.com/tiles/{TileMatrix}/{TileRow}/{TileCol}',

   { preservePlaceholders: true }

)

// 'https://example.com/tiles/{TileMatrix}/{TileRow}/{TileCol}'

```

Text surrounding placeholders is still encoded:

```js

url.encode(

   'https://example.com/my tiles/{z}/{x}/{y}.png',

   { preservePlaceholders: true }

)

// 'https://example.com/my%20tiles/{z}/{x}/{y}.png'

```

## obfuscate
### Signature
```js

url.obfuscate (url, mask = '*****')

```

### Description
Replaces the username and password in a URL with a mask string.

Useful for logging connection URLs without exposing credentials.

When both a username and password are present, each is replaced independently with the supplied mask. When only a username is present, it is replaced with a single mask.

The URL's hosts, path, query parameters, and fragment are otherwise preserved.

### Parameters
| Name | Type | Required | Description |

|------|------|----------|-------------|

| `url` | `string` | yes | The URL to obfuscate |

| `mask` | `string` | no | Replacement string for credentials (default: `'*****'`) |

### Returns
| Type | Description |

|------|-------------|

| `string` | The URL with credentials replaced by the mask |

### Throws
Throws an error if `url` is not a valid URL or if `mask` is not a string.

### Examples
```js

url.obfuscate('https://user:password@example.com')

// 'https://*****:*****@example.com/'

url.obfuscate('https://user:password@example.com', '###')

// 'https://###:###@example.com/'

url.obfuscate('https://user@example.com')

// 'https://*****@example.com/'

url.obfuscate('https://example.com')

// 'https://example.com/'

```

Multi-host connection strings are supported:

```js

url.obfuscate('mongodb://user:password@db1:27017,db2:27018/mydb')

// 'mongodb://*****:*****@db1:27017,db2:27018/mydb'

```

## isWithin

### Signature

```js
url.isWithin(value, baseUrl)
```

### Description

Checks whether a URL belongs to the scope defined by a base URL. Both URLs must have the same protocol, host, and effective port. The target path must be equal to the base path or located beneath it on a path-segment boundary.

Uses the native WHATWG `URL` parser to normalize paths (including `.` and `..` segments) and default ports before comparison. Protocol and host comparisons follow WHATWG normalization; path comparisons remain case-sensitive. A single trailing slash in the base path is ignored. Query parameters and fragments do not affect the result.

Both arguments must be absolute URL strings with a single host. Relative references, multi-host URLs, backslashes, and encoded path separators (`%2F`, `%5C`) are rejected. Credentials are not allowed in either URL. A base path ending in multiple slashes is also rejected.

Invalid **targets** return `false`; invalid **base URLs** throw an error. This operation is protocol-agnostic: it does not restrict URLs to HTTP(S).

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `value` | `string` | yes | Target URL to check |
| `baseUrl` | `string` | yes | Base URL defining the allowed scope |

### Returns

| Type | Description |
|------|-------------|
| `boolean` | `true` if the target belongs to the base URL's scope; otherwise `false` |

### Throws

Throws an error if `baseUrl` is invalid, contains credentials or ambiguous encoded path separators, or ends with multiple slashes. Invalid `value` inputs return `false` instead of throwing.

### Examples

A target can match the base path or one of its descendants:

```js
url.isWithin('https://example.com/api', 'https://example.com/api')
// true

url.isWithin('https://example.com/api/files/1', 'https://example.com/api/')
// true

url.isWithin('https://example.com/api/files', 'https://example.com/')
// true
```

Path boundaries and origins must match:

```js
url.isWithin('https://example.com/api-other', 'https://example.com/api')
// false

url.isWithin('https://other.example.com/api/files', 'https://example.com/api')
// false

url.isWithin('http://example.com/api/files', 'https://example.com/api')
// false
```

Normalization is performed before comparing paths:

```js
url.isWithin('https://example.com/api/a/../files', 'https://example.com/api')
// true

url.isWithin('https://example.com/api/../admin', 'https://example.com/api')
// false

url.isWithin('https://example.com:443/api/files', 'https://example.com/api')
// true
```

Ambiguous or unsupported targets return `false`:

```js
url.isWithin('/api/files', 'https://example.com/api')
// false

url.isWithin('https://example.com/api%2Ffiles', 'https://example.com/api')
// false

url.isWithin('https://user:pass@example.com/api/files', 'https://example.com/api')
// false
```

Invalid bases throw instead:

```js
url.isWithin('https://example.com/api/files', 'https://user:pass@example.com/api')
// throws AssertionError

url.isWithin('https://example.com/api/files', 'https://example.com/api//')
// throws AssertionError
```
