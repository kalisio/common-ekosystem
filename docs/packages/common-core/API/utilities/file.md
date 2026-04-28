---
title: file
description: Utility functions for parsing file paths and formatting file sizes.
---

# file

## parse

### Signature

```js
file.parse(filePath)
```

### Description

Parses a file path into its components. Supports both Unix and Windows path separators.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `filePath` | `string` | yes | The file path to parse |

### Returns

| Type | Description |
|------|-------------|
| `object` | An object containing the parsed components |

| Property | Type | Description |
|----------|------|-------------|
| `fileName` | `string` | The full file name including extension |
| `extension` | `string` | The full extension including the dot (e.g. `.tar.gz`), or `''` if none |
| `baseName` | `string` | The file name without extension |
| `dir` | `string` | The directory path, `'.'` if no directory, or `''` if at root |

### Throws

Throws a `TypeError` if `filePath` is not a string.

### Examples

```js
file.parse('/foo/bar/baz.txt')
// { fileName: 'baz.txt', extension: '.txt', baseName: 'baz', dir: '/foo/bar' }

file.parse('C:\\foo\\bar\\baz.txt')
// { fileName: 'baz.txt', extension: '.txt', baseName: 'baz', dir: 'C:/foo/bar' }

file.parse('/foo/bar/archive.tar.gz')
// { fileName: 'archive.tar.gz', extension: '.tar.gz', baseName: 'archive', dir: '/foo/bar' }

file.parse('/foo/.bashrc')
// { fileName: '.bashrc', extension: '', baseName: '.bashrc', dir: '/foo' }

file.parse('/baz.txt')
// { fileName: 'baz.txt', extension: '.txt', baseName: 'baz', dir: '' }

file.parse('baz.txt')
// { fileName: 'baz.txt', extension: '.txt', baseName: 'baz', dir: '.' }
```

## formatSize

### Signature

```js
file.formatSize(bytes)
```

### Description

Converts a size in bytes into a human-readable value and unit. The unit is automatically selected based on the magnitude of the value.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `bytes` | `number` | yes | The size in bytes |

### Returns

| Type | Description |
|------|-------------|
| `object` | An object containing the formatted value and unit |

| Property | Type | Description |
|----------|------|-------------|
| `value` | `number` | The numeric value, rounded to 2 decimal places if not an integer |
| `unit` | `string` | One of `'B'`, `'KB'`, `'MB'`, `'GB'` |

### Throws

Throws a `TypeError` if `bytes` is not a number.

### Examples

```js
file.formatSize(512)
// { value: 512, unit: 'B' }

file.formatSize(1024)
// { value: 1, unit: 'KB' }

file.formatSize(1500)
// { value: 1.46, unit: 'KB' }

file.formatSize(1024 ** 2)
// { value: 1, unit: 'MB' }

file.formatSize(1024 ** 3)
// { value: 1, unit: 'GB' }
```