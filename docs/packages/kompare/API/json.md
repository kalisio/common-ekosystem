---
title: json
description: JSON comparison functions
---

# json

## isEqual

### Signature

```javascript
json.isEqual(json1, json2, options)
```

### Description

Check if two JSON objects are deeply equal after normalization.
Key order is ignored, array elements are sorted, and string values can be normalized using the same options as `text`.
Throws a `TypeError` if either argument is not a non-empty string.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| json1 | object | yes | The first JSON object |
| json2 | object | yes | The second JSON object |
| options | object | no | Comparison options |
| options.ignoredKeys | string[] | no | Keys to exclude from comparison |
| options.ignoreCase | boolean | no | Normalize string values to lowercase |
| options.ignoreAccents | boolean | no | Strip accents from string values |
| options.ignoreSpaces | boolean | no | Trim whitespace from string values |

### Returns

| Type | Description |
|------|-------------|
| boolean | True if both objects are deeply equal after normalization |

### Examples

```javascript
json.isEqual({ b: 2, a: 1 }, { a: 1, b: 2 })
// true — key order ignored
json.isEqual([3, 1, 2], [1, 2, 3])
// true — array order ignored
json.isEqual({ a: 1, b: 2 }, { a: 1 }, { ignoredKeys: ['b'] })
// true — key ignored
json.isEqual({ name: 'Alice' }, { name: 'alice' }, { ignoreCase: true })
// true
json.isEqual({ a: 1 }, { a: 2 })
// false
```

## isEqualFile

### Signature

```javascript
json.isEqualFile(json, jsonFilePath, options)
```

### Description

Check if a JSON object is deeply equal to the content of a JSON file.
Throws a `TypeError` if either argument is not a non-empty string.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| json | object | yes | The JSON object to compare |
| jsonFilePath | string | yes | Path to the JSON file |
| options | object | no | Comparison options (see `isEqual`) |

### Returns

| Type | Description |
|------|-------------|
| boolean | True if the object match the file content |

### Examples

```javascript
json.isEqualFile({ name: 'Alice', age: 25 }, './fixtures/expected.json')
// true or false
```

## isEqualFiles

### Signature

```javascript
json.isEqualFiles(jsonFilePath1, jsonFilePath2, options)
```

### Description

Check if two JSON files are deeply equal.
Throws a `TypeError` if either argument is not a non-empty string.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| jsonFilePath1 | string | yes | Path to the first JSON file |
| jsonFilePath2 | string | yes | Path to the second JSON file |
| options | object | no | Comparison options (see `isEqual`) |

### Returns

| Type | Description |
|------|-------------|
| boolean | True if both files are deeply equal |

### Examples

```javascript
json.isEqualFiles('./fixtures/actual.json', './fixtures/expected.json')
// true or false
```

## compare

### Signature

```javascript
json.compare(json1, json2, options)
```

### Description

Compare two JSON objects and return a detailed diff.
Throws a `TypeError` if either argument is not a non-empty string.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| json1 | object | yes | The first JSON object |
| json2 | object | yes | The second JSON object |
| options | object | no | Comparison options (see `isEqual`) |

### Returns

| Type | Description |
|------|-------------|
| object | An object with `isEqual` (boolean) and `differences` (object) |

The `differences` object contains three arrays:
- `missing`: paths present in `json1` but absent in `json2`
- `extra`: paths present in `json2` but absent in `json1`
- `updated`: paths present in both but with different values, each entry containing `path`, `oldValue`, and `newValue`

### Examples

```javascript
json.compare({ a: 1 }, { a: 1 })
// { isEqual: true, differences: { missing: [], extra: [], updated: [] } }

json.compare({ a: 1, b: 2 }, { a: 9, c: 3 })
// { isEqual: false, differences: { missing: ['b'], extra: ['c'], updated: [{ path: 'a', oldValue: 1, newValue: 9 }] } }

json.compare({ user: { name: 'Alice', age: 25 } }, { user: { name: 'Alice', age: 30 } })
// { isEqual: false, differences: { missing: [], extra: [], updated: [{ path: 'user.age', oldValue: 25, newValue: 30 }] } }
```
