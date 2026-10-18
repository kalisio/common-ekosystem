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
| `PARSE_FAILED` | XML validation or parsing failed |

::: tip

By default, XML is parsed into JSON using `fast-xml-parser`.

When DOM output is requested, the native `DOMParser` is used when available. In Node.js, `@xmldom/xmldom` is loaded dynamically.

XML content is always validated before parsing, regardless of the selected output format.

:::

## parse

### Signature

```js
xml.parse(text, options = {})
```

### Description

Parses an XML string and returns either JSON data or a DOM `Document`.

JSON output is used by default.

Leading whitespace, including a potential BOM, is removed using `trimStart()` before validation and parsing. This accommodates XML documents containing characters preceding the XML declaration.

The content is validated using `XMLValidator` before being passed to the selected parser. Validation and parsing operate on the same normalized content.

### Parameters

| Name | Type | Req | Description |
| --- | --- | --- | --- |
| `text` | `string` | yes | XML text to parse |
| `options` | `object` | no | Parsing options |
| `options.output` | `'json' \| 'dom'` | no | Output format. Defaults to `'json'` |
| `options.parser` | `object` | no | Options passed to `fast-xml-parser` when using JSON output |
| `options.domParser` | `object` | no | DOM parser exposing a `parseFromString` function when using DOM output |

The JSON parser preserves XML attributes by default (`ignoreAttributes: false`). Other `fast-xml-parser` options can be customized through `options.parser`.

::: warning

By default, `fast-xml-parser` automatically converts tag values that look like numbers or booleans. For example, `<id>00123</id>` becomes `123`, and `<version>1.0</version>` becomes `1`.

Set `parser.parseTagValue: false` to preserve identifiers and textual values.

:::

### Returns

| Type | Description |
| --- | --- |
| `Promise<object \| Document>` | The parsed JSON data or DOM document |

### Throws

Throws an error if `text` is not a string or if `options` does not conform to the expected schema.

Throws an error with code `xml.ERROR_CODES.PARSE_FAILED` if XML validation or parsing fails.

When validation fails, the error message includes the validation details and their location in the document. The original validation information is available through `error.cause`, including the message, line and column.

For example:

```text
Invalid XML: Unclosed tag 'a'. (line 1, column 1)
```

When the selected parser itself fails, the original exception is preserved in `error.cause`.

If the Node.js DOM parser dependency cannot be loaded, the original import error is propagated rather than being reported as a parsing failure.

### Examples

Parse XML into JSON:

```js
import { xml } from '@kalisio/common-core/io'

const data = await xml.parse('<note><to>World</to></note>')
```

Pass options to `fast-xml-parser`:

```js
const data = await xml.parse('<note category="reminder"/>', {
  parser: {
    attributeNamePrefix: ''
  }
})
```

Preserve XML identifiers and textual values without automatic type conversion:

```js
const data = await xml.parse('<item><id>00123</id></item>', {
  parser: {
    parseTagValue: false
  }
})

// { item: { id: '00123' } }
```

Parse XML into a DOM document:

```js
const document = await xml.parse('<note><to>World</to></note>', {
  output: 'dom'
})
```

Use a custom DOM parser:

```js
const document = await xml.parse('<note><to>World</to></note>', {
  output: 'dom',
  domParser: customDomParser
})
```

Handle XML validation errors:

```js
try {
  await xml.parse('<note><to>World</note>')
} catch (error) {
  if (error.code === xml.ERROR_CODES.PARSE_FAILED) {
    console.error(error.message)
    console.error(error.cause)
  }
}
```

## read

### Signature

```js
xml.read(input, options = {})
```

### Description

Reads an external source as text, then parses the resulting content as XML.

A source can be a local file path in Node.js, a URL provided as a string or `URL` instance, or a `Blob`/`File` when supported by the runtime.

Source reading is delegated to `source.readAsText()`, while XML parsing follows the same behavior as `xml.parse()`.

JSON output is used by default.

### Parameters

| Name | Type | Req | Description |
| --- | --- | --- | --- |
| `input` | `string \| URL \| Blob \| File` | yes | Source containing XML data |
| `options` | `object` | no | Reading and parsing options |
| `options.encoding` | `string` | no | Character encoding used when reading a local file in Node.js. Defaults to `'utf-8'` |
| `options.request` | `object` | no | Options passed to `request` when reading a remote source |
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

Also propagates errors thrown by `xml.parse()`, including XML validation and parsing failures.

### Examples

Read XML into JSON:

```js
import { xml } from '@kalisio/common-core/io'

const data = await xml.read('./note.xml')
```

Read XML into a DOM document:

```js
const document = await xml.read('./note.xml', {
  output: 'dom'
})
```

Read XML from a remote source with request options:

```js
const data = await xml.read('https://example.com/service', {
  request: {
    timeout: 5000,
    retries: 2
  }
})
```

Customize XML parsing when reading a remote source:

```js
const capabilities = await xml.read(
  'https://example.com/wms?SERVICE=WMS&REQUEST=GetCapabilities',
  {
    parser: {
      removeNSPrefix: true,
      parseTagValue: false,
      parseAttributeValue: false
    }
  }
)
```

In this last example, namespace prefixes are removed, and XML tag and attribute values are preserved as strings.

Although `parseAttributeValue: false` is already the default behavior of `fast-xml-parser`, it is explicitly specified here to document the intended parsing behavior.

The `options.request` and `options.parser` settings can be combined to independently configure HTTP transport and XML parsing.
