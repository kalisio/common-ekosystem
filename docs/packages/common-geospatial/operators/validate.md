---
title: validate
description: Validate GeoJSON objects and report errors and warnings.
---

# validate

The validation module exposes `validateGeoJson()` to validate GeoJSON geometries, `Feature`s, and `FeatureCollection`s.

Validation results use stable codes from `VALIDATION_CODES` and can include errors, warnings, and statistics.

## validateGeoJson

### Signature

```js
validateGeoJson (geoJson, options = {})
```

### Description

Validates a GeoJSON geometry, `Feature`, or `FeatureCollection`.

The set of checks applied depends on the document's coordinate reference system: CRS-independent checks always run, and geodesic checks run only when the root CRS is equivalent to WGS84. See [Coordinate reference systems](#coordinate-reference-systems) for how the CRS is resolved.

### Parameters

| Name                | Type     | Required | Description                                                                                                            |
| ------------------- | -------- | -------- | -------------------------------------------------------------------------------------------------------------------- |
| `geoJson`           | `object` | yes      | GeoJSON object to validate                                                                                            |
| `options`           | `object` | no       | Validation options                                                                                                    |
| `options.precision` | `number` | no       | Maximum recommended precision for geodesic longitude/latitude coordinates. Defaults to `DEFAULT_COORDINATE_PRECISION` |

### Returns

```js
{
  valid: boolean,
  crs: string,        // resolved CRS name; WGS84 when none is declared
  errors: ValidationIssue[],
  warnings: ValidationIssue[],
  statistics: {
    Feature: number,
    FeatureCollection: number,
    geometries: {
      [geometryType]: number
    }
  }
}
```

`valid` is `true` when `errors` is empty; warnings never affect `valid`.

`crs` is the coordinate reference system resolved from the root `crs` member (normalized), or the WGS84 default when none is declared. It reflects the CRS actually used to select the validation checks. It is absent when the top-level `type` is unrecognized (`UNKNOWN_TYPE`), since no CRS resolution occurs in that case.

A validation issue has the following shape:

```js
{
  code: string,      // a VALIDATION_CODES entry
  path: string,      // JSON Pointer-like location, empty ('') at the document root
  params?: object    // code-specific data, see the Errors/Warnings tables
}
```

Paths use a JSON Pointer-like notation such as `/coordinates/0`, `/features/2/geometry`, or `/bbox`. Array positions are carried in the path itself (e.g. the `0` in `/features/0`), so issues have no separate index field.

`statistics` counts the objects encountered during validation: the number of `Feature` and `FeatureCollection` wrappers, and a per-type breakdown of geometries under `geometries`. A counter is incremented only when the object carries a recognized `type`; objects with a missing or unknown type are not counted. A bare geometry therefore yields `Feature: 0` and `FeatureCollection: 0`, with only its matching `geometries` entry set. A `GeometryCollection` counts as a single `GeometryCollection` geometry — its members are not broken down into the tally.

### Throws

Throws only if `geoJson` is not a non-empty object. Options are not validated (a non-numeric `precision` is used as-is, not rejected). All other problems are reported through `errors`/`warnings`, never thrown.

## Coordinate reference systems

This section is the single source of truth for CRS handling; validation behaviour derives from it.

The coordinate reference system is resolved from the **root** `crs` member and applies to the entire document. When no root `crs` is present, WGS84 is assumed.

* A **named** CRS is supported when its projection is registered. EPSG URN names are normalized before lookup. An unregistered name is rejected with `UNSUPPORTED_CRS`.
* A CRS using the **`link`** form is unsupported. A link CRS missing or with an empty `properties.href` is rejected with `INVALID_CRS_LINK`; an otherwise well-formed link CRS is rejected with `UNSUPPORTED_LINK_CRS`.
* A `crs` member declared **below the root** object is rejected with `UNSUPPORTED_NESTED_CRS`, without inspecting its content.
* External CRS resources are never fetched.

Validation adapts to the resolved CRS: CRS-independent checks always apply, while geodesic checks apply only when the root CRS is equivalent to WGS84.

## Validation rules

### CRS-independent checks

Applied for every supported CRS:

* coordinate tuple structure;
* finite numeric coordinate values;
* altitude validity;
* minimum coordinate counts;
* geometry structure;
* ring closure;
* duplicate consecutive positions;
* bounding-box structure and coordinate ordering.

### Geodesic checks

Enabled only when the root CRS is equivalent to WGS84:

