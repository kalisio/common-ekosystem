---
title: match
description: Functions to test string values against patterns.
---

# match

## pattern

### Signature

```js
match.pattern (value, pattern)
```

### Description

Check if a string match a regular expression.
Throws a `TypeError` if `value` is not a string or `pattern` is not a `RegExp`.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `value` | `string` | yes | The string to test |
| `pattern` | `RegExp` | yes | The regular expression to test against |

### Returns

| Type | Description |
|------|-------------|
| `boolean` | True if the string match the pattern |

### Examples

```javascript
match.pattern('hello@example.com', /^[\w.-]+@[\w.-]+\.\w+$/) // true
match.pattern('not-an-email', /^[\w.-]+@[\w.-]+\.\w+$/)      // false
match.pattern('abc123', /^\w+$/)                              // true
match.pattern('abc 123', /^\w+$/)                             // false
match.pattern('HELLO', /^[A-Z]+$/)                            // true
```