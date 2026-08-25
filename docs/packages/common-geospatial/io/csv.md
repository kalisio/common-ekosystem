---
title: CSV
description: Read geospatial point data from CSV sources.
---

# CSV

The CSV reader loads tabular data from a supported source and converts each row into a GeoJSON `Point` feature.

## readCsv

### Signature

```js
readCsv(source, options)
````

### Description

Reads CSV content using the CSV reader provided by `@kalisio/common-core/io` and converts parsed rows into a GeoJSON `FeatureCollection`.
The same source types and source-reading options are therefore supported.

Each row is converted into a GeoJSON `Feature` whose geometry is a `Point`.

By default, the reader expects two columns named `longitude` and `latitude`.

A different pair of coordinate columns can be specified through the `coordinates` option.

CSV rows are validated against an internal JSON Schema requiring the coordinate fields to be numeric. An additional user-defined `rowSchema` can also be provided and is combined with the coordinate schema.

The generated GeoJSON is then validated using `validateGeoJson`.

### Parameters

| Parameter                       | Type                            | Description                                                                                               | Default                                            |
| ------------------------------- | ------------------------------- | --------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| `source`                        | `string \| URL \| Blob \| File` | CSV source to read                                                                                        | —                                                  |
| `options`                       | `object`                        | CSV and geospatial reading options                                                                        | `{}`                                               |
| `options.header`                | `true \| string[]`              | Uses the first row as column names when `true`, or uses the provided column names without consuming a row | `true`                                             |
| `options.parser`                | `object`                        | PapaParse configuration options forwarded to the underlying CSV reader                                    | `{}`                                               |
| `options.rowSchema`             | `object`                        | Optional JSON Schema used to validate each row in addition to the required coordinate fields              | `undefined`                                        |
| `options.coordinates`           | `object`                        | Defines which CSV columns contain longitude and latitude                                                  | `{ longitude: 'longitude', latitude: 'latitude' }` |
| `options.coordinates.longitude` | `string`                        | Name of the longitude column                                                                              | `'longitude'`                                      |
| `options.coordinates.latitude`  | `string`                        | Name of the latitude column                                                                               | `'latitude'`                                       |
| `options.preserveCoordinates`   | `boolean`                       | Whether coordinate columns are kept in feature properties                                                 | `true`                                             |

The underlying CSV reader ignores empty lines by default through PapaParse `skipEmptyLines: true`. This behavior can be overridden through `parser.skipEmptyLines`.

Because row validation is always enabled to validate coordinate fields, `parser.dynamicTyping` cannot be enabled. Type coercion is handled by the JSON Schema validator.

### Returns

| Type              | Description                                                                                     |
| ----------------- | ----------------------------------------------------------------------------------------------- |
| `Promise<object>` | The generated GeoJSON together with CSV parsing, row validation, and GeoJSON validation results |

The returned object contains:

```js
{
  geojson,
  parseErrors,
  parseMeta,
  validationErrors,
  valid,
  errors,
  warnings,
  ...
}
```

| Property           | Type                | Description                                                                                     |
| ------------------ | ------------------- | ----------------------------------------------------------------------------------------------- |
| `geojson`          | `FeatureCollection` | GeoJSON FeatureCollection generated from the CSV rows                                           |
| `parseErrors`      | `Array`             | CSV parsing errors reported by the underlying CSV reader                                        |
| `parseMeta`        | `object`            | CSV parsing metadata. `parseMeta.fields` contains the parsed column names when headers are used |
| `validationErrors` | `Array`             | Row validation errors reported by the JSON Schema validator                                     |
| `valid`            | `boolean`           | Whether the generated GeoJSON is valid                                                          |
| `errors`           | `Array`             | GeoJSON validation errors                                                                       |
| `warnings`         | `Array`             | GeoJSON validation warnings                                                                     |

Rows are not removed when validation fails. They remain in the generated GeoJSON and validation problems are reported separately.

### Coordinate handling

By default, the following columns are used:

```js
{
  longitude: 'longitude',
  latitude: 'latitude'
}
```

For a CSV containing different column names:

```csv
name,lon,lat
Paris,2.3522,48.8566
```

use:

```js
const result = await readCsv('./points.csv', {
  coordinates: {
    longitude: 'lon',
    latitude: 'lat'
  }
})
```

Coordinate values are coerced to numbers by the JSON Schema validator.

Geographic constraints such as valid longitude and latitude ranges are not enforced by the CSV row schema. They are validated by `validateGeoJson` on the generated GeoJSON.

### Row schema

An additional JSON Schema can be provided to validate application-specific row properties:

```js
const result = await readCsv('./points.csv', {
  rowSchema: {
    type: 'object',
    properties: {
      name: { type: 'string' }
    },
    required: ['name']
  }
})
```

The user-defined schema is combined with the internal coordinate schema, so every row must satisfy both.

When using `additionalProperties: false`, the user schema must also declare the coordinate properties if they are present in the CSV row.

### Preserving coordinate properties

Coordinate columns are preserved in feature properties by default:

```js
{
  type: 'Feature',
  geometry: {
    type: 'Point',
    coordinates: [2.3522, 48.8566]
  },
  properties: {
    name: 'Paris',
    longitude: 2.3522,
    latitude: 48.8566
  }
}
```

They can be removed from feature properties with:

```js
const result = await readCsv('./points.csv', {
  preserveCoordinates: false
})
```

which produces:

```js
{
  type: 'Feature',
  geometry: {
    type: 'Point',
    coordinates: [2.3522, 48.8566]
  },
  properties: {
    name: 'Paris'
  }
}
```

### Throws

Throws when:

* the source cannot be read;
* the source type is unsupported;
* CSV parsing options are invalid;
* reader options are invalid;
* `parser.dynamicTyping` is enabled while row validation is active.

CSV parsing errors themselves are returned through `parseErrors`.

Row validation errors are returned through `validationErrors`.

GeoJSON validation errors are returned through `errors` and `warnings`.

### Examples

Read a CSV using the default coordinate columns:

```js
import { readCsv } from '@kalisio/common-geospatial/io'

const result = await readCsv('./points.csv')

if (result.valid) {
  console.log(result.geojson)
}
```

Read a semicolon-separated CSV using custom coordinate columns:

```js
const result = await readCsv('./points.csv', {
  coordinates: {
    longitude: 'lon',
    latitude: 'lat'
  },
  parser: {
    delimiter: ';'
  }
})
```
