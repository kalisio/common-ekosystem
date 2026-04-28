---
title: common-core
description: Core utilities for the Kalisio ekosystem
---

# common-core

_Core utilities for the Kalisio ekosystem_

## Overview

**common-core** is a lightweight library that provides core utilities for web development.

It is organized around two modules:
- [predicates](./API/predicates/assert.md) — minimalist conditional and assertion functions
- [utilities](./API/utilities/file.md) — general purpose utility functions
- [operators](./API/operators/compare.md) - higher-order functions that process data

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