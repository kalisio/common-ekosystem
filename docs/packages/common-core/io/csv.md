---
title: csv
description: Parse and read CSV sources with optional row mapping and JSON Schema validation.
---

# csv

This module provides helpers to parse and read CSV data using [PapaParse](https://www.papaparse.com/).

It extends PapaParse with:

* support for an externally supplied header,
* optional row validation using JSON Schema, with localizable errors,
* automatic type coercion driven by the row schema.

Install `papaparse`, `ajv`, `ajv-formats`, `ajv-keywords`, and `ajv-i18n` to use this module.

The `csv` namespace also exposes the error codes inherited from the `source` module through `csv.ERROR_CODES`.

## csv.parse

### Signature

```js
csv.parse(text, options = {})
```

### Description

Parses CSV text using PapaParse.

By default, rows are returned as arrays.

The `header` option controls how columns are mapped:

* if omitted, rows remain arrays,
* if `true`, the first row of the CSV is used as the header and rows are returned as objects,
* if an array of strings is provided, the CSV is assumed to have no header and the supplied names are used to map each row to an object.

When a custom header is provided, `parseMeta.fields` is populated with the supplied column names.

Pass additional PapaParse configuration through `parser`. Use the top-level `header` option to control column mapping.

Pass a synchronous JSON Schema through `rowSchema` to validate each parsed row with the [`validate` operator](../operators/validate.md). Ajv collects all errors per row and coerces values in place according to the schema. Boolean schemas `true` and `false` accept or reject every row, respectively.

Invalid rows remain in `data`, including any values already coerced. `validationErrors` groups the errors by row. Set `locale` to localize validation messages. By default, validation uses the current application locale when available. The [operator’s localization rules](../operators/validate.md#error-localization) also apply to CSV.

### Parameters

| Name                | Type               | Required | Description                                                                                                                                      |
| ------------------- | ------------------ | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `text`              | `string`           | yes      | CSV content to parse                                                                     |
| `options`           | `object`           | no       | Parsing options                                                                          |
| `options.header`    | `true \| string[]` | no       | If `true`, uses the first CSV row as the header. If an array is provided, uses these values as column names without consuming a row from the CSV |
| `options.parser`    | `object`           | no       | PapaParse configuration options. `skipEmptyLines` defaults to `true` but can be overridden.                      |
| `options.rowSchema` | `object \| boolean` | no | Synchronous JSON Schema applied to every parsed row. |
| `options.locale` | `string` | no | Locale for JSON Schema validation messages. Defaults to the current application locale when configured. |

Header names supplied as an array must be non-empty strings and must be unique.

### Returns

| Type     | Description                       |
| -------- | --------------------------------- |
| `object` | The normalized CSV parsing result |

The returned object always contains:

```js
{
  data,
  parseErrors,
  parseMeta
}
```

| Property      | Type     | Description                                                                                                                   |
| ------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `data`        | `Array`  | Parsed rows. Rows are arrays when no header is used, and objects when `header` is `true` or a custom header array is provided |
| `parseErrors` | `Array`  | Parsing errors reported by PapaParse, including field mismatch errors                                                         |
| `parseMeta`   | `object` | Parsing metadata reported by PapaParse. When a header is used, `parseMeta.fields` contains the column names                   |

When `rowSchema` is provided, the result additionally contains:

```js
{
  data,
  parseErrors,
  parseMeta,
  validationErrors
}
```

| Property           | Type    | Description                                                                                             |
| ------------------ | ------- | ------------------------------------------------------------------------------------------------------- |
| `validationErrors` | `Array` | JSON Schema validation errors grouped by row. The property is only present when `rowSchema` is provided |

Each validation error has the following structure:

```js
const validationError = {
  row: 1,
  errors: [
    {
      instancePath: '/longitude',
      schemaPath: '#/properties/longitude/type',
      keyword: 'type',
      params: {
        type: 'number'
      },
      message: 'must be number'
    }
  ]
}
```

The `row` property is the zero-based index of the parsed row.

### Throws

Development assertions check that `text` is a string and validate the options object. Ajv reports schema compilation errors.

The parser throws a `TypeError` in these cases.

- `parser.worker`, `parser.download`, `parser.step`, or `parser.chunk` is enabled. Parsing runs synchronously and returns all rows together.
- `rowSchema` is supplied with `parser.dynamicTyping` set to a value other than `false` or `undefined`. Type coercion comes from the schema.
- `rowSchema` declares asynchronous validation with `$async: true`.

### Examples

```js
import { csv } from '@kalisio/common-core/io/csv'

// Parse rows as arrays
const result = csv.parse(`
Paris,2.3522,48.8566
Toulouse,1.4442,43.6047
`)
// result.data
// [
//   ['Paris', '2.3522', '48.8566'],
//   ['Toulouse', '1.4442', '43.6047']
// ]
```

```js
// Use the first CSV row as the header
const result = csv.parse(`
name,longitude,latitude
Paris,2.3522,48.8566
Toulouse,1.4442,43.6047
`, {
  header: true
})
// result.parseMeta.fields
// ['name', 'longitude', 'latitude']
// result.data
// [
//   {
//     name: 'Paris',
//     longitude: '2.3522',
//     latitude: '48.8566'
//   },
//   {
//     name: 'Toulouse',
//     longitude: '1.4442',
//     latitude: '43.6047'
//   }
// ]
```

```js
// Provide an external header
const result = csv.parse(`
Paris,2.3522,48.8566
Toulouse,1.4442,43.6047
`, {
  header: ['name', 'longitude', 'latitude']
})
// result.parseMeta.fields
// ['name', 'longitude', 'latitude']
```

When fewer values than header fields are present, a PapaParse-compatible `TooFewFields` error is added.

When additional values are present, they are stored in `__parsed_extra` and a `TooManyFields` error is added.

```js
const result = csv.parse(`
Paris,2.3522,48.8566,France
`, {
  header: ['name', 'longitude', 'latitude']
})
// result.data[0]
// {
//   name: 'Paris',
//   longitude: '2.3522',
//   latitude: '48.8566',
//   __parsed_extra: ['France']
// }
```

```js
// Pass PapaParse options
const result = csv.parse(text, {
  header: true,
  parser: {
    delimiter: ';',
    skipEmptyLines: true,
    transformHeader: (value) => value.trim()
  }
})
```

```js
// Validate and coerce rows using JSON Schema
const rowSchema = {
  type: 'object',
  properties: {
    name: {
      type: 'string'
    },
    longitude: {
      type: 'number'
    },
    latitude: {
      type: 'number'
    }
  },
  required: ['name', 'longitude', 'latitude']
}
const result = csv.parse(`
name,longitude,latitude
Paris,2.3522,48.8566
Toulouse,1.4442,43.6047
`, {
  header: true,
  rowSchema
})
// result.data
// [
//   {
//     name: 'Paris',
//     longitude: 2.3522,
//     latitude: 48.8566
//   },
//   {
//     name: 'Toulouse',
//     longitude: 1.4442,
//     latitude: 43.6047
//   }
// ]
// result.validationErrors
// []
```

When validation fails, the row remains available:

```js
const result = csv.parse(`
name,longitude,latitude
Paris,invalid,48.8566
`, {
  header: true,
  rowSchema
})
// result.validationErrors
// [
//   {
//     row: 0,
//     errors: [...]
//   }
// ]
```

## csv.read

### Signature

```js
csv.read(input, options = {})
```

### Description

Reads a source as text using `source.readAsText`, then parses the resulting CSV content using `csv.parse`.

All options accepted by `csv.parse` are supported.

The following source reading options are also supported:

| Name       | Type     | Description                                                       |
| ---------- | -------- | ----------------------------------------------------------------- |
| `encoding` | `string` | Text encoding used when reading local files. Defaults to `utf-8`. |
| `request`  | `object` | Options forwarded to `request` when reading a remote source.      |

### Parameters

| Name      | Type     | Required | Description                             |
| --------- | -------- | -------- | --------------------------------------- |
| `input` | `string \| URL \| Blob \| File` | yes | HTTP(S) URL, Node.js filesystem path or `file:` URL, or `Blob`/`File`. String sources also accept `data:` and `blob:` URLs, plus relative URL references when the runtime provides a base URL. |
| `options` | `object` | no       | CSV parsing and source reading options. |

### Returns

| Type              | Description                         |
| ----------------- | ----------------------------------- |
| `Promise<object>` | The result returned by `csv.parse`. |

### Throws

Rejects with code `csv.ERROR_CODES.UNSUPPORTED_SOURCE` for an unsupported source, or `csv.ERROR_CODES.READ_FAILED` if reading fails. Following an unsuccessful HTTP response, the cause has code `csv.ERROR_CODES.HTTP_ERROR` and includes `status` and `statusText`.

Throws under the same conditions as `csv.parse`.

### Examples

```js
const result = await csv.read('./stations.csv', {
  header: true
})
console.log(result.parseMeta.fields)
```

```js
const result = await csv.read('./stations.csv', {
  header: ['name', 'longitude', 'latitude'],
  rowSchema: {
    type: 'object',
    properties: {
      name: {
        type: 'string'
      },
      longitude: {
        type: 'number'
      },
      latitude: {
        type: 'number'
      }
    },
    required: ['longitude', 'latitude']
  }
})
```

```js
const result = await csv.read('https://example.com/stations.csv', {
  header: true,
  request: {
    retries: 3,
    timeout: 5000
  }
})
```
