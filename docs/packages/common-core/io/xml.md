---
title: xml
description: Utility functions for parsing and reading XML data.
---

# xml

Utility functions for parsing XML text and reading XML data from external sources.

It exposes the following error codes:

| Code | Description |
| --- | --- |
| `UNSUPPORTED_SOURCE` | The source type is not supported |
| `READ_FAILED` | Reading the source failed |
| `HTTP_ERROR` | An HTTP request returned an unsuccessful response |
| `PARSE_FAILED` | XML parsing failed |
| `INVALID_XML` | The XML content is invalid |

::: tip

By default, XML is parsed into JSON using `fast-xml-parser`.

When DOM output is requested, the native `DOMParser` is used when available. In Node.js, `@xmldom/xmldom` is loaded dynamically.

:::

## parse

### Signature

```js
xml.parse(text, options = {})
```

### Description

Parses an XML string and returns either JSON data or a DOM `Document`.

JSON output is used by default.

### Parameters

| Name | Type | Req | Description |
| --- | --- | --- | --- |
| `text` | `string` | yes | XML text to parse |
| `options` | `object` | no | Parsing options |
| `options.output` | `'json' \| 'dom'` | no | Output format. Defaults to `'json'` |
| `options.parser` | `object` | no | Options passed to `fast-xml-parser` when using JSON output |
| `options.domParser` | `object` | no | DOM parser exposing a `parseFromString` function when using DOM output |

### Returns

| Type | Description |
| --- | --- |
| `Promise<object \| Document>` | The parsed JSON data or DOM document |

### Throws

Throws a `TypeError` if `text` is not a string or if `options` does not conform to the expected schema.

Throws an error with code `xml.ERROR_CODES.INVALID_XML` if the XML content is invalid.

Throws an error with code `xml.ERROR_CODES.PARSE_FAILED` if parsing fails.

### Examples

Parse XML into JSON:

```js
import { xml } from '@kalisio/common-core'

const data = await xml.parse('<note><to>World</to></note>')
```

Pass options to `fast-xml-parser`:

```js
import { xml } from '@kalisio/common-core'

const data = await xml.parse('<note category="reminder"/>', {
  parser: {
    attributeNamePrefix: ''
  }
})
```

Parse XML into a DOM document:

```js
import { xml } from '@kalisio/common-core'

const document = await xml.parse('<note><to>World</to></note>', {
  output: 'dom'
})
```

## read

### Signature

```js
xml.read(input, options = {})
```

### Description

Reads an external source as text, then parses the resulting content as XML.

A source can be a local file path in Node.js, a URL provided as a string or `URL` instance, or a `Blob`/`File` when supported by the runtime.

JSON output is used by default.

### Parameters

| Name | Type | Req | Description |
| --- | --- | --- | --- |
| `input` | `string \| URL \| Blob \| File` | yes | Source containing XML data |
| `options` | `object` | no | Reading and parsing options |
| `options.encoding` | `string` | no | Character encoding used when reading a local file in Node.js. Defaults to `'utf-8'` |
| `options.output` | `'json' \| 'dom'` | no | Output format. Defaults to `'json'` |
| `options.parser` | `object` | no | Options passed to `fast-xml-parser` when using JSON output |
| `options.domParser` | `object` | no | DOM parser exposing a `parseFromString` function when using DOM output |

### Returns

| Type | Description |
| --- | --- |
| `Promise<object \| Document>` | The parsed JSON data or DOM document |

### Throws

Throws an error with code `xml.ERROR_CODES.UNSUPPORTED_SOURCE` if the source type is not supported.

Throws an error with code `xml.ERROR_CODES.READ_FAILED` if the source cannot be read.

For failed HTTP responses, the cause has code `xml.ERROR_CODES.HTTP_ERROR` and exposes the HTTP `status` and `statusText`.

Also propagates errors thrown by `xml.parse`.

### Examples

Read XML into JSON:

```js
import { xml } from '@kalisio/common-core'

const data = await xml.read('./note.xml')
```

Read XML into a DOM document:

```js
import { xml } from '@kalisio/common-core'

const document = await xml.read('./note.xml', {
  output: 'dom'
})
```
