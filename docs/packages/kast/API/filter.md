---
title: filter
description: Function that filters an array using a MongoDB-style query object. Used to select objects matching given criteria.
---

# filter

## filter

### Signature

```js
filter (array, query)
```

### Description

Filters an array of objects using a MongoDB-style query object powered by [`sift`](https://github.com/crcn/sift.js). Returns a new array containing only the elements that match the query.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `array` | `Array` | yes | The array of objects to filter |
| `query` | `object` | yes | A MongoDB-style query object used to match elements |

### Returns

| Type | Description |
|------|-------------|
| `Array` | A new array containing only the elements that match the query |

### Examples

```js
// Filter by exact value
filter([{ name: 'Alice', age: 25 }, { name: 'Bob', age: 17 }], { age: 25 })
// => [{ name: 'Alice', age: 25 }]
```

```js
// Filter using a comparison operator
filter([{ value: 10 }, { value: 3 }, { value: 7 }], { value: { $gte: 7 } })
// => [{ value: 10 }, { value: 7 }]
```

```js
// throws TypeError: 'array must be an array'
filter('not an array', { name: 'Alice' })

// throws TypeError: 'query must be an object'
filter([{ name: 'Alice' }], 'invalid')
```