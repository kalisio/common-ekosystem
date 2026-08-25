---

title: csv
description: Parse and read CSV sources with optional row mapping and JSON Schema validation.
---

# csv

This module provides helpers to parse and read CSV data using [PapaParse](https://www.papaparse.com/).

It extends PapaParse with:

* support for an externally supplied header,
* optional row validation using JSON Schema and AJV,
* automatic type coercion driven by the row schema.

The `csv` namespace also exposes the error codes inherited from the `source` module through `csv.ERROR_CODES`.

## csv.parse

### Signature

```js
csv.parse (text, options)
```

### Description

Parses CSV text using PapaParse.

By default, rows are returned as arrays.

The `header` option controls how columns are mapped:

* if omitted, rows remain arrays,
* if `true`, the first row of the CSV is used as the header and rows are returned as objects,
* if an array of strings is provided, the CSV is assumed to have no header and the supplied names are used to map each row to an object.

When a custom header is provided, `meta.fields` is populated with the supplied column names.

Additional PapaParse configuration can be supplied through the `parser` option.

An optional JSON Schema can be provided through `rowSchema`. When present, every parsed row is validated using AJV with type coercion enabled. Values may therefore be converted in place according to the types declared in the schema.

Rows that do not conform to the schema remain in `data`. Validation errors are collected separately in `validationErrors`.

### Parameters

| Name                | Type               | Required | Description                                                                                                                                      |
| ------------------- | ------------------ | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `text`              | `string`           | yes      | CSV content to parse                                                                     |
| `options`           | `object`           | no       | Parsing options                                                                          |
| `options.header`    | `true \| string[]` | no       | If `true`, uses the first CSV row as the header. If an array is provided, uses these values as column names without consuming a row from the CSV |
| `options.parser`    | `object`           | no       | PapaParse configuration options passed directly to `Papa.parse`                          |
| `options.rowSchema` | `object`           | no       | JSON Schema applied to every parsed row                                                  |

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
{
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

Rows that fail JSON Schema validation remain in `data`.

When `rowSchema` is provided, AJV type coercion is enabled and parsed values may be converted in place according to the types declared in the schema.

### Throws

Throws if `text` is not a string.

Throws if `options` does not match the expected schema.

Throws if `parser.dynamicTyping` is enabled together with `rowSchema`.

Throws if `rowSchema` cannot be compiled by AJV.

`dynamicTyping` cannot be used with `rowSchema` because type coercion is driven by the JSON Schema when row validation is enabled.

### Examples

```js
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

// result.meta.fields
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

// result.meta.fields
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
await csv.read (input, options)
```

### Description

Reads a source as text using `source.readAsText`, then parses the resulting CSV content using `csv.parse`.

All options accepted by `csv.parse` are supported.

### Parameters

| Name      | Type     | Required | Description                                 |
| --------- | -------- | -------- | ------------------------------------------- |
| `input`   | source   | yes      | Any source supported by `source.readAsText` |
| `options` | `object` | no       | Options forwarded to `csv.parse`            |

### Returns

| Type              | Description                        |
| ----------------- | ---------------------------------- |
| `Promise<object>` | The result returned by `csv.parse` |

### Throws

Throws if the source cannot be read.

Throws under the same conditions as `csv.parse`.

### Examples

```js
const result = await csv.read('./stations.csv', {
  header: true
})

console.log(result.meta.fields)
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
