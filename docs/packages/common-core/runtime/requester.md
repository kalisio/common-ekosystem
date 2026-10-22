---
title: requester
description: HTTP runtime with configurable retries, per-attempt timeouts and cancellation.
---

# requester

## Description

Provides a stateful wrapper around native `fetch` for multiple HTTP requests sharing default options and a
cancellation lifecycle. It supports configurable retry policies, exponential backoff with jitter, `Retry-After`,
per-attempt timeouts and per-call overrides.

Successful responses are never retried. Retry diagnostics use the shared logger category
`['common-core', 'requester']`; errors returned to the caller are not systematically logged.

## Functions

### createRequester

Creates a reusable HTTP requester.

#### Signature

```js
createRequester(options = {})
```

#### Parameters

| Option | Type | Default | Description |
|---|---|---|---|
| `retries` | Integer | `3` | Additional attempts after the first request |
| `retryDelay` | Integer or Function | Exponential backoff | Delay in milliseconds or `(retry) => milliseconds`; retry starts at `1` |
| `maxRetryAfter` | Integer | `60000` | Maximum accepted `Retry-After` delay in milliseconds |
| `shouldRetry` | Function | `shouldRetryByDefault` | Policy receiving `{ error, response, method, headers, attempt }` |
| `timeout` | Integer or Function | `undefined` | Positive timeout in milliseconds per attempt, or `(attempt) => milliseconds` |
| `signal` | AbortSignal | `undefined` | External cancellation signal for the entire requester |

Other options (`method`, `headers`, `body`, etc.) are forwarded as default `fetch` options. Options passed to
`fetch(input, options)` override requester defaults. Headers are merged by name, with per-call values taking
precedence over defaults and headers inherited from a `Request` input.

A timeout function may return `undefined` to disable the timeout for an attempt. `timeout: 0` is invalid.

#### Returns

| Member | Signature | Description |
|---|---|---|
| `fetch` | `fetch(input, options = {})` | Executes a request using native `fetch` |
| `abort` | `abort(reason)` | Cancels the requester and its ongoing requests |
| `signal` | `AbortSignal` | Read-only combined requester signal |
| `aborted` | `boolean` | Read-only cancellation state |

`abort()` is permanent. An aborted requester cannot be reused. Per-call signals and the signal of a `Request`
input are also respected.

#### Retry behavior

The default policy only retries eligible methods (`GET`, `HEAD`, `OPTIONS`, `PUT`, `DELETE`) or requests with
a non-empty `Idempotency-Key`. The server must actually enforce that key for non-idempotent methods.

Eligible requests are retried on `408`, `429`, `500`, `502`, `503`, `504`, network failures and timeouts.
A custom `shouldRetry` replaces the default policy; compose with `shouldRetryByDefault` to extend it.

The default backoff doubles between attempts, is capped at 30 seconds, and uses 50–100% jitter. A valid
`Retry-After` header takes precedence over `retryDelay`. If its delay exceeds `maxRetryAfter`, the response
is returned without retrying.

With retries enabled, the body must be replayable: string, `ArrayBuffer`, typed array, `Blob`, `URLSearchParams`,
`FormData` or no body. Streams and a `Request` input already carrying a body are rejected.

`timeout` only covers waiting for the response headers, not subsequent body consumption. To bound the complete
exchange, pass a signal such as `AbortSignal.timeout(5000)`.

### shouldRetryByDefault

Exposes the default retry policy so it can be composed with a custom one.

#### Signature

```js
shouldRetryByDefault({ error, response, method, headers })
```

#### Returns

`true` when the request is eligible for retry and the response status or error is retryable; otherwise `false`.
The requester separately enforces the retry limit and never retries successful responses.

## Examples

### Shared defaults and per-call overrides

```js
import { createRequester } from '@kalisio/common-core/runtime'

const client = createRequester({ retries: 3, timeout: 5000 })
const users = await client.fetch('/api/users')
const projects = await client.fetch('/api/projects', { timeout: 10000, retries: 1 })
```

### Extend the default retry policy

```js
import { createRequester, shouldRetryByDefault } from '@kalisio/common-core/runtime'

const client = createRequester({
  retries: 2,
  shouldRetry: (context) =>
    shouldRetryByDefault(context) || context.response?.status === 409
})
```

### Cancel requests

```js
const client = createRequester()
const pending = client.fetch('/api/data')
client.abort(new Error('Cancelled'))
await pending // Rejects with the cancellation reason.
```
