---
title: common-core
description: Core utilities for the Kalisio ekosystem
---

# common-core

_Core utilities for the Kalisio ekosystem_

## Overview

**common-core** is a lightweight library that provides core utilities that work in both **browsers** and **Node.js**.

It is organized around 3 modules:
- [predicates](./predicates/assert.md) — minimalist conditional and assertion functions
- [utilities](./utilities/byte.md) — general purpose utility functions
- [operators](./operators/compare.md) — higher-order functions that process data

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
  import { url } from 'https://unpkg.com/@kalisio/common-core/dist/index.es.js'
</script>
```