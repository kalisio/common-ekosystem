# xml

## compare

### Signature

```javascript
compare(a, b, options)
```

### Description

Perform a deep comparison between two XML strings and return detailed differences.
The XML is parsed into objects to identify missing, extra, or updated tags and attributes.

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
const xmlA = `
<order>
  <id>1001</id>
  <customer>
    <name>Alice</name>
    <country>FR</country>
  </customer>
  <items>
    <item sku="A1">Book</item>
    <item sku="B2">Pen</item>
  </items>
</order>
`

const xmlB = `
<order>
  <id>1001</id>
  <customer>
    <name>Alice</name>
    <country>US</country>
  </customer>
  <items>
    <item sku="A1">Book</item>
    <item sku="B2">Pencil</item>
  </items>
  <status>shipped</status>
</order>
`

xml.compare(xmlA, xmlB)
/*
{
  isEqual: false,
  differences: {
    missing: [],
    extra: ["order.status"],
    updated: [
      { path: "order.customer.country", oldValue: "FR", newValue: "US" },
      { path: "order.items.item[1]", oldValue: "Pen", newValue: "Pencil" }
    ]
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
The comparison uses the same structural logic as JSON comparison, allowing nested elements and attributes to be compared reliably.

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

Ignore case in text nodes:

```javascript
const xml1 = `
<message>
  <title>Hello</title>
</message>
`

const xml2 = `
<message>
  <title>hello</title>
</message>
`

xml.isEqual(xml1, xml2, { ignoreCase: true })
// true
```

Detect structural difference:

```javascript
const xml1 = `
<user>
  <name>Alice</name>
  <role>admin</role>
</user>
`

const xml2 = `
<user>
  <name>Alice</name>
  <role>user</role>
</user>
`

xml.isEqual(xml1, xml2)
// false
```

Compare nested lists:

```javascript
const xml1 = `
<catalog>
  <products>
    <product id="1">Book</product>
    <product id="2">Pen</product>
  </products>
</catalog>
`

const xml2 = `
<catalog>
  <products>
    <product id="1">Book</product>
    <product id="2">Pen</product>
  </products>
</catalog>
`

xml.isEqual(xml1, xml2)
// true
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

### Example

`config.xml`

```
<config>
  <database>
    <host>localhost</host>
    <port>5432</port>
  </database>
</config>
```

```javascript
const xml = `
<config>
  <database>
    <host>localhost</host>
    <port>5432</port>
  </database>
</config>
`

xml.isEqualFile(xml, "./config.xml")
// true
```

```javascript
xml.isEqualFile("<config></config>", "./config.xml")
// false
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

### Example

`config.xml`

```
<config>
  <theme>dark</theme>
  <language>en</language>
</config>
```

`backup.xml`

```
<config>
  <language>en</language>
  <theme>dark</theme>
</config>
```

```javascript
xml.isEqualFiles("./config.xml", "./backup.xml")
// true
```

```javascript
xml.isEqualFiles("./config.xml", "./modified.xml")
// false
```