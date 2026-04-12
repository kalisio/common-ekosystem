
---
title: transform
description: A flexible utility to transform JSON objects and arrays using mapping, filtering, type conversion, and structural operations.
---

# transform

## Signature

```js
transform (json, options)
```

## Description

Transform JSON objects and arrays using mapping, filtering, type conversion, and structural operations.

## Parameters

| Name | Type | Required | Description |
|---|---|---|---|
| `json` | `Object` | yes | The input json object. |
| `options` | `Object` | yes | The transformation to apply. |

The `options` object supports the following specifications:

| Name | Type | Description |
|--------|------|-------------|
| `toArray` | `boolean` | Indicates if the JSON object will be transformed into an array using [Lodash](https://lodash.com/docs#toArray), defaults to `false`. |
| `toObjects` | `string[]` | If input JSON objects are flat arrays, they will be transformed into objects according to the given indexed list of property names used as keys. Not defined by default. |
| `filter` | `object` | Filter applied to the JSON object using any option supported by [sift](https://github.com/crcn/sift.js). |
| `mapping` | `object` | Map between input key path and output key path supporting dot notation. Values can also be a structure (see details below). |
| `unitMapping` | `object` | Map between input key path (dot notation) and unit/date conversion rules using [math.js](http://mathjs.org/docs/datatypes/units.html) or [moment.js](https://momentjs.com/). |
| `pick` | `string[]` | Array of properties to be picked using [Lodash](https://lodash.com/docs#pick). |
| `omit` | `string[]` | Array of properties to be omitted using [Lodash](https://lodash.com/docs#omit). |
| `merge` | `object` | Object merged into each JSON object using [Lodash](https://lodash.com/docs#merge). |
| `asObject` | `boolean` | If true, converts a single-element array into an object. Defaults to `false`. |
| `asArray` | `boolean` | If true, wraps output into an array containing the object. Defaults to `false`. |

- `mapping` entry can be either:
  - a `string` (target path)
  - or an `object` with:

    ```js
    {
      path: "target.path",
      value: {
        "inputValue": "outputValue"
      },
      delete: true
    }
    ```

- `unitMapping` supports advanced value conversion:
  - `from`: source unit or date format
  - `to`: target unit or date format
  - `asDate`: treat value as date (utc or local)
  - `asString`: convert to string (optionally radix)
  - `asNumber`: convert to number
  - `asCase`: apply case transformation (lodash or native string method)
  - `empty`: value to be set if the input value is empty
