---

title: geojson
description: Read and validate GeoJSON sources.
---

# geojson

This module provides a reader to load JSON sources and validate the decoded content as GeoJSON.

## readGeoJson

### Signature

```js
readGeoJson (source, options)
```

### Description

Reads a JSON source using `json.read` from `@kalisio/common-core/io`, then validates the decoded content using `validateGeoJson`.

The decoded value is always returned in the `geojson` property when reading and JSON parsing succeed.

Invalid GeoJSON content does not cause the reader to throw. It is reported through the validation result with `valid: false` and the corresponding `errors` and `warnings`.

### Parameters

| Name      | Type                            | Required | Description                         |
| --------- | ------------------------------- | -------- | ----------------------------------- |
| `source`  | `string \| URL \| Blob \| File` | yes      | JSON source accepted by `json.read` |
| `options` | `object`                        | no       | Options forwarded to `json.read`    |

### Returns

| Type              | Description                                                                             |
| ----------------- | --------------------------------------------------------------------------------------- |
| `Promise<object>` | An object containing the decoded `geojson` and the result returned by `validateGeoJson` |

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

Throws if the source cannot be parsed as JSON.

Invalid GeoJSON content is not thrown and is instead reported through the validation result.

### Examples

```js
const result = await readGeoJson('./data.geojson')

if (result.valid) {
  console.log(result.geojson)
} else {
  console.log(result.errors)
}
```

```js
// Valid JSON but invalid GeoJSON

const result = await readGeoJson('./invalid.geojson')

// {
//   geojson: { foo: 'bar' },
//   valid: false,
//   errors: [...],
//   warnings: [...],
//   ...
// }
```
