---
title: comparator
description: TEXT comparison functions
---

# text

## normalizeString

### Signature

```javascript
normalizeString(str, options)
```

### Description

Normalize a string before comparison by applying transformations based on the provided options.
Used internally by `text.isEqual` and `text.compare`.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| str | string | yes | The string to normalize |
| options | object | no | Normalization options |
| options.ignoreSpaces | boolean | no | Trim leading and trailing whitespace (default: false) |
| options.ignoreAccents | boolean | no | Strip accent characters (default: false) |
| options.ignoreCase | boolean | no | Convert to lowercase (default: false) |

### Returns

| Type | Description |
|------|-------------|
| string | The normalized string |

### Examples

```javascript
normalizeString('  Hello  ', { ignoreSpaces: true })
// 'Hello'
normalizeString('Héllo', { ignoreAccents: true })
// 'Hello'
normalizeString('Hello', { ignoreCase: true })
// 'hello'
normalizeString('  Héllo  ', { ignoreSpaces: true, ignoreAccents: true, ignoreCase: true })
// 'hello'
```

## isEqual

### Signature

```javascript
text.isEqual(text1, text2, options)
```

### Description

Check if two strings are equal after optional normalization.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| text1 | string | yes | The first string |
| text2 | string | yes | The second string |
| options | object | no | Normalization options (see `normalizeString`) |

### Returns

| Type | Description |
|------|-------------|
| boolean | True if both strings are equal after normalization |

### Examples

```javascript
text.isEqual('hello', 'hello')
// true
text.isEqual('Hello', 'hello', { ignoreCase: true })
// true
text.isEqual('  hello', 'hello', { ignoreSpaces: true })
// true
text.isEqual('héllo', 'hello', { ignoreAccents: true })
// true
text.isEqual('hello', 'world')
// false
```

## isEqualFile

### Signature

```javascript
text.isEqualFile(content, filePath, options)
```

### Description

Check if a string is equal to the content of a file after optional normalization.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| content | string | yes | The string to compare |
| filePath | string | yes | Path to the file |
| options | object | no | Normalization options (see `normalizeString`) |

### Returns

| Type | Description |
|------|-------------|
| boolean | True if the string match the file content |

### Examples

```javascript
text.isEqualFile('hello world', './fixtures/expected.txt')
// true or false
text.isEqualFile('Hello World', './fixtures/expected.txt', { ignoreCase: true })
// true or false
```

## isEqualFiles

### Signature

```javascript
text.isEqualFiles(path1, path2, options)
```

### Description

Check if two files have equal content after optional normalization.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| path1 | string | yes | Path to the first file |
| path2 | string | yes | Path to the second file |
| options | object | no | Normalization options (see `normalizeString`) |

### Returns

| Type | Description |
|------|-------------|
| boolean | True if both files have equal content |

### Examples

```javascript
text.isEqualFiles('./fixtures/actual.txt', './fixtures/expected.txt')
// true or false
text.isEqualFiles('./fixtures/actual.txt', './fixtures/expected.txt', { ignoreCase: true })
// true or false
```

