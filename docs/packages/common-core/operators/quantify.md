---
title: quantify
description: Creates a unit-aware quantity object from a numeric value and a unit code, with conversion and formatting capabilities.
---

# quantify

## Signature

```js
quantify (value, unitCode, unitSystem)
```

## Description

Creates a quantity object that wraps a numeric `value` with its associated `unitCode` resolved against a `unitSystem`. The returned object exposes a `.to()` method for unit conversion and a `.toString()` method for formatted output.

Unit codes support SI prefixes (e.g. `kW`, `MHz`, `mm`), IEC binary prefixes (e.g. `KiB`, `GiB`), squared and cubic metric prefixes, and any custom prefix group defined in the unit system. Prefix resolution is automatic: if `kW` is not an explicit entry in the unit system but `W` is, the `k` prefix is applied to resolve it.

## Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `value` | `number` | yes | The numeric value of the quantity |
| `unitCode` | `string` | yes | The unit code to resolve (e.g. `'kW'`, `'MHz'`, `'m'`) |
| `unitSystem` | `Map` | yes | A non-empty map of unit definitions to resolve `unitCode` against |

## Returns

| Type | Description |
|------|-------------|
| `object` | A quantity object with `value`, `unit`, `.to()` and `.toString()` |
| `result.value` | `number` — the original numeric value |
| `result.unit` | `object` — the resolved unit descriptor (symbol, factor, type, scientific, …) |
| `result.to(dstUnitCode)` | `function` — converts the quantity to another unit (see below) |
| `result.toString(decimals?)` | `function` — formats the quantity as a string (see below) |

### `result.to(dstUnitCode)`

Converts the quantity to the unit identified by `dstUnitCode`. Both units must belong to the same type (e.g. both `power`, both `length`). Returns a new quantity object.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `dstUnitCode` | `string` | yes | The target unit code |

Throws a `TypeError` if `dstUnitCode` is not a non-empty string, if the unit is unknown, or if the source and destination unit types are incompatible.

### `result.toString(decimals?)`

Formats the quantity as a human-readable string. Uses scientific notation (`math.exponential`) for scientific units and fixed-point notation (`math.round`) for others.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `decimals` | `number` | no | Number of decimal places (default: `2`) |

## Throws

Throws a `TypeError` if:
- `value` is not a number
- `unitCode` is not a non-empty string
- `unitSystem` is not a non-empty map
- `unitCode` cannot be resolved against `unitSystem`

## Examples

```js
// Basic quantity
const q = quantify(1500, 'W', powerUnits)
q.value  // 1500
q.unit   // { symbol: 'W', factor: 1, type: 'power', … }
```

```js
// Prefixed unit — 'kW' resolved automatically from 'W' + 'k' prefix
const q = quantify(1.5, 'kW', powerUnits)
q.toString()  // '1.50 kW'
```

```js
// Unit conversion
quantify(1500, 'W', powerUnits).to('kW').toString()  // '1.50 kW'
quantify(1, 'kW', powerUnits).to('W').toString()     // '1000.00 W'
```

```js
// Custom decimal precision
quantify(1234567, 'W', powerUnits).toString(0)  // '1234567 W'
quantify(1.5, 'kW', powerUnits).toString(4)     // '1.5000 kW'
```

```js
// Incompatible unit types — throws
quantify(1, 'kW', mixedUnits).to('km')
// TypeError: Incompatible unit types: "power" → "length"
```

```js
// Unknown unit — throws
quantify(1, 'XYZ', powerUnits)
// TypeError: Unknown unit: XYZ
```