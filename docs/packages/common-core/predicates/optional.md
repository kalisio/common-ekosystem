---
title: optional
description: Create optional predicates for schema validation
-------------------------------------------------------------

# optional

## Signature

```js id="3fngg4"
optional (validator)
```

## Description

Create a predicate that accepts `undefined` or any value accepted by the provided validator.

It is typically used with `conform` to define optional properties in a schema.

## Parameters

| Name        | Type       | Required | Description                                                    |
| ----------- | ---------- | -------- | -------------------------------------------------------------- |
| `validator` | `Function` | yes      | The predicate used to validate the property when it is defined |

## Returns

| Type       | Description                                                                      |
| ---------- | -------------------------------------------------------------------------------- |
| `Function` | A predicate that accepts `undefined` or values satisfying the provided validator |

## Examples

```js
import { conform, optional, is } from '@kalisio/common-core'

const schema = {
  name: is.string,
  description: optional(is.string)
}

conform({ name: 'foo' }, schema)                     // true
conform({ name: 'foo', description: 'bar' }, schema) // true
conform({ name: 'foo', description: 42 }, schema)    // false
```
