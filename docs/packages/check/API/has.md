---
title: has
---

# has


## key

### Signature
```javascript
key(obj, key)
```

### Description

Check if object has a specific key

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| obj | Object | yes | The object to check |
| key | string | yes | The key to look for |

### Returns

| Type | Description |
|------|-------------|
| boolean | True if the object has the key, false otherwise |

### Examples

```javascript
has.key({ name: 'John' }, 'name') // true
has.key({ name: 'John' }, 'age') // false
has.key(null, 'name') // false
```


---

## keys

### Signature
```javascript
keys(obj, keys)
```

### Description

Check if object has all specified keys

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| obj | Object | yes | The object to check |
| keys | Array.&lt;string&gt; | yes | Array of keys to look for |

### Returns

| Type | Description |
|------|-------------|
| boolean | True if the object has all keys, false otherwise |

### Examples

```javascript
has.keys({ name: 'John', age: 30 }, ['name', 'age']) // true
has.keys({ name: 'John' }, ['name', 'age']) // false
has.keys({}, []) // true
```


---

## keyWithValue

### Signature
```javascript
keyWithValue(obj, key)
```

### Description

Check if object has a key with a defined value (not null or undefined)

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| obj | Object | yes | The object to check |
| key | string | yes | The key to look for |

### Returns

| Type | Description |
|------|-------------|
| boolean | True if the object has the key and its value is defined, false otherwise |

### Examples

```javascript
has.keyWithValue({ name: 'John' }, 'name') // true
has.keyWithValue({ name: undefined }, 'name') // false
has.keyWithValue({ name: null }, 'name') // false
has.keyWithValue({}, 'name') // false
```


---


