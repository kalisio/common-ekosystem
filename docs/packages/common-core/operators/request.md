---
title: request
description: Create a controllable HTTP request context with retry, timeout, and cancellation support.
---

# request

Create a controllable HTTP request context for executing one or more `fetch` operations with shared cancellation, retry, and timeout support.

## Signature

```js
request(options = {})
```

## Parameters

* `options.retries` — Number of retry attempts. Defaults to `0`.
* `options.retryDelay` — Delay between retries in milliseconds, or a function receiving the retry attempt number. Defaults to `1000`.
* `options.timeout` — Timeout in milliseconds, or a function receiving the request attempt number.
* `options.signal` — Optional external `AbortSignal` applied to all fetches.
* Other options are forwarded as default options to `fetch`.

## Returns

An object exposing:

```js
{
  fetch,
  abort,
  signal,
  aborted
}
```

* `fetch(input, options)` — Executes a fetch within the request context.
* `abort(reason)` — Aborts all active fetches associated with the context.
* `signal` — Internal `AbortSignal` associated with the context.
* `aborted` — Indicates whether the request context has been aborted.

## fetch

Executes a fetch using the defaults provided to `request`.

```js
const req = request({
  retries: 3,
  timeout: 30000
})

const response = await req.fetch(url)
```

The returned value is the native `Response` object.

Options can be overridden for an individual fetch:

```js
const response = await req.fetch(url, {
  retries: 1,
  timeout: 5000
})
```

## Multiple requests

A request context can execute multiple fetches sharing the same defaults and cancellation mechanism.

```js
const req = request({
  retries: 3,
  timeout: 30000
})

const responses = await Promise.all([
  req.fetch(url1),
  req.fetch(url2),
  req.fetch(url3)
])
```

Calling `abort` cancels all active fetches associated with the context.

```js
req.abort()
```

Once aborted, the request context cannot be reused.

## Retry

Requests are retried for:

* `408 Request Timeout`
* `429 Too Many Requests`
* `5xx` server errors
* network errors
* timeout errors

```js
const req = request({
  retries: 3,
  retryDelay: 1000
})
```

The retry delay can be computed from the retry attempt number:

```js
const req = request({
  retries: 3,
  retryDelay: attempt => attempt * 1000
})
```

Response bodies are cancelled before retrying an HTTP response.

## Timeout

A fixed timeout can be applied to each request attempt:

```js
const req = request({
  retries: 3,
  timeout: 5000
})
```

The timeout can also be computed for each attempt:

```js
const req = request({
  retries: 3,
  timeout: attempt => attempt * 5000
})
```

The first attempt receives `1`, the first retry receives `2`, and so on.

Each retry gets its own timeout.

## Cancellation

A request context can be cancelled explicitly:

```js
const req = request()

const promise = req.fetch(url)

req.abort()

await promise
```

An external signal can also be supplied to the whole context:

```js
const controller = new AbortController()

const req = request({
  signal: controller.signal
})
```

or to an individual fetch:

```js
await req.fetch(url, {
  signal: controller.signal
})
```

The context signal, default signal, and per-fetch signal are combined.

Timeouts are handled independently for each attempt.

## Streaming

Because `fetch` returns the native `Response`, response bodies can be streamed directly.

```js
const req = request()

const response = await req.fetch(url)
const reader = response.body.getReader()

while (true) {
  const { done, value } = await reader.read()
  if (done) break

  process(value)
}
```

Calling `abort` also interrupts active response streams associated with the request context.
