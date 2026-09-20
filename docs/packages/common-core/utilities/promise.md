---
title: promise
description: Utility functions for creating and inspecting track promises.
---

# promise

Utility functions for creating and inspecting track promises.

## track

### Signature

```js
promise.track (promiseOrExecutor)
```

### Description

Wraps a `Promise` or an executor function to make its state synchronously inspectable. By default, JavaScript promises expose no way to know their current state — this function adds `isPending()`, `isFulfilled()`, `isRejected()`, and `getStatus()` methods to the returned promise.

If the promise passed in is already track, it is returned as-is.

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
const p = promise.track(fetch('/api/data'))

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
const p = promise.track((resolve, reject) => {
  setTimeout(() => resolve(42), 1000)
})

p.isPending() // true
p.getStatus() // 'pending'
```

```js
// Returns the same instance if already track
const p1 = promise.track(Promise.resolve(42))
const p2 = promise.track(p1)
p1 === p2 // true
```

## run

### Signature

```js
promise.run (tasks, options = {})
```

### Description

Runs an array of synchronous or asynchronous tasks concurrently.

Each task must be a function and can return either a value or a `Promise`.

By default, all tasks are started concurrently. Use `concurrency` to limit the number of tasks running at the same time.

Results preserve the order of the input tasks, regardless of completion order.

### Parameters

| Name          | Type         | Description                              |
| ------------- | ------------ | ---------------------------------------- |
| `tasks`       | `function[]` | Tasks to run                             |
| `options`     | `object`     | Run options                              |
| `concurrency` | `number`     | Max concurrent tasks, default `Infinity` |

### Returns

| Type             | Description                 |
| ---------------- | --------------------------- |
| `Promise<Array>` | Task results in input order |

### Throws

Throws an assertion error if:

* `tasks` is not an array
* `tasks` contains non-functions
* `options` is invalid

If a task throws or rejects, `run` rejects with the corresponding error.

### Examples

```js
const results = await promise.run([
  () => fetchUser(1),
  () => fetchUser(2),
  () => fetchUser(3)
])
```

```js
const results = await promise.run([
  () => processFile('a.txt'),
  () => processFile('b.txt'),
  () => processFile('c.txt')
], {
  concurrency: 2
})
```

```js
const results = await promise.run([
  async () => {
    await schedule.delay(100)
    return 'first'
  },
  async () => 'second'
], {
  concurrency: 2
})

results // ['first', 'second']
```

```js
await promise.run(tasks, {
  concurrency: Infinity
})
```

```js
const results = await promise.run([])

results // []
```

