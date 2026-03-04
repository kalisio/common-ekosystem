# yaml

## compare

### Signature

```javascript
compare(a, b, options)
```

### Description

Perform a deep comparison between two YAML strings and return detailed differences.  
The YAML is converted to objects to identify missing, extra, or updated properties.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| a | string | yes | The source YAML string |
| b | string | yes | The target YAML string |
| options | Object | no | Normalization options |

### Returns

| Type | Description |
|------|-------------|
| Object | An object containing `isEqual` (boolean) and `differences` (missing, extra, updated) |

### Examples

```javascript
const yamlA = "version: 1\nitems: [a, b]"
const yamlB = "version: 2\nitems: [a, b]"

yaml.compare(yamlA, yamlB)
/*
{
  isEqual: false,
  differences: {
    missing: [],
    extra: [],
    updated: [{ path: 'version', oldValue: 1, newValue: 2 }]
  }
}
*/
```

## isEqual

### Signature

```javascript
isEqual(yaml1, yaml2, options)
```

### Description

Compares two YAML strings after normalization and parsing into objects.  
The comparison uses the `json.isEqual` logic once the YAML is parsed, allowing for structural comparison that ignores key order. It can ignore case, surrounding spaces, and accents based on the provided options.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| yaml1 | string | yes | The first YAML string to compare |
| yaml2 | string | yes | The second YAML string to compare |
| options | Object | no | Normalization options |
| options.ignoreCase | boolean | no | Whether to ignore case differences |
| options.ignoreSpaces | boolean | no | Whether to ignore leading/trailing spaces |
| options.ignoreAccents | boolean | no | Whether to remove accents before comparison |

### Returns

| Type | Description |
|------|-------------|
| boolean | True if the parsed YAML structures are equal, false otherwise |

### Examples

```javascript
yaml.isEqual("key: Valeur", "key: valeur", { ignoreCase: true }) // true
yaml.isEqual("name:  John", "name: John", { ignoreSpaces: true }) // true
```

## isEqualFile

### Signature

```javascript
isEqualFile(content, filePath, options)
```

### Description

Compare a YAML string with the content of a YAML file.  
The file is read as UTF-8, and both the input string and the file content are parsed and compared structurally.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| content | string | yes | The YAML string to compare |
| filePath | string | yes | The path to the YAML file |
| options | Object | no | Normalization options |

### Returns

| Type | Description |
|------|-------------|
| boolean | True if the YAML content matches the file content |

### Examples

```javascript
yaml.isEqualFile("status: active", "./config.yaml")
```

## isEqualFiles

### Signature

```javascript
isEqualFiles(path1, path2, options)
```

### Description

Compare the content of two different YAML files.  
Both files are read and parsed to ensure they represent the same data structure, regardless of key order or formatting.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| path1 | string | yes | Path to the first YAML file |
| path2 | string | yes | Path to the second YAML file |
| options | Object | no | Normalization options |

### Returns

| Type | Description |
|------|-------------|
| boolean | True if both files are structurally equal |

### Examples

```javascript
yaml.isEqualFiles("./env.prod.yaml", "./env.backup.yaml")
```

