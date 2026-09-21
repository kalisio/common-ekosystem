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
```

### Description

Reads CSV content using the CSV reader provided by `@kalisio/common-core/io/csv` and converts parsed rows into
a GeoJSON `FeatureCollection`.

The same source types and source-reading options are supported.

Each row is converted into a GeoJSON `Feature` whose geometry is a `Point`.

By default, the reader expects two columns named `longitude` and `latitude`. Different coordinate columns can be
specified through `coordinates`.

CSV rows are validated against an internal JSON Schema requiring coordinate fields to be numeric. An additional
`rowSchema` can be provided and is combined with this schema.

The generated GeoJSON is then validated using `validateGeoJson`.

### Parameters

| Name                          | Type                            | Default   | Description                    |
| ----------------------------- | ------------------------------- | --------- | ------------------------------ |
| `source`                      | `string \| URL \| Blob \| File` | —         | CSV source                     |
| `options`                     | `object`                        | `{}`      | Read and conversion options    |
| `options.encoding`            | `string`                        | `'utf-8'` | File encoding                  |
| `options.request`             | `object`                        | —         | Options passed to `request`    |
| `options.header`              | `true \| string[]`              | `true`    | CSV column names               |
| `options.parser`              | `object`                        | `{}`      | PapaParse options              |
| `options.rowSchema`           | `object`                        | —         | Additional row schema          |
| `options.coordinates`         | `object`                        | —         | Coordinate columns             |
| `options.preserveCoordinates` | `boolean`                       | `true`    | Keep coordinates in properties |

The default coordinate columns are:

```js
{
  longitude: 'longitude',
  latitude: 'latitude'
}
```

The underlying CSV reader ignores empty lines by default through PapaParse `skipEmptyLines: true`.
This can be overridden with `parser.skipEmptyLines`.

Because row validation is always enabled for coordinate fields, `parser.dynamicTyping` cannot be enabled.
Type coercion is handled by the JSON Schema validator.

### Returns

| Type              | Description             |
| ----------------- | ----------------------- |
| `Promise<object>` | CSV and GeoJSON results |

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

| Property           | Type                | Description           |
| ------------------ | ------------------- | --------------------- |
| `geojson`          | `FeatureCollection` | Generated GeoJSON     |
| `parseErrors`      | `Array`             | CSV parsing errors    |
| `parseMeta`        | `object`            | CSV parsing metadata  |
| `validationErrors` | `Array`             | Row validation errors |
| `valid`            | `boolean`           | GeoJSON validity      |
| `errors`           | `Array`             | GeoJSON errors        |
| `warnings`         | `Array`             | GeoJSON warnings      |

Rows are not removed when validation fails. They remain in the generated GeoJSON and
validation problems are reported separately.

### Coordinate handling

For a CSV using different column names:

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

Geographic constraints such as longitude and latitude ranges are validated by `validateGeoJson`,
not by the CSV row schema.

### Row schema

An additional JSON Schema can validate application-specific properties:

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

The user-defined schema is combined with the internal coordinate schema, so each row must satisfy both.

When using `additionalProperties: false`, the user schema must also declare the coordinate properties when they are present in the CSV row.

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

They can be removed with:

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

CSV parsing errors are returned through `parseErrors`.

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

Read a remote CSV:

```js
const result = await readCsv('https://example.com/points.csv', {
  request: {
    retries: 3,
    timeout: 5000
  }
})
```
