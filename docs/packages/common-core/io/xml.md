---
title: xml
description: Utility functions for parsing and reading XML data.
---

# xml

Utility functions for parsing XML text and reading XML data from external sources.

The native `DOMParser` is used when available. In Node.js, `@xmldom/xmldom` is loaded dynamically.

## Properties

| Name | Type | Description |
| --- | --- | --- |
| `PARSE_FAILED` | `string` | Error code returned when XML parsing fails |
| `INVALID_XML` | `string` | Error code used when the parser reports an invalid XML document |
| `PARSE_OPTIONS_SCHEMA` | `object` | Validation schema for XML parsing options |

## parse

### Signature

```js
xml.parse(text, options = {})
```

### Description

Parses an XML string and returns a DOM `Document`.

A custom DOM parser can be provided through `options.domParser`. It must expose a `parseFromString` function.

### Parameters

| Name | Type | Required | Description |
| --- | --- | --- | --- |
| `text` | `string` | yes | XML text to parse |
| `options` | `object` | no | Parsing options |
| `options.domParser` | `object` | no | DOM parser exposing a `parseFromString` function |

### Returns

| Type | Description |
| --- | --- |
| `Promise<Document>` | The parsed DOM document |

### Throws

Throws a `TypeError` if `text` is not a string or if `options` does not conform to the expected schema.

Throws an error with code `xml.PARSE_FAILED` if parsing fails. The original parser error is available through the `cause` property.

When the parser returns a document containing a `parsererror` element, the cause has code `xml.INVALID_XML`.

### Examples

```js
import { xml } from '@kalisio/common-core'

const document = await xml.parse('<note><to>World</to></note>')

document.documentElement.nodeName
// 'note'

document.getElementsByTagName('to')[0].textContent
// 'World'
```

## read

### Signature

```js
xml.read(source, options = {})
```

### Description

Reads an external source as text using `source.readAsText`, then parses the resulting text as XML.

### Parameters

| Name | Type | Required | Description |
| --- | --- | --- | --- |
| `source` | `string \| URL \| Blob \| File` | yes | Source containing XML data |
| `options` | `object` | no | Reading and parsing options |
| `options.encoding` | `string` | no | Character encoding used when reading a local file in Node.js. Defaults to `'utf-8'` |
| `options.domParser` | `object` | no | DOM parser exposing a `parseFromString` function |

### Returns

| Type | Description |
| --- | --- |
| `Promise<Document>` | The parsed DOM document |

### Throws

Propagates errors thrown by `source.readAsText` and `xml.parse`.

### Examples

```js
import { xml } from '@kalisio/common-core'

const document = await xml.read('./note.xml')
```