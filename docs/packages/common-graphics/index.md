---
title: common-graphics
description: Graphics utilities for the Kalisio ekosystem
---

# common-graphics

_Graphics utilities for the Kalisio ekosystem_

## Overview

**common-graphics** is a lightweight library that provides graphics utilities that work in both **browsers** and **Node.js**.

It is organized around 2 modules:
- [utilities](./API/utilities/color.md) — general purpose utility functions
- [shapes](./API/shapes/shape-factory.md) — factory producing shape objects that can be rendered as SVG or PNG.

## Installation

Install with your preferred package manager:

::: code-group

```bash [pnpm]
pnpm add @kalisio/common-graphics
```

```bash [npm]
npm install @kalisio/common-graphics
```

```bash [yarn]
yarn add @kalisio/common-graphics
```

:::

Or use it directly from a CDN:

```html
<script type="module">
  import { shapes } from 'https://unpkg.com/@kalisio/common-graphics/dist/index.es.js'
</script>
```