--
title: comparator
description: Factory for creating custom format comparators
---

# comparator

## createComparator

### Signature

```javascript
createComparator(parse)
```

### Description

Factory function that creates a comparator object from a custom parse function.
The returned comparator exposes `isEqual`, `isEqualFile`, `isEqualFiles`, and `compare`, all delegating to `json` after parsing the input strings.
Used internally to build the `yaml` and `xml` modules.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| parse | function | yes | A function that takes a string (and optionally options) and returns a plain object |

### Returns

| Type | Description |
|------|-------------|
| object | A comparator object with `isEqual`, `isEqualFile`, `isEqualFiles`, and `compare` methods |

### Examples

```javascript
import { createComparator } from './comparator.js'
import TOML from '@ltd/j-toml'

// Create a custom comparator for TOML
export const toml = createComparator((str) => TOML.parse(str))

toml.isEqual('[db]\nport = 5432', '[db]\nport = 5432')  // true
toml.isEqual('[db]\nport = 5432', '[db]\nport = 3306')  // false
toml.isEqualFile('[db]\nport = 5432', './fixtures/expected.toml')  // true or false
toml.isEqualFiles('./fixtures/actual.toml', './fixtures/expected.toml')  // true or false
toml.compare('[db]\nport = 5432', '[db]\nport = 3306')
// { isEqual: false, differences: { missing: [], extra: [], updated: [{ path: 'db.port', oldValue: 5432, newValue: 3306 }] } }
```
