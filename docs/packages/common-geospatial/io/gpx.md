---

title: gpx
description: Read GPX sources and convert them to GeoJSON.
---

# gpx

This module provides a reader to load GPX sources, convert them to GeoJSON, and validate the resulting GeoJSON object.

## readGpx

### Signature

```js
readGpx (source, options)
```

### Description

Reads an XML source using `xml.read` from `@kalisio/common-core/io`, converts the resulting GPX document to GeoJSON using `@tmcw/togeojson`, then validates the converted GeoJSON using `validateGeoJson`.

Invalid GeoJSON produced by the conversion does not cause the reader to throw. It is reported through the validation result with `valid: false` and the corresponding `errors` and `warnings`.

### Parameters

| Name      | Type                            | Required | Description                       |
| --------- | ------------------------------- | -------- | --------------------------------- |
| `source`  | `string \| URL \| Blob \| File` | yes      | XML source accepted by `xml.read` |
| `options` | `object`                        | no       | Options forwarded to `xml.read`   |

### Returns

| Type              | Description                                                                               |
| ----------------- | ----------------------------------------------------------------------------------------- |
| `Promise<object>` | An object containing the converted `geojson` and the result returned by `validateGeoJson` |

The returned object has the following structure:

```js
{
  geojson,
  valid,
  crs,
  errors,
  warnings,
  statistics
}
```

### Throws

Throws if the source cannot be read.

Throws if the source cannot be parsed as XML.

Throws if the GPX document cannot be converted to GeoJSON.

Invalid GeoJSON produced by the conversion is not thrown and is instead reported through the validation result.

### Examples

```js
const result = await readGpx('./track.gpx')

if (result.valid) {
  console.log(result.geojson)
} else {
  console.log(result.errors)
}
```
