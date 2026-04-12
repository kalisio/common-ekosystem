---
title: matches
description: Functions to test string values against patterns.
---

# matches

## pattern

### Signature

```javascript
matches.pattern(value, pattern)
```

### Description

Check if a string matches a regular expression.
Throws a `TypeError` if `value` is not a string or `pattern` is not a `RegExp`.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `value` | `string` | yes | The string to test |
| `pattern` | `RegExp` | yes | The regular expression to test against |

### Returns

| Type | Description |
|------|-------------|
| `boolean` | True if the string matches the pattern |

### Examples

```javascript
matches.pattern('hello@example.com', /^[\w.-]+@[\w.-]+\.\w+$/) // true
matches.pattern('not-an-email', /^[\w.-]+@[\w.-]+\.\w+$/)      // false
matches.pattern('abc123', /^\w+$/)                              // true
matches.pattern('abc 123', /^\w+$/)                             // false
matches.pattern('HELLO', /^[A-Z]+$/)                            // true
```