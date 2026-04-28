---
title: bytes
description: Utility functions for encoding and decoding binary data.
---

# bytes

## toBase64

### Signature

```js
bytes.toBase64 (value)
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
bytes.toBase64('hello')
// 'aGVsbG8='

bytes.toBase64('café')
// 'Y2Fmw6k='

bytes.toBase64(new Uint8Array([104, 101, 108, 108, 111]))
// 'aGVsbG8='
```

## fromBase64

### Signature

```js
bytes.fromBase64 (value)
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
bytes.fromBase64('aGVsbG8=')
// 'hello'

bytes.fromBase64('Y2Fmw6k=')
// 'café'
```

## fromBase64Bytes

### Signature

```js
bytes.fromBase64Bytes (value)
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
bytes.fromBase64Bytes ('aGVsbG8=')
// Uint8Array [ 104, 101, 108, 108, 111 ]
```

## toHex

### Signature

```js
bytes.toHex (value)
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
bytes.toHex(new Uint8Array([0, 1, 255]))
// '0001ff'
```

## fromHex

### Signature

```js
bytes.fromHex (value)
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
bytes.fromHex('0001ff')
// Uint8Array [ 0, 1, 255 ]

bytes.fromHex('0001FF')
// Uint8Array [ 0, 1, 255 ]
```