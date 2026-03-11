---
title: yaml
description: YAML comparison functions
---

# yaml

The `yaml` module exposes the same interface as `json` (`isEqual`, `isEqualFile`, `isEqualFiles`, `compare`) but accepts YAML strings as input. Both strings are parsed into objects before comparison.

## isEqual

### Signature

```javascript
yaml.isEqual(yaml1, yaml2, options)
```

### Description

Check if two YAML strings are semantically equal. Both strings are parsed into objects and compared using deep equality, ignoring key order and array order.
Throws a `TypeError` if either argument is not a non-empty string.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| yaml1 | string | yes | The first YAML string |
| yaml2 | string | yes | The second YAML string |
| options | object | no | Comparison options (see `json.isEqual`) |

### Returns

| Type | Description |
|------|-------------|
| boolean | True if both YAML strings are semantically equal |

### Examples

```javascript
yaml.isEqual('name: Alice\nage: 25', 'age: 25\nname: Alice')
// true — key order ignored
yaml.isEqual('count: 1', 'count: 2')
// false
yaml.isEqual('name: Alice', 'name: alice', { ignoreCase: true })
// true
```

## isEqualFile

### Signature

```javascript
yaml.isEqualFile(yaml, yamlFilePath, options)
```

### Description

Check if a YAML string is semantically equal to the content of a YAML file.
Throws a `TypeError` if either argument is not a non-empty string.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| yaml | string | yes | The YAML string to compare |
| yamlFilePath | string | yes | Path to the YAML file |
| options | object | no | Comparison options (see `json.isEqual`) |

### Returns

| Type | Description |
|------|-------------|
| boolean | True if the YAML string matches the file content |

### Examples

```javascript
yaml.isEqualFile('name: Alice\nage: 25', './fixtures/expected.yaml')
// true or false
```

## isEqualFiles

### Signature

```javascript
yaml.isEqualFiles(yamlFilePath1, yamlFilePath2, options)
```

### Description

Check if two YAML files are semantically equal.
Throws a `TypeError` if either argument is not a non-empty string.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| yamlFilePath1 | string | yes | Path to the first YAML file |
| yamlFilePath2 | string | yes | Path to the second YAML file |
| options | object | no | Comparison options (see `json.isEqual`) |

### Returns

| Type | Description |
|------|-------------|
| boolean | True if both files are semantically equal |

### Examples

```javascript
yaml.isEqualFiles('./fixtures/actual.yaml', './fixtures/expected.yaml')
// true or false
```

## compare

### Signature

```javascript
yaml.compare(yaml1, yaml2, options)
```

### Description

Compare two YAML strings and return a detailed diff. Both strings are parsed into objects before comparison.
Throws a `TypeError` if either argument is not a non-empty string.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| yaml1 | string | yes | The first YAML string |
| yaml2 | string | yes | The second YAML string |
| options | object | no | Comparison options (see `json.isEqual`) |

### Returns

| Type | Description |
|------|-------------|
| object | An object with `isEqual` (boolean) and `differences` (object with `missing`, `extra`, `updated`) |

### Examples

```javascript
yaml.compare('count: 1', 'count: 1')
// { isEqual: true, differences: { missing: [], extra: [], updated: [] } }

yaml.compare('count: 1', 'count: 2')
// { isEqual: false, differences: { missing: [], extra: [], updated: [{ path: 'count', oldValue: 1, newValue: 2 }] } }

yaml.compare('a: 1\nb: 2', 'a: 9\nc: 3')
// { isEqual: false, differences: { missing: ['b'], extra: ['c'], updated: [{ path: 'a', oldValue: 1, newValue: 9 }] } }
```

