# xml

## compare

### Signature

```javascript
compare(a, b, options)
```

### Description

Perform a deep comparison between two XML strings and return detailed differences.  
The XML is converted to objects to identify missing, extra, or updated tags and attributes.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| a | string | yes | The source XML string |
| b | string | yes | The target XML string |
| options | Object | no | Normalization options |

### Returns

| Type | Description |
|------|-------------|
| Object | An object containing `isEqual` (boolean) and `differences` (missing, extra, updated) |

### Examples

```javascript
const xmlA = '<root><val>1</val></root>'
const xmlB = '<root><val>2</val></root>'

xml.compare(xmlA, xmlB)
/*
{
  isEqual: false,
  differences: {
    missing: [],
    extra: [],
    updated: [{ path: 'root.val', oldValue: '1', newValue: '2' }]
  }
}
*/
```

## isEqual

### Signature

```javascript
isEqual(xml1, xml2, options)
```

### Description

Compares two XML strings after normalization and parsing into objects.  
The comparison uses the `json.isEqual` logic once the XML is parsed, allowing for a structural comparison that ignores tag order if necessary.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| xml1 | string | yes | The first XML string to compare |
| xml2 | string | yes | The second XML string to compare |
| options | Object | no | Normalization options |
| options.ignoreCase | boolean | no | Whether to ignore case differences |
| options.ignoreSpaces | boolean | no | Whether to ignore leading/trailing spaces |
| options.ignoreAccents | boolean | no | Whether to remove accents before comparison |

### Returns

| Type | Description |
|------|-------------|
| boolean | True if the parsed XML structures are equal, false otherwise |

### Examples

```javascript
const xml1 = '<root><item id="1">Hello</item></root>'
const xml2 = '<root><item id="1">hello</item></root>'

xml.isEqual(xml1, xml2, { ignoreCase: true }) // true
```

## isEqualFile

### Signature

```javascript
isEqualFile(content, filePath, options)
```

### Description

Compare an XML string with the content of an XML file.  
The file is read, and both the input string and the file content are parsed and compared structurally.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| content | string | yes | The XML string to compare |
| filePath | string | yes | The path to the XML file |
| options | Object | no | Normalization options |

### Returns

| Type | Description |
|------|-------------|
| boolean | True if the XML content matches the file content |

### Examples

```javascript
xml.isEqualFile('<root/>', './data.xml')
```

## isEqualFiles

### Signature

```javascript
isEqualFiles(path1, path2, options)
```

### Description

Compare the content of two different XML files.  
Both files are read and parsed to ensure they are structurally identical.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| path1 | string | yes | Path to the first XML file |
| path2 | string | yes | Path to the second XML file |
| options | Object | no | Normalization options |

### Returns

| Type | Description |
|------|-------------|
| boolean | True if both files are structurally equal |

### Examples

```javascript
xml.isEqualFiles('./config.xml', './backup.xml')
```
