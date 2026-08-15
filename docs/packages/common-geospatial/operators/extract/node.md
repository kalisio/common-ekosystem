---
title: node
description: Extract a node from a GeoJSON object.
---

# node

## extractNode

### Signature

```js
extractNode (geoJson, path)
```

### Description

Extracts the node reachable through a dot-separated path within a GeoJSON object. The path can traverse both object properties and array indexes.

Returns `undefined` if the path cannot be resolved. Falsy values such as `false`, `0`, and `null` are returned as-is.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `geoJson` | `object` | yes | Any valid GeoJSON object (geometry, Feature, or FeatureCollection) |
| `path` | `string` | yes | Dot-separated path to the node |

### Returns

| Type | Description |
|------|-------------|
| `* \| undefined` | The node found at `path`, or `undefined` if the path cannot be resolved |

### Throws

Throws if `geoJson` is not a valid GeoJSON object.
Throws if `path` is not a non-empty string.

### Examples

```js
// Top-level node
extractNode({
  type: 'Feature',
  geometry: { type: 'Point', coordinates: [2.349, 48.864] },
  properties: { name: 'Paris' }
}, 'type')
// 'Feature'
```

```js
// Nested node
extractNode({
  type: 'Feature',
  geometry: { type: 'Point', coordinates: [2.349, 48.864] },
  properties: { name: 'Paris' }
}, 'properties.name')
// 'Paris'
```

```js
// Array index
extractNode({
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [2.349, 48.864] },
      properties: { name: 'Paris' }
    }
  ]
}, 'features.0.properties.name')
// 'Paris'
```

```js
// Coordinate
extractNode({
  type: 'Point',
  coordinates: [2.349, 48.864]
}, 'coordinates.1')
// 48.864
```

```js
// Missing node
extractNode({
  type: 'Feature',
  geometry: null,
  properties: {}
}, 'properties.name')
// undefined
```