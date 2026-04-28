---
title: promise
description: Utility functions for creating and inspecting queryable promises.
---

# promise

## createQueryable

### Signature

```js
promise.createQueryable (promiseOrExecutor)
```

### Description

Wraps a `Promise` or an executor function to make its state synchronously inspectable. By default, JavaScript promises expose no way to know their current state — this function adds `isPending()`, `isFulfilled()`, `isRejected()`, and `getStatus()` methods to the returned promise.

If the promise passed in is already queryable, it is returned as-is.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `promiseOrExecutor` | `Promise \| function` | yes | A promise or an executor function `(resolve, reject) => void` |

### Returns

| Type | Description |
|------|-------------|
| `Promise` | The original promise, augmented with state inspection methods |

| Method | Returns | Description |
|--------|---------|-------------|
| `isPending()` | `boolean` | `true` if the promise has not yet settled |
| `isFulfilled()` | `boolean` | `true` if the promise resolved successfully |
| `isRejected()` | `boolean` | `true` if the promise was rejected |
| `getStatus()` | `string` | One of `'pending'`, `'fulfilled'`, `'rejected'` |

### Throws

Throws a `TypeError` if `promiseOrExecutor` is neither a `Promise` nor a function.

### Examples

```js
const p = promise.createQueryable(fetch('/api/data'))

p.isPending()   // true
p.isFulfilled() // false
p.isRejected()  // false
p.getStatus()   // 'pending'

await p

p.isPending()   // false
p.isFulfilled() // true
p.isRejected()  // false
p.getStatus()   // 'fulfilled'
```

```js
// Also accepts an executor function
const p = promise.createQueryable((resolve, reject) => {
  setTimeout(() => resolve(42), 1000)
})

p.isPending() // true
p.getStatus() // 'pending'
```

```js
// Returns the same instance if already queryable
const p1 = promise.createQueryable(Promise.resolve(42))
const p2 = promise.createQueryable(p1)
p1 === p2 // true
```
