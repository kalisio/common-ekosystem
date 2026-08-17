---
title: common-geospatial
description: Geospatial utilities for the Kalisio ekosystem
---

# common-geospatial

_Geospatial utilities for the Kalisio ekosystem_

## Overview

**common-geospatial** is organized around two modules:
- [foundation](foundation/axes.md) — fundamental definitions and utilities
- [operators](operators/is-like.md) — hih-level data processing functions

## Installation

Install with your preferred package manager:

::: code-group

```bash [pnpm]
pnpm add @kalisio/common-geospatial
```

```bash [npm]
npm install @kalisio/common-geospatial
```

```bash [yarn]
yarn add @kalisio/common-geospatial
```

:::

Or use it directly from a CDN:

```html
<script type="module">
  import { validateGeoJson } from 'https://unpkg.com/@kalisio/common-geospatial/dist/index.mjs'
</script>
```