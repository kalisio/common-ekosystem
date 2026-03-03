# text

## compare

### Signature

```javascript
compare(a, b, options)
```

### Description

Perform a comparison between two strings and return the status along with detailed differences.  
Differences are reported at the "text" path if the strings do not match after normalization.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| a | string | yes | The source string |
| b | string | yes | The target string |
| options | Object | no | Normalization options |

### Returns

| Type | Description |
|------|-------------|
| Object | An object containing `isEqual` (boolean) and `differences` (updated) |

### Examples

```javascript
text.compare("Apple", "apple", { ignoreCase: false })
/*
{
  isEqual: false,
  differences: {
    updated: [{ path: 'text', oldValue: 'Apple', newValue: 'apple' }]
  }
}
*/
```

## isEqual

### Signature

```javascript
isEqual(text1, text2, options)
```

### Description

Compares two strings after normalization.  
The comparison can ignore case differences, surrounding spaces (trim), and/or accents (diacritical marks) based on the provided options.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| text1 | string | yes | The first string to compare |
| text2 | string | yes | The second string to compare |
| options | Object | no | Normalization options |
| options.ignoreCase | boolean | no | Whether to ignore case differences (default: false) |
| options.ignoreSpaces | boolean | no | Whether to ignore leading/trailing spaces (default: false) |
| options.ignoreAccents | boolean | no | Whether to remove accents before comparison (default: false) |

### Returns

| Type | Description |
|------|-------------|
| boolean | True if the normalized strings are equal, false otherwise |

### Examples

```javascript
text.isEqual("École", "ecole", { ignoreCase: true, ignoreAccents: true }) // true
text.isEqual(" Hello ", "hello", { ignoreCase: true, ignoreSpaces: true }) // true
```

## isEqualFile

### Signature

```javascript
isEqualFile(content, filePath, options)
```

### Description

Compare a string content with the content of a file.  
The file is read as UTF-8 and both strings are normalized according to the options before comparison.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| content | string | yes | The string to compare |
| filePath | string | yes | The path to the file to read |
| options | Object | no | Normalization options |

### Returns

| Type | Description |
|------|-------------|
| boolean | True if the content matches the file content after normalization |

### Examples

```javascript
text.isEqualFile("Hello World", "./greeting.txt", { ignoreCase: true })
```

## isEqualFiles

### Signature

```javascript
isEqualFiles(path1, path2, options)
```

### Description

Compare the content of two different files.  
Both files are read and their contents are normalized before being compared.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| path1 | string | yes | Path to the first file |
| path2 | string | yes | Path to the second file |
| options | Object | no | Normalization options |

### Returns

| Type | Description |
|------|-------------|
| boolean | True if both files contain the same normalized text |

### Examples

```javascript
text.isEqualFiles("./doc1.txt", "./doc2.txt", { ignoreSpaces: true })
```
