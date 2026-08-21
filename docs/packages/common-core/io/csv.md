---
title: csv
description: Utility functions for parsing and reading CSV data.
---

# csv

Utility functions for parsing CSV text and reading CSV data from external sources using Papa Parse.

## Properties

| Name | Type | Description |
| --- | --- | --- |
| `ERROR_CODES` | `object` | Error codes exposed by the CSV namespace |
| `PARSE_OPTIONS_SCHEMA` | `object` | Validation schema for CSV parsing options |

### ERROR_CODES

| Name | Description |
| --- | --- |
| `UNSUPPORTED_SOURCE` | The source type is not supported |
| `READ_FAILED` | Reading the source failed |
| `HTTP_ERROR` | An HTTP request returned an unsuccessful response |

## parse

### Signature

```js
csv.parse(text, options = {})
```

### Description

Parses a CSV string using Papa Parse and returns the complete Papa Parse result, including parsed data, parsing errors, and metadata.

### Parameters

| Name | Type | Required | Description |
| --- | --- | --- | --- |
| `text` | `string` | yes | CSV text to parse |
| `options` | `object` | no | Parsing options |
| `options.header` | `boolean` | no | Use the first row as field names |
| `options.delimiter` | `string` | no | Field delimiter |
| `options.skipEmptyLines` | `boolean \| 'greedy'` | no | Skip empty lines |

### Returns

| Type | Description |
| --- | --- |
| `object` | Papa Parse result containing `data`, `errors`, and `meta` |

### Throws

Throws a `TypeError` if `text` is not a string or if `options` does not conform to the expected schema.

CSV parsing errors reported by Papa Parse are returned in the result `errors` array.

### Examples

```js
import { csv } from '@kalisio/common-core'

const result = csv.parse('name,value\nalpha,10\nbeta,20', {
  header: true
})
```

## read

### Signature

```js
csv.read(input, options = {})
```

### Description

Reads an external source as text, then parses the resulting content as CSV.

A source can be a local file path in Node.js, a URL provided as a string or `URL` instance, or a `Blob`/`File` when supported by the runtime.

### Parameters

| Name | Type | Required | Description |
| --- | --- | --- | --- |
| `input` | `string \| URL \| Blob \| File` | yes | Source containing CSV data |
| `options` | `object` | no | Reading and parsing options |
| `options.encoding` | `string` | no | Character encoding used when reading a local file in Node.js. Defaults to `'utf-8'` |
| `options.header` | `boolean` | no | Use the first row as field names |
| `options.delimiter` | `string` | no | Field delimiter |
| `options.skipEmptyLines` | `boolean \| 'greedy'` | no | Skip empty lines |

### Returns

| Type | Description |
| --- | --- |
| `Promise<object>` | Papa Parse result containing `data`, `errors`, and `meta` |

### Throws

Throws an error with code `csv.ERROR_CODES.UNSUPPORTED_SOURCE` if the source type is not supported.

Throws an error with code `csv.ERROR_CODES.READ_FAILED` if the source cannot be read. The original error is available through the `cause` property.

For failed HTTP responses, the cause has code `csv.ERROR_CODES.HTTP_ERROR` and exposes the HTTP `status` and `statusText`.

### Examples

```js
import { csv } from '@kalisio/common-core'

const { data, errors } = await csv.read('./points.csv', {
  header: true,
  skipEmptyLines: true
})
```
