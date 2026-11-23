---
title: common-geospatial
description: Geospatial utilities for the Kalisio ekosystem
---

# common-geospatial

_Geospatial utilities for the Kalisio ekosystem_

## Overview

**common-geospatial** is organized around four modules.

- [foundation](./foundation/axes.md) — Coordinates, projections, and geometry primitives.
- [operators](./operators/is-like.md) — GeoJSON validation and processing.
- [io](./io/geojson.md) — Readers for GeoJSON, GPX, and KML.
- [utilities](./io/locales.md) — Various utilities

Use [setup](./setup.md) to register the catalogs for direction labels and validation messages.

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

## Usage

### Imports

The package can be imported from its root entry point:

```js
import { WGS84, validateGeoJson, locales, nvector } from '@kalisio/common-geospatial'
```

Dedicated subpaths are available for foundation, operators, I/O, and setup.

```js
import { WGS84, reprojectPosition } from '@kalisio/common-geospatial/foundation'
import { validateGeoJson } from '@kalisio/common-geospatial/operators'
import { readGeoJson } from '@kalisio/common-geospatial/io'
import { setup } from '@kalisio/common-geospatial/setup'
```

### Examples

See the module documentation for detailed usage examples of all available functions.

#### Validating and fixing a GeoJSON

```js
import {
  validateGeoJson,
  isGeoJsonFixable,
  fixGeoJson
} from '@kalisio/common-geospatial/operators'

const validation = validateGeoJson(geoJson)
if (!validation.valid && isGeoJsonFixable(validation)) {
  const fix = fixGeoJson(geoJson, { validation })
}
```
