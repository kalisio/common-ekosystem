---
title: dom
description: Utility functions for navigating DOM trees and extracting values from XML and HTML documents.
---

# dom

Utility functions for navigating DOM trees and extracting values from XML and HTML documents. Compatible with 
native browser DOM implementations and `@xmldom/xmldom` in Node.js.

All methods accept `null` or `undefined` as their node argument to facilitate chained lookups. Other values 
must be DOM-compatible objects exposing an integer `nodeType`.

::: tip

The module can be used with the [io/XML](../io/xml.md) reader:

```js
import { xml } from '@kalisio/common-core/io/xml'
import { dom } from '@kalisio/common-core/utilities/dom'

const document = await xml.read(url, { output: 'dom' })
const root = document.documentElement
const service = dom.child(root, 'Service')
const title = dom.text(dom.child(service, 'Title'))
const layers = dom.children(root, 'Layer')
```

or with the browser's native DOM:

```js
import { dom } from '@kalisio/common-core/utilities/dom'

const heading = dom.text(dom.child(document.body, 'h1'))
const links = dom.children(document.body, 'a')
const href = dom.attr(links[0], 'href')
```

Unlike `querySelectorAll()`, `dom.children()` only searches direct children.
The module relies on standard DOM interfaces and does not require a CSS selector engine or an additional DOM dependency. 
Parsing remains the responsibility of the corresponding IO module.
:::

## children

### Signature

```js
dom.children (node, name?)
```

### Description

Returns the direct element children of a DOM node, optionally filtered by their `localName`.

Only direct children are considered. Text nodes, comments and nested descendants are excluded.

Element matching is case-sensitive and independent of XML namespace prefixes.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `node` | `Node \| null \| undefined` | yes | The parent DOM node |
| `name` | `string` | no | Non-empty local name used to filter children |

### Returns

| Type | Description |
|------|-------------|
| `Element[]` | Matching direct element children, or an empty array when no elements match or the node is missing |

### Throws

Throws an assertion error if `node` is not a DOM-compatible node, `null` or `undefined`, or if `name` is provided but is not a non-empty string.

### Examples

```js
const layers = dom.children(root, 'Layer')
const elements = dom.children(root)

dom.children(root, 'Unknown')
// []

dom.children(null, 'Layer')
// []
```

For XML elements such as `<ows:Title>`, the namespace prefix can be omitted:

```js
dom.children(root, 'Title')
```

## child

### Signature

```js
dom.child (node, name?)
```

### Description

Returns the first matching direct element child of a DOM node.

When `name` is omitted, returns the first direct element child regardless of its name.

This method follows the same navigation and matching rules as `dom.children()`.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `node` | `Node \| null \| undefined` | yes | The parent DOM node |
| `name` | `string` | no | Non-empty local name used to select a child |

### Returns

| Type | Description |
|------|-------------|
| `Element \| null` | The first matching direct element child, or `null` when no element matches or the node is missing |

### Throws

Throws an assertion error if `node` is not a DOM-compatible node, `null` or `undefined`, or if `name` is provided but is not a non-empty string.

### Examples

```js
const service = dom.child(root, 'Service')
const title = dom.child(service, 'Title')
const firstElement = dom.child(root)

dom.child(root, 'Unknown')
// null

dom.child(null, 'Title')
// null
```

## text

### Signature

```js
dom.text (node)
```

### Description

Extracts the trimmed `textContent` of a DOM node.

Leading and trailing whitespace is removed. Text content from nested descendants is included.

An existing node with empty or whitespace-only text content returns an empty string. A missing node returns `undefined`.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `node` | `Node \| null \| undefined` | yes | The DOM node from which to extract text |

### Returns

| Type | Description |
|------|-------------|
| `string \| undefined` | Trimmed text content, or `undefined` if the node or its text content is missing |

### Throws

Throws an assertion error if `node` is not a DOM-compatible node, `null` or `undefined`.

### Examples

Given the following XML:

