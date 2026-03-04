---
title: matches
---

# matches

## pattern

### Signature

```js
pattern(value, pattern)
```

### Description

Check if a string value matches a regular expression pattern

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| value | * | yes | The value to test |
| pattern | RegExp | yes | The regular expression pattern to match against |

### Returns

| Type | Description |
|------|-------------|
| boolean | True if the value is a string and matches the pattern |

### Examples

```javascript
matches.pattern('hello123', /\d+/) // true
matches.pattern('hello', /^\w+$/) // true
matches.pattern('test@example.com', /^[\w.-]+@[\w.-]+\.\w+$/) // true
matches.pattern('hello', /\d+/) // false
matches.pattern(123, /\d+/) // false (not a string)
matches.pattern('hello', 'pattern') // false (not a RegExp)
```



