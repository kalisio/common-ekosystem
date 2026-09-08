---
title: yaml
description: Utility functions for parsing and reading YAML data.
---

# yaml

Utility functions for parsing YAML text and reading YAML data from external sources.

It exposes the following error codes:

| Code | Description |
| --- | --- |
| `UNSUPPORTED_SOURCE` | The source type is not supported |
| `READ_FAILED` | Reading the source failed |
| `HTTP_ERROR` | An HTTP request returned an unsuccessful response |
| `PARSE_FAILED` | YAML parsing failed |

## parse

### Signature

```js
yaml.parse(text, options = {})
```

### Description

Parses a YAML string using `js-yaml` and returns the resulting JavaScript value.

### Parameters

| Name | Type | Req | Description |
| --- | --- | --- | --- |
| `text` | `string` | yes | YAML text to parse |
| `options` | `object` | no | Parsing options |
| `options.parser` | `object` | no | Options passed to `js-yaml` |

### Returns

| Type | Description |
| --- | --- |
| `object \| array \| string \| number \| boolean \| null` | The parsed YAML value |

### Throws

Throws a `TypeError` if `text` is not a string or if `options` does not conform to the expected schema.

Throws an error with code `yaml.ERROR_CODES.PARSE_FAILED` if parsing fails.

### Examples

```js
import { yaml } from '@kalisio/common-core'

const data = yaml.parse(`
name: Kalisio
enabled: true
`)
```

Pass options to `js-yaml`:

```js
import { yaml } from '@kalisio/common-core'

const data = yaml.parse('name: Kalisio', {
  parser: {
    json: true
  }
})
```

## read

### Signature

```js
yaml.read(input, options = {})
```

### Description

Reads an external source as text, then parses the resulting content as YAML.

A source can be a local file path in Node.js, a URL provided as a string or `URL` instance, or a `Blob`/`File` when supported by the runtime.

### Parameters

| Name | Type | Req | Description |
| --- | --- | --- | --- |
| `input` | `string \| URL \| Blob \| File` | yes | Source containing YAML data |
| `options` | `object` | no | Reading and parsing options |
| `options.encoding` | `string` | no | Character encoding used when reading a local file in Node.js. Defaults to `'utf-8'` |
| `options.parser` | `object` | no | Options passed to `js-yaml` |

### Returns

| Type | Description |
| --- | --- |
| `Promise<object \| array \| string \| number \| boolean \| null>` | The parsed YAML value |

### Throws

Throws an error with code `yaml.ERROR_CODES.UNSUPPORTED_SOURCE` if the source type is not supported.

Throws an error with code `yaml.ERROR_CODES.READ_FAILED` if the source cannot be read.

For failed HTTP responses, the cause has code `yaml.ERROR_CODES.HTTP_ERROR` and exposes the HTTP `status` and `statusText`.

Also propagates errors thrown by `yaml.parse`.

### Examples

```js
import { yaml } from '@kalisio/common-core'

const data = await yaml.read('./config.yaml')
```
