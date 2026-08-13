---
title: conform
description: Functions to validate an object against a schema
---

# conform

Functions to validate an object against a schema.

## schema

### Signature

```js
conform.schema (obj, schema)
```

### Description

Check if an object match a schema.
The schema is an object where keys are property names and values are either:

- a validator function (like `is.string`, `is.number`, etc.)
- a nested schema object for sub-objects

Returns `true` if the object conform to the schema, `false` otherwise.
Throws a `AssertionError` if `obj` or `schema` are not plain objects.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `obj` | `object` | yes | The object to validate |
| `schema` | `object` | yes | The schema describing expected keys and their validators |

### Returns

| Type | Description |
|------|-------------|
| `boolean` | True if the object conform to the schema, false otherwise |

### Examples

```js
const user = {
  name: 'Alice',
  age: 25,
  address: { city: 'Paris', zip: '75001' }
}

const schema = {
  name: is.string,
  age: is.number,
  address: {
    city: is.string,
    zip: is.string
  }
}

conform.schema(user, schema) // true

// fails because age is a string
conform.schema({ name: 'Bob', age: '25' }, schema) // false

// fails because address.zip is missing
conform.schema({ name: 'Alice', age: 25, address: { city: 'Paris' } }, schema) // false
```