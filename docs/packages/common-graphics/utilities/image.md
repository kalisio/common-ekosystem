---
title: image
description: Utility functions for resolving, inspecting, processing, and transforming images in browser and Node.js environments.
---

# image

The `image` utility provides a common API for image processing in **browser** and **Node.js** environments.

In the browser, image inputs can be provided as a `Blob` or a string that can be fetched as an image resource, including URLs and data URLs.

In Node.js, image inputs can be provided as a `Buffer`, a file path, or a base64-encoded data URL.

Outputs are returned as a `Blob` in the browser and a `Buffer` in Node.js.

::: warning
Node.js usage requires [`sharp`](https://sharp.pixelplumbing.com/) as a peer dependency (`npm install sharp`).
:::

## Supported formats

Supported output formats for `fromSVG` depend on the runtime:

| Environment | Formats |
|-------------|---------|
| Browser | `png`, `jpeg`, `webp` |
| Node.js | `png`, `jpeg`, `jpg`, `webp`, `avif`, `tiff` |

## resolve

### Signature

```js
image.resolve(img)
```

### Description

Resolves an image source to the native binary representation used by the current environment.

In the browser, an existing `Blob` is returned as-is. String inputs are retrieved using `fetch()` and converted to a `Blob`.

In Node.js, an existing `Buffer` is returned as-is. String inputs are interpreted either as file paths or as base64-encoded data URLs.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `img` | `Blob \| string` (browser) or `Buffer \| string` (Node) | yes | The image source |

### Returns

| Type | Description |
|------|-------------|
| `Promise<Blob>` (browser) | Resolved image as a Blob |
| `Promise<Buffer>` (Node.js) | Resolved image as a Buffer |

### Examples

```js
// Browser
const blob = await image.resolve('/images/photo.png')

// Browser — existing Blob
const sameBlob = await image.resolve(blob)

// Node.js — file path
const buffer = await image.resolve('/path/to/photo.jpg')

// Node.js — base64 data URL
const buffer = await image.resolve('data:image/png;base64,...')
```

> In Node.js, only base64-encoded data URLs are supported.

## metadata

### Signature

```js
image.metadata(img)
```

### Description

Returns the dimensions and basic metadata of an image.

In the browser, the returned object contains the image dimensions, size, and MIME subtype.

In Node.js, the full metadata object returned by `sharp` is exposed, with a guaranteed `size` field that falls back to the resolved buffer size when necessary.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `img` | `Blob \| string` (browser) or `Buffer \| string` (Node) | yes | The source image |

### Returns

**Browser**

| Field | Type | Description |
|-------|------|-------------|
| `width` | `number` | Width in pixels |
| `height` | `number` | Height in pixels |
| `size` | `number` | Size in bytes |
| `format` | `string \| null` | MIME subtype (e.g. `'jpeg'`, `'png'`) |

**Node.js**

Returns the full [sharp metadata object](https://sharp.pixelplumbing.com/api-input#metadata), plus a guaranteed `size` field that falls back to `buffer.byteLength` when sharp cannot determine it.

### Examples

```js
// Browser
const meta = await image.metadata(blob)
// { width: 1920, height: 1080, size: 204800, format: 'jpeg' }

// Node.js
const meta = await image.metadata('/path/to/photo.jpg')
// { width: 1920, height: 1080, format: 'jpeg', size: 204800, channels: 3, density: 72, ... }

// From a data URL
const meta = await image.metadata('data:image/png;base64,...')
// { width: 800, height: 600, format: 'png', size: 12043, ... }
```

## resize

### Signature

```js
image.resize(img, width, height, quality = 0.8)
```

### Description

Resizes an image to the given dimensions while preserving its input format. In the browser, resizing uses `createImageBitmap()` and `OffscreenCanvas`. In Node.js, resizing is performed by `sharp`.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `img` | `Blob \| string` (browser) or `Buffer \| string` (Node) | yes | The source image |
| `width` | `number` | yes | Target width in pixels. Must be a positive integer |
| `height` | `number` | yes | Target height in pixels. Must be a positive integer |
| `quality` | `number` | no | Compression quality between `0` and `1`. Defaults to `0.8` |

### Returns

| Type | Description |
|------|-------------|
| `Blob` (browser) | Resized image as a Blob |
| `Buffer` (Node.js) | Resized image as a Buffer |

### Examples

```js
// Browser
const resized = await image.resize(blob, 320, 240)
// Blob { type: 'image/jpeg', size: ... }

// Browser — high quality PNG
const resized = await image.resize(pngBlob, 1280, 720, 1.0)

// Node.js — from a file path
const buffer = await image.resize('/photos/original.jpg', 800, 600)

// Node.js — lower quality for thumbnail
const thumb = await image.resize(inputBuffer, 128, 128, 0.6)

// Throws if arguments are invalid
await image.resize(blob, -1, 240)
// Error: width must be a positive integer

await image.resize(blob, 320, 240, 1.5)
// Error: quality must be a number within the range [0,1]
```

## toDataURL

### Signature

```js
image.toDataURL(img)
```

### Description

Converts an image to a base64-encoded data URL. In the browser, the MIME type comes from the resolved `Blob`. In Node.js, the image format is detected using `sharp`.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `img` | `Blob \| string` (browser) or `Buffer \| string` (Node) | yes | The source image |

### Returns

| Type | Description |
|------|-------------|
| `string` | A base64 data URL of the form `data:<mime>;base64,<data>` |

### Examples

```js
// Browser
const url = await image.toDataURL(blob)
// 'data:image/jpeg;base64,/9j/4AAQSkZJRg...'

// Node.js — from a file path
const url = await image.toDataURL('/path/to/photo.png')
// 'data:image/png;base64,iVBORw0KGgo...'

// Useful for injecting into an <img> tag
img.src = await image.toDataURL(blob)
```

## fromSVG

### Signature

```js
image.fromSVG(svg, options = {})
```

### Description

Converts SVG markup to a raster image. In the browser, the SVG is loaded into an `Image` and rendered to an `OffscreenCanvas`. In Node.js, conversion is performed by `sharp`.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `svg` | `string` | yes | The SVG markup to convert |
| `options` | `object` | no | Conversion options |
| `options.format` | `string` | no | Output format. Defaults to `'png'`. Supported formats depend on the runtime |
| `options.quality` | `number` | no | Compression quality between `0` and `1`. Defaults to `1` |

### Returns

| Type | Description |
|------|-------------|
| `Blob` (browser) | Rasterized image as a Blob |
| `Buffer` (Node.js) | Rasterized image as a Buffer |

### Examples

```js
// Browser — default PNG output
const blob = await image.fromSVG('<svg .../>')
// Blob { type: 'image/png', size: ... }

// Browser — JPEG output
const blob = await image.fromSVG('<svg .../>', { format: 'jpeg', quality: 0.9 })
// Blob { type: 'image/jpeg', size: ... }

// Node.js — default PNG output
const buffer = await image.fromSVG('<svg .../>')

// Node.js — WebP output
const buffer = await image.fromSVG('<svg .../>', { format: 'webp', quality: 0.8 })

// Combined with toDataURL
const url = await image.toDataURL(await image.fromSVG('<svg .../>'))
// 'data:image/png;base64,iVBORw0KGgo...'
```