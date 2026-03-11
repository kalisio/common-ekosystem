---
title: xml
description: XML comparison functions
---

# xml

The `xml` module exposes the same interface as `json` (`isEqual`, `isEqualFile`, `isEqualFiles`, `compare`) but accepts XML strings as input. Both strings are parsed into objects before comparison.

## isEqual

### Signature

```javascript
xml.isEqual(xml1, xml2, options)
```

### Description

Check if two XML strings are semantically equal. Both strings are parsed into objects and compared using deep equality.
Throws a `TypeError` if either argument is not a non-empty string.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| xml1 | string | yes | The first XML string |
| xml2 | string | yes | The second XML string |
| options | object | no | Comparison options |
| options.parser | object | no | Additional options passed to the XML parser |

### Returns

| Type | Description |
|------|-------------|
| boolean | True if both XML strings are semantically equal |

### Examples

```javascript
xml.isEqual('Alice', '  Alice  ')
// true
xml.isEqual('1', '2')
// false
xml.isEqual('1', '1')
// false — attributes compared
```

## isEqualFile

### Signature

```javascript
xml.isEqualFile(xml, xmlFilePath, options)
```

### Description

Check if an XML string is semantically equal to the content of an XML file.
Throws a `TypeError` if either argument is not a non-empty string.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| xml | string | yes | The XML string to compare |
| xmlFilePath | string | yes | Path to the XML file |
| options | object | no | Comparison options (see `isEqual`) |

### Returns

| Type | Description |
|------|-------------|
| boolean | True if the XML string matches the file content |

### Examples

```javascript
xml.isEqualFile('Alice', './fixtures/expected.xml')
// true or false
```

## isEqualFiles

### Signature

```javascript
xml.isEqualFiles(xmlFilePath1, xmlFilePath2, options)
```

### Description

Check if two XML files are semantically equal.
Throws a `TypeError` if either argument is not a non-empty string.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| xmlFilePath1 | string | yes | Path to the first XML file |
| xmlFilePath2 | string | yes | Path to the second XML file |
| options | object | no | Comparison options (see `isEqual`) |

### Returns

| Type | Description |
|------|-------------|
| boolean | True if both files are semantically equal |

### Examples

```javascript
xml.isEqualFiles('./fixtures/actual.xml', './fixtures/expected.xml')
// true or false
```

## compare

### Signature

```javascript
xml.compare(xml1, xml2, options)
```

### Description

Compare two XML strings and return a detailed diff. Both strings are parsed into objects before comparison.
Throws a `TypeError` if either argument is not a non-empty string.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| xml1 | string | yes | The first XML string |
| xml2 | string | yes | The second XML string |
| options | object | no | Comparison options (see `isEqual`) |

### Returns

| Type | Description |
|------|-------------|
| object | An object with `isEqual` (boolean) and `differences` (object with `missing`, `extra`, `updated`) |

### Examples

```javascript
xml.compare('', '')
// { isEqual: true, differences: { missing: [], extra: [], updated: [] } }

xml.compare('1', '2')
// { isEqual: false, differences: { missing: [], extra: [], updated: [{ path: 'root.count', oldValue: '1', newValue: '2' }] } }

xml.compare('1', '1')
// { isEqual: false, differences: { missing: ['root.a'], extra: ['root.b'], updated: [] } }
```
