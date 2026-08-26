---
title: common-geospatial
description: Geospatial utilities for the Kalisio ekosystem
---

# common-geospatial

_Geospatial utilities for the Kalisio ekosystem_

## Overview

**common-geospatial** is organized around three modules:
- [foundation](foundation/axes.md) - fundamental definitions and utilities
- [operators](operators/is-like.md) - high-level data processing functions
- [io](io/csv.md) - helpers for reading external data sources

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


## Usage

### Imports

The package can be imported from its root entry point:

```js
import { WGS84, validateGeoJson } from '@kalisio/common-geospatial'
```

For more explicit imports, each module is also exposed as a dedicated subpath:

```js
import { WGS84, reprojectPosition } from '@kalisio/common-geospatial/foundation'
import { validateGeoJson } from '@kalisio/common-geospatial/operators'
import { ... } from '@kalisio/common-geospatial/io'
```

### Examples

#### Validating and fixing a GeoJSON

```js
import {
  validateGeoJson,
  isGeoJsonFixable,
  fixGeoJson
} from '@kalisio/common-geospatial/operators'

const validation = validateGeoJson(geoJson)
if (!validation.valid && isGeoJsonFixable(validation)) {
  const fix = fixGeoJson(geoJson, validation)
}
```
