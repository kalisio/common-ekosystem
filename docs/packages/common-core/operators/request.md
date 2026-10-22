
---
title: request
description: Create a URL-bound HTTP request with retry, timeout and cancellation support.
---

# request

## Description

Creates an HTTP request operation bound to a single URL. It delegates execution, retries, timeouts
and cancellation to the [requester](../runtime/requester.md) runtime.

The operation can execute multiple `fetch()` calls against the same URL, using shared defaults and
a shared cancellation signal. Each call may override its options and returns a native `Response`.

::: tip
Use `createRequester()` instead when requests need to target different URLs.
:::

## request

### Signature

```js
request(url, options = {})
```

### Parameters

| Parameter | Type | Description |
|---|---|---|
| `url` | string \| URL | HTTP(S) URL bound to the operation |
| `options` | Object | Default requester and native fetch options |

The main options are:

| Option | Default | Description |
|---|---|---|
| `retries` | `0` | Number of additional attempts |
| `retryDelay` | Exponential backoff | Delay in milliseconds or a function receiving the retry number (starting at `1`) |
| `maxRetryAfter` | `60000` | Maximum accepted `Retry-After` delay in milliseconds |
| `shouldRetry` | Default policy | Function deciding whether an attempt should be retried |
| `timeout` | None | Positive timeout in milliseconds or a function receiving the attempt number (starting at `1`) |
| `signal` | None | External signal for the whole operation |

Other options (`method`, `headers`, `body`, etc.) are forwarded to native `fetch`. Per-call options
override these defaults; headers are merged by name.

### Returns

An operation exposing:

| Member | Signature | Description |
|---|---|---|
| `fetch` | `fetch(options = {})` | Fetches the bound URL and returns a native `Response` |
| `abort` | `abort(reason)` | Cancels all active calls and prevents further use |
| `signal` | `AbortSignal` | Read-only shared cancellation signal |
| `aborted` | `boolean` | Read-only cancellation state |

### Throws

| Condition | Error |
|---|---|
| Invalid URL | AssertionError: `url must be a valid url` |
| Invalid requester or per-call options | AssertionError: `options must be a valid options object` |
| A non-replayable body with retries enabled | AssertionError |

## Behavior

### Fetch

`fetch(options)` always targets the URL supplied to `request()`. It does not accept another URL.

```js
import { request } from '@kalisio/common-core/operators'

const req = request('https://example.com/api/resources', { retries: 2 })
const response = await req.fetch()
const data = await response.json()
```

The bound URL can be reused with different options:

```js
await req.fetch()
await req.fetch({ method: 'HEAD', retries: 0 })
```

### Retry

By default, retries apply only to idempotent methods (`GET`, `HEAD`, `OPTIONS`, `PUT`, `DELETE`) or
requests carrying a non-empty `Idempotency-Key` header. The caller must ensure that the server actually
enforces that key.

Eligible requests are retried on `408`, `429`, `500`, `502`, `503`, `504`, network errors and timeouts.
`Retry-After` is honored up to `maxRetryAfter`; longer delays cause the response to be returned. The
default delay uses exponential backoff with jitter, capped at 30 seconds.

`retries` counts additional attempts: `retries: 2` allows up to three attempts. A custom `shouldRetry`
replaces the default policy; use `shouldRetryByDefault` from the runtime to extend it.

When retries are enabled, the body must be replayable (`string`, `ArrayBuffer`, typed-array view, `Blob`,
`URLSearchParams` or `FormData`). Streams require `retries: 0`. Retrying a non-idempotent request can
duplicate side effects unless the server enforces idempotency.

### Timeout

`timeout` applies independently to each attempt while waiting for response headers. It must be a
positive integer; `0` is invalid. A timeout function may return `undefined` to disable it for a given
attempt.

Reading the returned response body is not bounded by `timeout`. To bound the entire exchange, supply
a signal such as `AbortSignal.timeout(5000)`.

### Cancellation

`abort()` permanently cancels the operation, including active fetches, response-body reads and pending
retry delays. An external signal passed at creation has the same shared scope; a signal passed to `fetch()`
affects only that call.

Once aborted, create a new operation to make another request.

## Examples

### Default and per-call options

```js
const req = request('https://example.com/api/resources', {
  retries: 3,
  timeout: 5000,
  headers: { 'x-client': 'common-core' }
})

const response = await req.fetch({
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'roads' }),
  retries: 0
})
```

### Custom retry policy

```js
import { shouldRetryByDefault } from '@kalisio/common-core/runtime'

const req = request('https://example.com/api/resources', {
  retries: 2,
  shouldRetry: (context) => shouldRetryByDefault(context) || context.response?.status === 409
})

await req.fetch()
```

### Cancellation

```js
const req = request('https://example.com/api/resources', { retries: 2 })

const loading = req.fetch()
// From a separate event handler:
req.abort(new Error('cancelled'))

await loading // Rejects with the cancellation reason.
```

### Streaming

```js
const req = request('https://example.com/api/download')
const response = await req.fetch()
const reader = response.body.getReader()

while (true) {
  const { done, value } = await reader.read()
  if (done) break
  process(value)
}
```

Calling `abort()` also interrupts an active response stream.
