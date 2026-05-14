---
title: has
description: Functions to check the presence of keys in an object.
---

# has

Functions to check the presence of keys in an object.

## key

### Signature

```js
has.key (obj, key)
```

### Description

Check if an object has a specific own property.
Throws a `TypeError` if `obj` is not a plain object or `key` is not a string.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `obj` | `object` | yes | The object to check |
| `key` | `string` | yes | The property name to look for |

### Returns

| Type | Description |
|------|-------------|
| `boolean` | True if the object has the specified own property |

### Examples

```js
has.key({ name: 'Alice' }, 'name') // true
has.key({ name: 'Alice' }, 'age')  // false
has.key({ name: null }, 'name')    // true
```

## keys

### Signature

```js
has.keys (obj, keys)
```

### Description

Check if an object has all of the specified own properties.
Throws a `TypeError` if `obj` is not a plain object or `keys` is not a non-empty array of strings.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `obj` | `object` | yes | The object to check |
| `keys` | `string[]` | yes | Array of property names to look for |

### Returns

| Type | Description |
|------|-------------|
| `boolean` | True if the object has all the specified own properties |

### Examples

```js
has.keys({ name: 'Alice', age: 25 }, ['name', 'age']) // true
has.keys({ name: 'Alice' }, ['name', 'age'])           // false
has.keys({ name: 'Alice', age: 25 }, ['name'])         // true
```

## keyWithValue

### Signature

```js
has.keyWithValue (obj, key)
```

### Description

Check if an object has a specific own property and its value is defined (not `null` or `undefined`).

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `obj` | `object` | yes | The object to check |
| `key` | `string` | yes | The property name to look for |

### Returns

| Type | Description |
|------|-------------|
| `boolean` | True if the object has the property and its value is not null or undefined |

### Examples

```js
has.keyWithValue({ name: 'Alice' }, 'name')  // true
has.keyWithValue({ name: null }, 'name')      // false
has.keyWithValue({ name: undefined }, 'name') // false
has.keyWithValue({ age: 25 }, 'name')         // false
```

## path

### Signature

```js
has.path (obj, path)
```

### Description

Check if an object has a nested property at the given dot-notation path.
Uses the `in` operator instead of `Object.hasOwn` to safely handle Vue proxy objects.
Throws a `TypeError` if `obj` is not a plain object or `path` is not a non-empty string.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `obj` | `object` | yes | The object to check |
| `path` | `string` | yes | Dot-notation path to the property (e.g. `'a.b.c'`) |

### Returns

| Type | Description |
|------|-------------|
| `boolean` | True if the property exists at the given path, regardless of its value |

### Examples

```js
has.path({ a: { b: { c: 42 } } }, 'a.b.c') // true
has.path({ a: { b: 1 } }, 'a.b.c')          // false
has.path({ a: null }, 'a.b')                 // false
has.path({ a: undefined }, 'a')              // true
has.path({ a: false }, 'a')                  // true
```