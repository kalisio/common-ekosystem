---

title: kml
description: Read KML sources and convert them to GeoJSON.
---

# kml

This module provides a reader to load KML sources, convert them to GeoJSON, and validate the resulting GeoJSON object.

## readKml

### Signature

```js
readKml(source, options)
```

### Description

Reads an XML source using `xml.read` from `@kalisio/common-core/io/xml`, converts the resulting KML document
to GeoJSON using `@tmcw/togeojson`, then validates the converted GeoJSON using `validateGeoJson`.

XML is always read as a DOM document.

Invalid GeoJSON produced by the conversion does not cause the reader to throw. It is reported through the
validation result with `valid: false` and the corresponding `errors` and `warnings`.

### Parameters

| Name                | Type                            | Req | Description                  |
| ------------------- | ------------------------------- | --- | ---------------------------- |
| `source`            | `string \| URL \| Blob \| File` | yes | KML source                   |
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

```js
const result = await readKml('https://example.com/data.kml', {
  request: {
    retries: 3,
    timeout: 5000
  }
})
```