```xml
<Service>
  <Title> My Service </Title>
  <Description>Some <Emphasis>important</Emphasis> information</Description>
  <Empty />
</Service>
```

```js
dom.text(dom.child(service, 'Title'))
// 'My Service'

dom.text(dom.child(service, 'Description'))
// 'Some important information'

dom.text(dom.child(service, 'Empty'))
// ''

dom.text(dom.child(service, 'Unknown'))
// undefined
```

## number

### Signature

```js
dom.number (node)
```

### Description

Extracts the trimmed text content of a DOM node and converts it to a number using JavaScript's `Number()` function.

Only finite numeric results are accepted, as verified by `Number.isFinite()`.

Empty, missing, non-numeric and non-finite values return `undefined`.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `node` | `Node \| null \| undefined` | yes | The DOM node containing the numeric value |

### Returns

| Type | Description |
|------|-------------|
| `number \| undefined` | The converted finite number, or `undefined` if conversion is not possible |

### Throws

Throws an assertion error if `node` is not a DOM-compatible node, `null` or `undefined`.

### Examples

Given the following XML:

```xml
<Matrix>
  <Width>256</Width>
  <Height>256</Height>
  <Scale>-12.5</Scale>
  <Zero>0</Zero>
  <Invalid>abc</Invalid>
  <Infinite>Infinity</Infinite>
  <Empty />
</Matrix>
```

```js
dom.number(dom.child(matrix, 'Width'))
// 256

dom.number(dom.child(matrix, 'Scale'))
// -12.5

dom.number(dom.child(matrix, 'Zero'))
// 0

dom.number(dom.child(matrix, 'Invalid'))
// undefined

dom.number(dom.child(matrix, 'Infinite'))
// undefined

dom.number(dom.child(matrix, 'Empty'))
// undefined

dom.number(null)
// undefined
```

## attrribute

### Signature

```js
dom.attribute(node, name)
```

### Description

Returns the value of an attribute, supporting both regular and namespaced attributes.

Attribute lookup follows two steps:

1. Check whether an exact attribute exists using `hasAttribute(name)`. If present, return its value using `getAttribute(name)`.
2. Otherwise, search the node's attributes for the first matching `localName`.

Using `hasAttribute()` avoids compatibility issues with DOM implementations such as `@xmldom/xmldom`, where `getAttribute()` may return an empty string for a missing attribute.

An exact match always takes precedence over a local-name match.

Existing empty attribute values are preserved as `''`, while missing attributes return `undefined`.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `node` | `Node \| null \| undefined` | yes | The DOM node containing the attribute |
| `name` | `string` | yes | Non-empty attribute name or local name |

### Returns

| Type | Description |
|------|-------------|
| `string \| undefined` | The attribute value, or `undefined` when the attribute or node is missing |

### Throws

Throws an assertion error if `node` is not a DOM-compatible node, `null` or `undefined`, or if `name` is not a non-empty string.

### Examples

Given the following XML:

```xml
<Root xmlns:xlink="http://www.w3.org/1999/xlink">
  <Resource xlink:href="https://example.com/resource" />
  <Direct href="https://example.com/direct" />
  <Both href="plain" xlink:href="qualified" />
  <Empty href="" />
</Root>
```

```js
const resource = dom.child(root, 'Resource')
dom.attr(resource, 'href')
// 'https://example.com/resource'

dom.attr(resource, 'xlink:href')
// 'https://example.com/resource'

const direct = dom.child(root, 'Direct')
dom.attr(direct, 'href')
// 'https://example.com/direct'

const both = dom.child(root, 'Both')
dom.attr(both, 'href')
// 'plain'

dom.attr(both, 'xlink:href')
// 'qualified'

dom.attr(dom.child(root, 'Empty'), 'href')
// ''

dom.attr(resource, 'unknown')
// undefined

dom.attr(null, 'href')
// undefined
```

When multiple namespaced attributes share the same local name, use their qualified names to avoid ambiguity.


