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

* `options.retries` — Non-negative integer number of retry attempts. Defaults to `0`.
* `options.retryDelay` — Non-negative integer delay between retries in milliseconds, or a function receiving the retry attempt number. Defaults to `1000`.
* `options.timeout` — Non-negative integer timeout in milliseconds, or a function receiving the request attempt number.
* `options.signal` — Optional external `AbortSignal` applied to all fetches.
* Other options are forwarded as default options to `fetch`.

Per-fetch options can override these defaults.

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

Native fetch options are also forwarded:

```js
const response = await req.fetch(url, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(data)
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
* Network errors
* Timeout errors

```js
const req = request({
  retries: 3,
  retryDelay: 1000
})
```

`retries` represents the number of additional attempts. With `retries: 3`, a request can therefore be executed up to four times.

The retry delay can be computed from the retry attempt number:

```js
const req = request({
  retries: 3,
  retryDelay: attempt => attempt * 1000
})
```

The first retry receives `1`, the second retry receives `2`, and so on.

The function must return a non-negative integer.

Response bodies from discarded HTTP responses are cancelled before retrying.

## Replayable request bodies

When retries are enabled, a request body must be safe to send again.

The following body types are supported:

* `string`
* `ArrayBuffer`
* ArrayBuffer views such as `Uint8Array`
* `Blob`
* `URLSearchParams`
* `FormData`

```js
const req = request({
  retries: 3
})

const response = await req.fetch(url, {
  method: 'POST',
  body: JSON.stringify(data)
})
```

A `ReadableStream` or unsupported body type cannot be used when `retries > 0`.

If streaming upload is required, disable retries:

```js
const response = await req.fetch(url, {
  method: 'POST',
  body: stream,
  retries: 0
})
```

A `Request` object carrying a body also cannot be retried because the same request body cannot safely be reused across attempts.

```js
const input = new Request(url, {
  method: 'POST',
  body: JSON.stringify(data)
})

await req.fetch(input, {
  retries: 0
})
```

To use retries, pass the body through the fetch options instead.

```js
await req.fetch(url, {
  method: 'POST',
  body: JSON.stringify(data),
  retries: 3
})
```

## Timeout

A fixed timeout can be applied independently to each request attempt:

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

Each attempt gets its own timeout signal.

The timeout function must return a non-negative integer or `undefined`.

Returning `undefined` disables the timeout for that attempt:

```js
const req = request({
  timeout: attempt => attempt === 1 ? undefined : 5000
})
```

A timeout of `0` is valid and creates an immediate timeout.

## Cancellation

A request context can be cancelled explicitly:

```js
// A request bundles one or more fetch calls that are aborted together.
// The abort trigger always lives outside the flow that awaits the response —
// a click, an unmount, a timer — never in the same function that awaits.
const req = request({ retries: 2 })

// Flow that fires the call and awaits it (e.g. a component loading data):
async function load () {
  try {
    const response = await req.fetch('/api/resource')
    return await response.json()
  } catch (error) {
    // A deliberate abort is not a failure; only real errors propagate.
    if (!req.aborted) throw error
  }
}

// Somewhere else, on an external event:
button.addEventListener('click', () => req.abort())
// aborting req cancels every in-flight call it started.
```

An optional reason can be provided:

```js
req.abort(new Error('cancelled'))
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

Timeout signals are created independently for each request attempt and do not cancel the request context itself.

The retry delay uses the combined user cancellation signal, so aborting the context or an external signal also interrupts a pending retry delay.

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

Calling `abort` also interrupts active fetches and response streams associated with the request context.

Streaming request bodies can be used when retries are disabled.

```js
await req.fetch(url, {
  method: 'POST',
  body: stream,
  retries: 0
})
```