* longitude range `[-180, 180]`;
* latitude range `[-90, 90]`;
* excessive longitude/latitude precision;
* antimeridian crossings;
* polygon winding order;
* ring self-intersections;
* hole/shell intersections.

These checks rely on geographic or n-vector calculations and are skipped for projected CRS.

### Bounding-box axis order

The first-axis (longitude/easting) order is checked differently depending on the CRS, which is why only one of the two order codes is CRS-dependent:

* On a **projected** CRS, a first-axis minimum greater than the maximum is an error (`INVALID_BBOX_LONGITUDE_ORDER`).
* On **WGS84**, `west > east` is *legal* — it denotes a box crossing the antimeridian — so it is not an error but a warning (`BBOX_ANTIMERIDIAN_CROSSING`).

The second-axis (latitude/northing) order is always an error when reversed (`INVALID_BBOX_LATITUDE_ORDER`), regardless of CRS.

## Errors

`INVALID_GEOMETRY_TYPE` refers to an unknown **geometry** `type` (the `type` of a geometry object, e.g. inside a `Feature` or `GeometryCollection`), whereas `UNKNOWN_TYPE` refers to an unknown **top-level GeoJSON** `type` (neither a geometry, nor `Feature`, nor `FeatureCollection`).

| Code                                    | `params`               | Cause                                                                  |
| --------------------------------------- | ---------------------- | ---------------------------------------------------------------------- |
| `INVALID_POSITION_LENGTH`               | —                      | Position is not an array of 2 or 3 values                              |
| `INVALID_POSITION_COORDINATES`          | —                      | Horizontal coordinates are not finite numbers                          |
| `INVALID_LONGITUDE_RANGE`               | `{ value }`            | Longitude is outside `[-180, 180]` during geodesic validation          |
| `INVALID_LATITUDE_RANGE`                | `{ value }`            | Latitude is outside `[-90, 90]` during geodesic validation             |
| `INVALID_ALTITUDE`                      | —                      | Altitude is not a finite number                                        |
| `INVALID_BBOX_LENGTH`                   | —                      | Bounding box does not contain 4 or 6 values                            |
| `INVALID_BBOX_LONGITUDE_ORDER`          | `{ west, east }`       | First-axis minimum exceeds maximum for a projected CRS (on WGS84 this is a `BBOX_ANTIMERIDIAN_CROSSING` warning instead) |
| `INVALID_BBOX_LATITUDE_ORDER`           | `{ south, north }`     | Second-axis minimum exceeds maximum                                    |
| `INVALID_BBOX_ALTITUDE_ORDER`           | `{ minAlt, maxAlt }`   | Minimum altitude exceeds maximum altitude                              |
| `INVALID_CRS_OBJECT`                    | —                      | `crs` is not a plain object                                            |
| `INVALID_CRS_TYPE`                      | `{ type }`             | CRS type is neither `name` nor `link`                                  |
| `INVALID_CRS_NAME`                      | —                      | Missing or empty `properties.name`                                     |
| `INVALID_CRS_LINK`                      | —                      | Missing or empty `properties.href` on a `link` CRS                     |
| `UNSUPPORTED_CRS`                       | `{ name }`             | Named CRS does not resolve to a registered projection                  |
| `UNSUPPORTED_LINK_CRS`                  | —                      | CRS is declared using the unsupported `link` form                      |
| `UNSUPPORTED_NESTED_CRS`                | —                      | A CRS is declared below the root GeoJSON object                        |
| `INVALID_GEOMETRY`                      | —                      | Geometry is not a non-empty object                                     |
| `INVALID_GEOMETRY_TYPE`                 | `{ type }`             | Unknown **geometry** type                                              |
| `INVALID_COORDINATES_LENGTH`            | `{ minimumLength }`    | Coordinates array is shorter than required                             |
| `INVALID_MULTI_LINESTRING_COORDINATES`  | —                      | `MultiLineString.coordinates` is empty or invalid                      |
| `INVALID_POLYGON_COORDINATES`           | —                      | `Polygon.coordinates` is empty or invalid                              |
| `INVALID_MULTIPOLYGON_COORDINATES`      | —                      | `MultiPolygon.coordinates` is empty or invalid                         |
| `INVALID_GEOMETRYCOLLECTION_GEOMETRIES` | —                      | `GeometryCollection.geometries` is empty or invalid                    |
| `RING_NOT_CLOSED`                       | —                      | LinearRing is not closed                                               |
| `INVALID_WINDING_ORDER`                 | `{ expected, actual }` | Polygon ring winding order is incorrect during geodesic validation     |
| `SELF_INTERSECTION`                     | `{ count }`            | Polygon ring self-intersects during geodesic validation                |
| `HOLE_INTERSECTS_SHELL`                 | —                      | A polygon hole intersects its exterior ring during geodesic validation |
| `UNKNOWN_TYPE`                          | `{ type }`             | Unknown **top-level GeoJSON** type                                     |
| `INVALID_FEATURES_ARRAY`                | —                      | `FeatureCollection.features` is not an array                           |
| `EMPTY_OBJECT`                          | —                      | A `Feature`/`FeatureCollection` object (including a member of a `features` array) is empty or not an object |

