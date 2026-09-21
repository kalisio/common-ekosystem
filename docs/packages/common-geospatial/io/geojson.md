---

title: geojson
description: Read and validate GeoJSON sources.
---

# geojson

This module provides a reader to load JSON sources and validate the decoded content as GeoJSON.

## readGeoJson

### Signature

```js
readGeoJson(source, options)
```

### Description

Reads a JSON source using `json.read` from `@kalisio/common-core/io/json`, then validates the
decoded content using `validateGeoJson`.

The decoded value is always returned in the `geojson` property when reading and JSON parsing succeed.

Invalid GeoJSON content does not cause the reader to throw. It is reported through the validation
result with `valid: false` and the corresponding `errors` and `warnings`.

### Parameters

| Name               | Type                            | Req | Description                   |
| ------------------ | ------------------------------- | --- | ----------------------------- |
| `source`           | `string \| URL \| Blob \| File` | yes | JSON source                   |
| `options`          | `object`                        | no  | Options passed to `json.read` |
| `options.encoding` | `string`                        | no  | File encoding                 |
| `options.request`  | `object`                        | no  | Options passed to `request`   |
| `options.reviver`  | `function`                      | no  | JSON reviver                  |

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
const result = await readGeoJson('https://example.com/data.geojson', {
  request: {
    retries: 3,
    timeout: 5000
  }
})
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
