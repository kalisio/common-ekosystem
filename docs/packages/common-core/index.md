---
title: common-core
description: Core utilities for the Kalisio ekosystem
---

# common-core

_Core utilities for the Kalisio ekosystem_

## Overview

**common-core** is a lightweight library that provides core utilities that work in both **browsers** and **Node.js**.

It is organized around four modules:
- [predicates](./predicates/assert.md) - minimalist conditional and assertion functions
- [utilities](./utilities/byte.md) - general purpose utility functions
- [io](./io/csv.md) - helpers for reading and parsing external data sources
- [operators](./operators/compare.md) - higher-order functions that process data

## Installation

Install with your preferred package manager:

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

Or use it directly from a CDN:

```html
<script type="module">
  import { url } from 'https://unpkg.com/@kalisio/common-core/dist/index.mjs'
</script>
```


## Usage

### Imports

Each module is exposed as a dedicated subpath. Operators are further split into one subpath per operator:

```js
// Predicates
import { is, assert } from '@kalisio/common-core/predicates'

// Utilities
import { string, object } from '@kalisio/common-core/utilities'

// IO
import { csv, xml } from '@kalisio/common-core/io'

// Operators
import { compare } from '@kalisio/common-core/operators/compare'
import { quantify } from '@kalisio/common-core/operators/quantify'
import { sanitize } from '@kalisio/common-core/operators/sanitize'
import { transform } from '@kalisio/common-core/operators/transform'
```

### Examples

See the module documentation for detailed usage examples of all available functions.