These three related codes split by the object being checked:

* `EMPTY_OBJECT` (error) — a `Feature` or `FeatureCollection` wrapper that is empty or not an object, including a member of a `features` array.
* `MISSING_GEOMETRY` (warning) — a well-formed `Feature` whose `geometry` is absent, `null`, or not a non-empty object (an empty `{}` included). The feature is otherwise valid; its geometry is simply not validated.
* `INVALID_GEOMETRY` (error) — a value in a geometry position that is not a non-empty object, i.e. a member of a `GeometryCollection` or a top-level geometry. (A `Feature`'s empty geometry never reaches this code; it is a `MISSING_GEOMETRY` warning instead.)

## Warnings

| Code                            | `params`             | Cause                                                                 |
| ------------------------------- | -------------------- | --------------------------------------------------------------------- |
| `EXCESSIVE_LONGITUDE_PRECISION` | `{ precision, max }` | Longitude exceeds the configured precision during geodesic validation |
| `EXCESSIVE_LATITUDE_PRECISION`  | `{ precision, max }` | Latitude exceeds the configured precision during geodesic validation  |
| `BBOX_ANTIMERIDIAN_CROSSING`    | `{ west, east }`     | WGS84 bounding box crosses the antimeridian (`west > east`)           |
| `ANTIMERIDIAN_CROSSING`         | —                    | WGS84 segment crosses the antimeridian                                |
| `DUPLICATE_POSITION`            | —                    | Consecutive positions are equal at the configured precision           |
| `MISSING_GEOMETRY`              | —                    | A `Feature`'s geometry is absent, `null`, or not a non-empty object    |

## Localized messages

Validation results intentionally contain stable codes instead of localized messages.

Applications can translate these codes using the localization module:

```js
import {
  getActiveLocales,
  getMessages
} from '@kalisio/common-geospatial'

function getValidationMessage (code) {
  for (const locale of getActiveLocales()) {
    const message = getMessages(locale).VALIDATION[code]
    if (message) return message
  }
  return code
}
```

`VALIDATION_CODES` is generated from the validation keys defined in the built-in English locale and therefore stays synchronized with the localization catalog.

## Examples

A valid WGS84 `Feature`:

```js
validateGeoJson({
  type: 'Feature',
  geometry: {
    type: 'Point',
    coordinates: [2.3522, 48.8566]
  },
  properties: {}
})
// { valid: true, errors: [], warnings: [], statistics: { /* ... */ } }
```

A valid projected geometry (CRS must be registered):

```js
validateGeoJson({
  type: 'Point',
  coordinates: [700000, 6600000],
  crs: {
    type: 'name',
    properties: { name: 'EPSG:2154' }
  }
})
// valid when EPSG:2154 is registered
```

An empty `FeatureCollection` is valid:

```js
validateGeoJson({
  type: 'FeatureCollection',
  features: []
})
// { valid: true, errors: [], warnings: [], statistics: { /* ... */ } }
```

An invalid geometry reports a code and a path:

```js
validateGeoJson({
  type: 'Point',
  coordinates: [2.3522]
})
// {
//   valid: false,
//   errors: [{ code: 'INVALID_POSITION_LENGTH', path: '/coordinates' }],
//   warnings: [],
//   statistics: { /* ... */ }
// }
```

A nested CRS is rejected without inspecting its content:

```js
validateGeoJson({
  type: 'FeatureCollection',
  features: [{
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [2.3522, 48.8566] },
    properties: {},
    crs: {
      type: 'name',
      properties: { name: 'EPSG:4326' }
    }
  }]
})
// errors include { code: 'UNSUPPORTED_NESTED_CRS', path: '/features/0/crs' }
```