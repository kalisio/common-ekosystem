---
title: url
description: Utility functions for building, encoding, and manipulating URLs.
---

# url

Utility functions for building, encoding, and manipulating URLs.

## build

### Signature

```js
url.build (baseUrl, params)
```

### Description

Builds a URL from a base URL and a params object. Only defined values are appended as query parameters.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `baseUrl` | `string` | yes | The base URL |
| `params` | `object` | yes | Query parameters to append |

### Returns

| Type | Description |
|------|-------------|
| `string` | The constructed URL with query parameters |

### Throws

Throws a `TypeError` if `baseUrl` is not a valid URL or if `params` is not a non-empty object.

### Examples

```js
url.build('https://api.example.com/search', { q: 'hello', page: 1 })
// 'https://api.example.com/search?q=hello&page=1'

url.build('https://api.example.com', { q: 'hello', filter: undefined })
// 'https://api.example.com/?q=hello' — undefined values are ignored
```


## addQueryParam

### Signature

```js
url.addQueryParam (url, params)
```

### Description

Appends query parameters to an existing URL. Existing parameters are preserved. Only defined values are added. If a key already exists, its value is overwritten.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `url` | `string` | yes | The URL to extend |
| `params` | `object` | yes | Query parameters to append |

### Returns

| Type | Description |
|------|-------------|
| `string` | The URL with the additional query parameters |

### Throws

Throws a `TypeError` if `url` is not a valid URL or if `params` is not a non-empty object.

### Examples

```js
url.addQueryParam('https://api.example.com?q=hello', { page: 2 })
// 'https://api.example.com/?q=hello&page=2'

url.addQueryParam('https://api.example.com?page=1', { page: 2 })
// 'https://api.example.com/?page=2' — existing key is overwritten
```

## encode

### Signature

```js
url.encode (url)
```

### Description

Encodes a URL using `encodeURI`, making it safe for use in HTTP requests. Characters that have special meaning in URLs (such as spaces) are percent-encoded.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `url` | `string` | yes | The URL to encode |

### Returns

| Type | Description |
|------|-------------|
| `string` | The encoded URL |

### Throws

Throws a `TypeError` if `url` is not a valid URL.

### Examples

```js
url.encode('https://example.com/path with spaces')
// 'https://example.com/path%20with%20spaces'
```

## obfuscate

### Signature

```js
url.obfuscate (url, mask = '*****')
```

### Description

Replaces the username and password in a URL with a mask string. Useful for safely logging URLs that contain credentials.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `url` | `string` | yes | The URL to obfuscate |
| `mask` | `string` | no | The string to replace credentials with. Defaults to `'*****'` |

### Returns

| Type | Description |
|------|-------------|
| `string` | The URL with credentials replaced by the mask |

### Throws

Throws a `TypeError` if `url` is not a valid URL or if `mask` is not a string.

### Examples

```js
url.obfuscate('https://user:password@example.com')
// 'https://*****:*****@example.com'

url.obfuscate('https://user:password@example.com', '###')
// 'https://###:###@example.com'

url.obfuscate('https://example.com')
// 'https://example.com' — no credentials, unchanged
```