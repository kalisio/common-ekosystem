# json

## compare

### Signature

```javascript
compare(a, b, options)
```

### Description

Perform a deep comparison between two objects and return detailed differences.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| a | Object \| Array | yes | The source object |
| b | Object \| Array | yes | The target object |
| options | Object | no | Comparison options |

### Returns

| Type | Description |
|------|-------------|
| Object | An object containing isEqual (boolean) and differences (missing, extra, updated) |

### Examples

```javascript
json.compare({ a: 1 }, { a: 2, b: 3 })
/* {
  isEqual: false,
  differences: {
    missing: [],
    extra: ['b'],
    updated: [{ path: 'a', oldValue: 1, newValue: 2 }]
  }
}
*/
```

## isEqual

### Signature

```javascript
isEqual(object1, object2, options)
```

### Description

Compares two JSON objects after normalization. The comparison can ignore specific keys provided in the options.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| object1 | Object \| Array | yes | The first object to compare |
| object2 | Object \| Array | yes | The second object to compare |
| options | Object | no | Comparison options |
| options.ignoredKeys | string[] | no | Keys to ignore during comparison |

### Returns

| Type | Description |
|------|-------------|
| boolean | Returns true if the normalized objects are equal, otherwise false |

### Examples

```javascript
json.isEqual({ a: 1, id: '1' }, { a: 1, id: '2' }, { ignoredKeys: ['id'] }) // true
json.isEqual({ a: 1, b: 2 }, { b: 2, a: 1 }) // true
```

## isEqualFile

### Signature

```javascript
isEqualFile(object, filePath, options)
```

### Description

Compare an object with the content of a JSON file.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| object | Object \| Array | yes | The object to compare |
| filePath | string | yes | The path to the JSON file |
| options | Object | no | Comparison options |

### Returns

| Type | Description |
|------|-------------|
| boolean | Returns true if the object matches the file content |

### Examples

```javascript
json.isEqualFile({ a: 1 }, './data.json')
```

## isEqualFiles

### Signature

```javascript
isEqualFiles(path1, path2, options)
```

### Description

Compare the content of two JSON files.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| path1 | string | yes | Path to the first file |
| path2 | string | yes | Path to the second file |
| options | Object | no | Comparison options |

### Returns

| Type | Description |
|------|-------------|
| boolean | Returns true if both files are structurally equal |

### Examples

```javascript
json.isEqualFiles('./baseline.json', './current.json')
```

