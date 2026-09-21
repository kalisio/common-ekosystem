---

title: gpx
description: Read GPX sources and convert them to GeoJSON.
---

# gpx

This module provides a reader to load GPX sources, convert them to GeoJSON, and validate the resulting GeoJSON object.

## readGpx

### Signature

```js
readGpx(source, options)
```

### Description

Reads an XML source using `xml.read` from `@kalisio/common-core/io/xml`, converts the resulting GPX document
to GeoJSON using `@tmcw/togeojson`, then validates the converted GeoJSON using `validateGeoJson`.

XML is always read as a DOM document.

Invalid GeoJSON produced by the conversion does not cause the reader to throw. It is reported through the
validation result with `valid: false` and the corresponding `errors` and `warnings`.

### Parameters

| Name                | Type                            | Req | Description                  |
| ------------------- | ------------------------------- | --- | ---------------------------- |
| `source`            | `string \| URL \| Blob \| File` | yes | GPX source                   |
| `options`           | `object`                        | no  | Options passed to `xml.read` |
| `options.encoding`  | `string`                        | no  | File encoding                |
| `options.request`   | `object`                        | no  | Options passed to `request`  |
| `options.domParser` | `object`                        | no  | Custom DOM parser            |

### Returns

| Type              | Description                   |
| ----------------- | ----------------------------- |
| `Promise<object>` | GeoJSON and validation result |

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

```js
const result = await readGpx('https://example.com/track.gpx', {
  request: {
    retries: 3,
    timeout: 5000
  }
})
```
