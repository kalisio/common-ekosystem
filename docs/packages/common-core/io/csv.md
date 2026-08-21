---
title: csv
description: Utility functions for parsing and reading CSV data.
---

# csv

Utility functions for parsing CSV text and reading CSV data from external sources using Papa Parse.

## Properties

| Name | Type | Description |
| --- | --- | --- |
| `PARSE_OPTIONS_SCHEMA` | `object` | Validation schema for CSV parsing options |

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
| `options.skipEmptyLines` | `boolean \| 'greedy'` | no | Skip empty lines. `'greedy'` also skips lines containing only whitespace |

### Returns

| Type | Description |
| --- | --- |
| `object` | Papa Parse result containing `data`, `errors`, and `meta` |

### Throws

Throws a `TypeError` if `text` is not a string or if `options` does not conform to the expected schema.

CSV syntax and field consistency errors reported by Papa Parse are returned in the result `errors` array.

### Examples

```js
import { csv } from '@kalisio/common-core'

const result = csv.parse('name,value\nalpha,10\nbeta,20', {
  header: true
})

result.data
// [{ name: 'alpha', value: '10' }, { name: 'beta', value: '20' }]

csv.parse('name;value\nalpha;10', {
  header: true,
  delimiter: ';'
})
```

## read

### Signature

```js
csv.read(source, options = {})
```

### Description

Reads an external source as text using `source.readAsText`, then parses the resulting text as CSV.

### Parameters

| Name | Type | Required | Description |
| --- | --- | --- | --- |
| `source` | `string \| URL \| Blob \| File` | yes | Source containing CSV data |
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

Propagates errors thrown by `source.readAsText` and validation errors thrown by `csv.parse`.

### Examples

```js
import { csv } from '@kalisio/common-core'

const { data, errors } = await csv.read('./points.csv', {
  header: true,
  skipEmptyLines: true
})
```
