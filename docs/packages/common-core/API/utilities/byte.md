---
title: byte
description: Utility functions for encoding and decoding binary data.
---

# byte

## toBase64

### Signature

```js
byte.toBase64 (value)
```

### Description

Encodes a string, `ArrayBuffer`, or `ArrayBufferView` to a base64 string. Handles UTF-8 strings and large binary buffers safely via chunking.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `value` | `string \| ArrayBuffer \| ArrayBufferView` | yes | The value to encode |

### Returns

| Type | Description |
|------|-------------|
| `string` | The base64-encoded string |

### Throws

Throws a `TypeError` if `value` is not a string, `ArrayBuffer`, or `ArrayBufferView`.

### Examples

```js
byte.toBase64('hello')
// 'aGVsbG8='

byte.toBase64('café')
// 'Y2Fmw6k='

byte.toBase64(new Uint8Array([104, 101, 108, 108, 111]))
// 'aGVsbG8='
```

## fromBase64

### Signature

```js
byte.fromBase64 (value)
```

### Description

Decodes a base64 string to a UTF-8 string.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `value` | `string` | yes | The base64 string to decode |

### Returns

| Type | Description |
|------|-------------|
| `string` | The decoded UTF-8 string |

### Throws

Throws a `TypeError` if `value` is not a string.

### Examples

```js
byte.fromBase64('aGVsbG8=')
// 'hello'

byte.fromBase64('Y2Fmw6k=')
// 'café'
```

## fromBase64Bytes

### Signature

```js
byte.fromBase64Bytes (value)
```

### Description

Decodes a base64 string to a `Uint8Array`. Useful when working with binary data such as files or cryptographic keys.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `value` | `string` | yes | The base64 string to decode |

### Returns

| Type | Description |
|------|-------------|
| `Uint8Array` | The decoded bytes |

### Throws

Throws a `TypeError` if `value` is not a string.

### Examples

```js
byte.fromBase64Bytes ('aGVsbG8=')
// Uint8Array [ 104, 101, 108, 108, 111 ]
```

## toHex

### Signature

```js
byte.toHex (value)
```

### Description

Encodes an `ArrayBuffer` or `ArrayBufferView` to a lowercase hex string.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `value` | `ArrayBuffer \| ArrayBufferView` | yes | The binary data to encode |

### Returns

| Type | Description |
|------|-------------|
| `string` | The lowercase hex string |

### Throws

Throws a `TypeError` if `value` is not an `ArrayBuffer` or `ArrayBufferView`.

### Examples

```js
byte.toHex(new Uint8Array([0, 1, 255]))
// '0001ff'
```

## fromHex

### Signature

```js
byte.fromHex (value)
```

### Description

Decodes a hex string to a `Uint8Array`. Accepts both lowercase and uppercase hex characters.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `value` | `string` | yes | The hex string to decode |

### Returns

| Type | Description |
|------|-------------|
| `Uint8Array` | The decoded bytes |

### Throws

Throws a `TypeError` if `value` is not a string, has an odd length, or contains non-hex characters.

### Examples

```js
byte.fromHex('0001ff')
// Uint8Array [ 0, 1, 255 ]

byte.fromHex('0001FF')
// Uint8Array [ 0, 1, 255 ]
```

## dataUriToBlob

### Signature

```js
byte.dataUriToBlob(value)
```

### Description

Converts a base64-encoded data URI to a `Blob`. Automatically extracts the MIME type from the URI header.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `value` | `string` | yes | A valid base64 data URI (e.g. `data:image/png;base64,...`) |

### Returns

| Type | Description |
|------|-------------|
| `Blob` | A `Blob` instance with the correct MIME type |

### Throws

Throws a `TypeError` if `value` is not a valid base64 data URI.

### Examples

```js
const blob = byte.dataUriToBlob('data:text/plain;base64,aGVsbG8=')
blob.type // 'text/plain'
blob.size // 5

const blob = byte.dataUriToBlob('data:image/png;base64,iVBORw0KGgo=')
blob.type // 'image/png'
```