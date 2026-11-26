---
title: json
description: Utility functions for parsing and reading JSON data.
---

# json

Utility functions for parsing JSON text and reading JSON data from external sources.

It exposes the following error codes:

| Error code | Description |
| --- | --- |
| `UNSUPPORTED_SOURCE` | The source type is not supported |
| `READ_FAILED` | Reading the source failed |
| `HTTP_ERROR` | An HTTP request returned an unsuccessful response |
| `PARSE_FAILED` | JSON parsing failed |

## parse

### Signature

```js
json.parse(text, options = {})
```

### Description

Parses a JSON string and returns the resulting JavaScript value.

### Parameters

| Name | Type | Required | Description |
| --- | --- | --- | --- |
| `text` | `string` | yes | JSON text to parse |
| `options` | `object` | no | Parsing options |
| `options.reviver` | `function` | no | Function passed to `JSON.parse` to transform parsed values |

### Returns

| Type | Description |
| --- | --- |
| `*` | The parsed JSON value |

### Throws

Development assertions check that `text` is a string and validate the options object.

Throws an error with code `json.ERROR_CODES.PARSE_FAILED` if the JSON cannot be parsed. The original `SyntaxError` is available through the `cause` property.

### Examples

```js
import { json } from '@kalisio/common-core/io/json'

const data = json.parse('{"name":"station-01"}')
// { name: 'station-01' }
```

## read

### Signature

```js
json.read(input, options = {})
```

### Description

Reads an external source as text, then parses the resulting content as JSON.

Accepts HTTP(S) URLs as strings or `URL` objects, Node.js filesystem paths or `file:` URLs, and `Blob`/`File` objects. String sources also accept `data:` and `blob:` URLs, plus relative URL references when the runtime provides a base URL.

### Parameters

| Name               | Type                            | Required | Description                                                                         |
| ------------------ | ------------------------------- | -------- | ----------------------------------------------------------------------------------- |
| `input`            | `string \| URL \| Blob \| File` | yes      | Source containing JSON data                                                         |
| `options`          | `object`                        | no       | Reading and parsing options                                                         |
| `options.encoding` | `string`                        | no       | Character encoding used when reading a local file in Node.js. Defaults to `'utf-8'` |
| `options.request`  | `object`                        | no       | Options passed to `request` when reading a remote source                            |
| `options.reviver`  | `function`                      | no       | Function passed to `JSON.parse` to transform parsed values                          |

### Returns

| Type         | Description           |
| ------------ | --------------------- |
| `Promise<*>` | The parsed JSON value |

### Throws

Throws an error with code `json.ERROR_CODES.UNSUPPORTED_SOURCE` if the source type is not supported.

Throws an error with code `json.ERROR_CODES.READ_FAILED` if the source cannot be read. The original error is available through the `cause` property.

For failed HTTP responses, the cause has code `json.ERROR_CODES.HTTP_ERROR` and exposes the HTTP `status` and `statusText`.

Also propagates errors thrown by `json.parse`.

### Examples

```js
import { json } from '@kalisio/common-core/io/json'

const data = await json.read('./data.json')
```

```js
const data = await json.read('https://example.com/data.json', {
  request: {
    retries: 3,
    timeout: 5000
  }
})
```

