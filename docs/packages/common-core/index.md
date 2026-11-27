---
title: common-core
description: Core utilities for the Kalisio ecosystem.
---

# common-core

_Core utilities for the Kalisio ecosystem_

## Overview

`@kalisio/common-core` provides reusable utilities, data structures, runtime components, parsers, and operators for Node.js and browser applications.

It is organized around six modules:

- [predicates](./predicates/assert.md) — Value checks, assertions, and schema validation.
- [utilities](./utilities/byte.md) — General-purpose stateless helpers.
- [structures](./structures/registry.md) — Registries, factories, and in-memory caches.
- [runtime](./runtime/event-bus.md) — Application-level services with explicit lifecycle management.
- [io](./io/csv.md) — Reading and parsing external data formats.
- [operators](./operators/compare.md) — Higher-order operations on data.

Application-level services can be installed through [setup](./setup.md).

## Installation

::: code-group

```bash [pnpm]
pnpm add @kalisio/common-core
```

```bash [npm]
npm install @kalisio/common-core
```

```bash [yarn]
yarn add @kalisio/common-core
```

:::

Node.js 24 or later is required when running in Node.js.

## Usage

Each module is exposed through dedicated package subpaths. There is no root `@kalisio/common-core` entry point.

### Predicates

```js
import { is, has, assert, ensure, conform, optional, match } from '@kalisio/common-core/predicates'
```

See [predicates](./predicates/is.md).

### Utilities

```js
import { url, string, object, promise, schedule } from '@kalisio/common-core/utilities'
```

See [URL utilities](./utilities/url.md) and [promise utilities](./utilities/promise.md), including the [synchronous result check](./utilities/promise.md#checknotthenable).

### Structures

```js
import { Registry, Factory, Cache } from '@kalisio/common-core/structures'
```

`Registry` stores named entries, `Factory` registers creator functions, and `Cache` adds LRU eviction and optional TTL expiration.

See [Registry](./structures/registry.md), [Factory](./structures/factory.md), and [Cache](./structures/cache.md).

### Runtime

```js
import {
  EventBus,
  setLocales, getLocales,
  getLogger,
  listen, waitFor,
  createRequester
} from '@kalisio/common-core/runtime'
```

Runtime features include an event bus, locale management, logging, event subscription helpers, and an HTTP requester.

See [EventBus](./runtime/event-bus.md), [Locales](./runtime/locales.md), [logger](./runtime/logger.md), [event-listeners](./runtime/event-listeners.md), and [requester](./runtime/requester.md).

### Application setup

```js
import { setup } from '@kalisio/common-core/setup'
import { EventBus, getLocales } from '@kalisio/common-core/runtime'

const bus = new EventBus()
setup({ locales: { default: 'en', fallback: 'en', bus } })
getLocales().register('fr', { label: 'Français' })
```

`setup()` may also receive a logger factory. Initialize `common-core` before setting up other packages that use these shared services.

See [setup](./setup.md).

### IO

```js
import { json } from '@kalisio/common-core/io/json'
import { csv } from '@kalisio/common-core/io/csv'
import { xml } from '@kalisio/common-core/io/xml'
import { yaml } from '@kalisio/common-core/io/yaml'
```

Some IO modules use optional peer dependencies:

| Module | Package |
|---|---|
| `io/csv` | `papaparse`, `ajv` |
| `io/xml` | `fast-xml-parser`. Install `@xmldom/xmldom` for DOM output when neither a native nor a custom DOM parser is available. |
| `io/yaml` | `js-yaml` |

Install the dependencies needed by the formats you use.

### Operators

```js
import { compare } from '@kalisio/common-core/operators/compare'
import { quantify } from '@kalisio/common-core/operators/quantify'
import { request } from '@kalisio/common-core/operators/request'
import { sanitize } from '@kalisio/common-core/operators/sanitize'
import { transform } from '@kalisio/common-core/operators/transform'
```

Some operators use optional peer dependencies:

| Operator | Package |
|---|---|
| `compare` | `lodash-es` |
| `sanitize` | `sanitize-html` |
| `transform` | `lodash-es`, `mathjs`, `moment`, `sift` |

See each operator's page for signatures, options, and examples.
