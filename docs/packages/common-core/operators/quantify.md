---
title: quantify
description: Create unit-aware quantities with conversion and formatting support.
---

# quantify

## Signature

```js
quantify(value, unitCode, unitSystem)
```

## Description

Creates a quantity object from a numeric `value` and a unit identified by `unitCode` in a `unitSystem`. The returned object exposes the resolved unit descriptor and provides methods to convert the value to a compatible unit and format it as a string.

The unit system is a non-empty `Map` whose keys are unit codes and whose values are unit descriptors. A descriptor typically defines:

| Property | Type | Description |
|---|---|---|
| `factor` | `number` | Conversion factor relative to the base unit of its type |
| `type` | `string` | Unit family used to check conversion compatibility |
| `symbol` | `string` | Symbol used when formatting the quantity |
| `prefixes` | `string` | Optional name of a built-in prefix group |

If a unit code is not explicitly defined, `quantify` tries to resolve it from a defined base unit and one of that unit's permitted prefixes. For example, `kW` is resolved from a `W` definition with `prefixes: 'SHORT'`.

The available prefix groups are built into the operator: `NONE`, `SHORT`, `LONG`, `SQUARED`, `CUBIC`, `BINARY_SHORT_SI`, `BINARY_SHORT_IEC`, `BINARY_LONG_SI`, `BINARY_LONG_IEC`, and `BTU`. A unit system may select these groups but cannot define new prefix groups through the public API.

## Parameters

| Name | Type | Required | Description |
|---|---|---|---|
| `value` | `number` | yes | Numeric value of the quantity |
| `unitCode` | `string` | yes | Non-empty unit code to resolve (for example, `'W'` or `'kW'`) |
| `unitSystem` | `Map` | yes | Non-empty map of unit descriptors |

## Returns

Returns an object with the following members:

| Member | Type / signature | Description |
|---|---|---|
| `value` | `number` | Numeric value in the current unit |
| `unit` | `object` | Resolved unit descriptor, including `factor`, `type`, `symbol` and `scientific` |
| `to` | `to(dstUnitCode)` | Converts to another compatible unit and returns a new quantity object |
| `toString` | `toString(decimals = 2)` | Formats the value using the unit's symbol |

### `to(dstUnitCode)`

Converts the quantity to the unit identified by `dstUnitCode`. Both units must have the same `type`. The conversion uses the ratio of their `factor` values. The original quantity remains unchanged.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `dstUnitCode` | `string` | yes | Non-empty destination unit code |

### `toString(decimals = 2)`

Formats the quantity with a space between the formatted value and the unit symbol (or the original unit code when no symbol is defined).

The `scientific` flag of the resolved unit determines the formatting mode:

- When `scientific` is `true`, formatting uses `math.exponential()` (for example, `'1.50e+0 kW'`).
- Otherwise, formatting uses `math.round()` (for example, `'1.23 hm'`). This mode does not pad trailing decimal zeros.

The flag is determined during unit resolution: directly defined units use scientific formatting, while resolved prefixed units use their prefix's setting. In particular, metric prefixes such as `k` use scientific formatting, while `h` and `da` use regular rounding.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `decimals` | `number` | no | Non-negative integer specifying the decimal precision (default: `2`) |

## Throws

In non-production environments, argument and unit validation uses `assert` and raises an `AssertionError` when:

- `value` is not a number;
- `unitCode` or `dstUnitCode` is not a non-empty string;
- `unitSystem` is not a non-empty `Map`;
- a source or destination unit cannot be resolved;
- the source and destination units have incompatible `type` values;
- `decimals` is not a non-negative integer.

These assertions are disabled when `NODE_ENV` is `production`; invalid inputs should not be assumed to produce the same errors in production.

## Examples

```js
import { quantify } from '@kalisio/common-core/operators/quantify'

// Define the supported base units and their prefix groups.
const powerUnits = new Map([
  ['W', { factor: 1, type: 'power', symbol: 'W', prefixes: 'SHORT' }]
])

const mixedUnits = new Map([
  ...powerUnits,
  ['m', { factor: 1, type: 'length', symbol: 'm', prefixes: 'SHORT' }]
])

// Basic quantity
const q = quantify(1500, 'W', powerUnits)
q.value          // 1500
q.unit.symbol    // 'W'
q.unit.factor    // 1
q.toString()     // '1.50e+3 W'

// Prefix resolution and conversion
quantify(1.5, 'kW', powerUnits).toString()
// '1.50e+0 kW'

quantify(1500, 'W', powerUnits).to('kW').toString()
// '1.50e+0 kW'

quantify(1, 'kW', powerUnits).to('W').toString()
// '1.00e+3 W'

// Custom precision
quantify(1234567, 'W', powerUnits).toString(0)
// '1e+6 W'

quantify(1.5, 'kW', powerUnits).toString(4)
// '1.5000e+0 kW'

// A non-scientific prefix
quantify(1.23456, 'hm', mixedUnits).toString()
// '1.23 hm'

// Conversion between incompatible types (AssertionError outside production)
quantify(1, 'kW', mixedUnits).to('km')
// AssertionError: Incompatible unit types: "power" → "length"

// Unknown unit (AssertionError outside production)
quantify(1, 'XYZ', powerUnits)
// AssertionError: Unknown unit: XYZ
```
