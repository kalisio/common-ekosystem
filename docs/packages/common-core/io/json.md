---
title: json
description: Utility functions for parsing and reading JSON data.
---

# json

Utility functions for parsing JSON text and reading JSON data from external sources.

## Properties

| Name | Type | Description |
| --- | --- | --- |
| `PARSE_FAILED` | `string` | Error code returned when JSON parsing fails |
| `PARSE_OPTIONS_SCHEMA` | `object` | Validation schema for JSON parsing options |

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

Throws a `TypeError` if `text` is not a string or if `options` does not conform to the expected schema.

Throws an error with code `json.PARSE_FAILED` if the JSON cannot be parsed. The original `SyntaxError` is available through the `cause` property.

### Examples

```js
import { json } from '@kalisio/common-core'

json.parse('{"name":"station-01"}')
// { name: 'station-01' }

json.parse('{"value":1}', {
    reviver: (key, value) => key === 'value' ? value + 1 : value
})
// { value: 2 }
```

## read

### Signature

```js
json.read(source, options = {})
```

### Description

Reads an external source as text using `source.readAsText`, then parses the resulting text as JSON.

### Parameters

| Name | Type | Required | Description |
| --- | --- | --- | --- |
| `source` | `string \| URL \| Blob \| File` | yes | Source containing JSON data |
| `options` | `object` | no | Reading and parsing options |
| `options.encoding` | `string` | no | Character encoding used when reading a local file in Node.js. Defaults to `'utf-8'` |
| `options.reviver` | `function` | no | Function passed to `JSON.parse` to transform parsed values |

### Returns

| Type | Description |
| --- | --- |
| `Promise<*>` | The parsed JSON value |

### Throws

Propagates errors thrown by `source.readAsText` and `json.parse`.

### Examples

```js
import { json } from '@kalisio/common-core'

const data = await json.read('./data.json')

const remote = await json.read('https://example.com/data.json')
```