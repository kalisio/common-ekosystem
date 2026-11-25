---
title: conditions-matcher
description: Supported authorization conditions and matching semantics.
---

# conditions-matcher

All abilities created with [abilities](./abilities.md) use a common condition matcher. It defines the supported subset of MongoDB queries used by [permissions](./permissions.md) for in-memory evaluation and database filtering.

The matcher is internal to the package. Use `abilities.create()`, `abilities.createBuilder()` or `abilities.update()` rather than importing it directly.

## Supported operators

### Logical operators

| Operator | Operand | Description |
|----------|---------|-------------|
| `$and` | `Object[]` | Every condition must match |
| `$or` | `Object[]` | At least one condition must match |
| `$nor` | `Object[]` | None of the conditions may match |

Multiple fields in a condition are implicitly combined with AND. Logical operands contain nested query objects.

### Field operators

| Operator | Operand | Description |
|----------|---------|-------------|
| `$eq` | Value | Equality |
| `$ne` | Value | Inequality |
| `$lt`, `$lte` | Value | Less than, or less than or equal to |
| `$gt`, `$gte` | Value | Greater than, or greater than or equal to |
| `$in` | `Array` | Matches any listed value |
| `$nin` | `Array` | Matches none of the listed values |
| `$all` | `Array` | Matches all listed values; an empty list matches nothing |
| `$size` | `number` | Array length, from 0 to 2147483647 |
| `$exists` | `boolean` | Tests the presence of a field |
| `$elemMatch` | `Object` | Matches an array element satisfying the entire condition |
| `$regex` | `string \| RegExp` | Regular expression match |
| `$options` | `string` | Flags for a string `$regex` operand |

Direct field values represent equality, except a direct regular expression represents pattern matching. Operators outside this subset, such as `$not`, `$expr`, `$type`, and geospatial operators, are not supported.

## Values and comparison

Rule literals may contain null, booleans, finite numbers, strings, valid JavaScript dates, BSON ObjectIds, arrays and plain objects containing supported values. Regular expressions are supported in the positions described below. Do not use undefined, BigInt, NaN or Infinity as condition literals, or arbitrary class instances. Embedded literal objects cannot contain operator keys.

- Values are compared without coercing strings into numbers, dates, or ObjectIds.
- ObjectIds are compared by hexadecimal value, not object identity; a hexadecimal string is a different type.
- Dates are compared by timestamp; strings use Unicode code-point ordering (MongoDB simple binary collation).
- Literal array equality is order-sensitive. Embedded document equality also takes field order into account.
- A scalar equality condition may match an element of an array field. Dotted paths can traverse embedded objects and arrays.
- Null equality also matches missing fields. `$exists` distinguishes field presence from a null value. Negative conditions can match missing fields, depending on the operand.

::: warning
Use the supported types and simple MongoDB collation. This is not a general-purpose MongoDB query engine. Database-specific BSON types, collation, and PCRE-only constructs are outside its contract. Preserve BSON value types when transporting rules.
:::

## Array element matching

Conditions on multiple dotted paths may be satisfied by different elements. Use `$elemMatch` to require a single element to satisfy every constraint.

```js
const conditions = {
  members: { $elemMatch: { userId: 'user-1', active: true } }
}
```

For scalar array elements, `$elemMatch` accepts `$eq`, `$ne`, `$lt`, `$lte`, `$gt`, `$gte`, `$in`, `$nin`, `$regex`, and `$options`. It also accepts a non-empty nested query for object elements.

```js
const conditions = {
  scores: { $elemMatch: { $gte: 10, $lt: 20 } }
}
```

Do not mix scalar operators with object-field conditions in one `$elemMatch`. An empty `$elemMatch` is invalid.

## Regular expressions

Native `RegExp` operands accept only the `i` and `m` flags. They may be used as direct field values, as `$regex` operands, or in `$in`, `$nin`, and `$all` lists. Use a string `$regex` with `$options` for the `s` flag.

```js
const conditions = {
  name: { $regex: '^project', $options: 'i' }
}
```

String `$regex` accepts `i`, `m`, and `s` without duplicates. `$options` cannot be supplied alone or alongside a native `RegExp` operand. Patterns must be valid in JavaScript Unicode mode and must not contain null bytes. Use patterns with equivalent semantics in JavaScript and MongoDB.

## Validation

Conditions are validated when an ability is created or updated through the package utilities, including in production. Invalid conditions and unsupported operators are rejected. Empty or absent conditions impose no constraint.

```js
import { abilities, permissions } from '@kalisio/common-authorization'

const ability = abilities.create([{
  action: 'read',
  subject: 'projects',
  conditions: {
    $or: [
      { published: true },
      { members: { $elemMatch: { userId: 'user-1', active: true } } }
    ]
  }
}])

permissions.can(ability, 'read', 'projects', { published: true })
// true
```

::: warning
Missing properties are evaluated as missing, not unknown. Use complete resource instances for server-side checks and trusted attributes for contextual conditions. See [permissions](./permissions.md) for the rules governing additional attributes and MongoDB filters.
:::
