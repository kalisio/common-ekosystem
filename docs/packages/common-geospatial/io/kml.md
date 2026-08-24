---

title: kml
description: Read KML sources and convert them to GeoJSON.
---

# kml

This module provides a reader to load KML sources, convert them to GeoJSON, and validate the resulting GeoJSON object.

## readKml

### Signature

```js
readKml (source, options)
```

### Description

Reads an XML source using `xml.read` from `@kalisio/common-core/io`, converts the resulting KML document to GeoJSON using `@tmcw/togeojson`, then validates the converted GeoJSON using `validateGeoJson`.

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

Throws if the KML document cannot be converted to GeoJSON.

Invalid GeoJSON produced by the conversion is not thrown and is instead reported through the validation result.

### Examples

```js
const result = await readKml('./data.kml')

if (result.valid) {
  console.log(result.geojson)
} else {
  console.log(result.errors)
}
```
