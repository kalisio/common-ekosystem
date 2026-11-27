---
title: validate
description: Compile JSON Schema validators and return structured, localizable Ajv errors.
---

# validate

## Signature

```js
validate(schema, options = {})
```

## Description

Compiles a JSON Schema with Ajv and returns a reusable validator. Each call to `validate()` compiles the schema through the selected Ajv instance. Reuse the returned function to validate multiple values.

By default, the operator creates an Ajv instance with `allErrors: true` and registers the formats and keywords provided by `ajv-formats` and `ajv-keywords`. The operator requires `ajv`, `ajv-formats`, `ajv-keywords`, and `ajv-i18n`.

## Parameters

| Name | Type | Required | Description |
|---|---|---|---|
| `schema` | `object \| boolean` | yes | JSON Schema. The boolean schemas `true` and `false` accept or reject every value, respectively. |
| `options` | `object` | no | Validator configuration. |
| `options.ajv` | `object` | no | Preconfigured Ajv instance exposing `compile()`. Register any required formats and keywords on this instance before passing it in. |
| `options.ajvOptions` | `object` | no | Options for the default Ajv instance, which override its defaults. Ignored when `options.ajv` is supplied. |

Ajv options such as `coerceTypes` can mutate the input data in place.

## Returns

The returned function takes `data` and an optional `{ locale }` object.

```js
validator(data, { locale } = {})
```

A synchronous schema returns `{ valid, errors }` directly. A schema with `$async: true` returns a promise that resolves to the same result shape.

| Property | Type | Description |
|---|---|---|
| `valid` | `boolean` | Whether the value satisfies the schema. |
| `errors` | `Array<object>` | Structured Ajv errors, such as `instancePath`, `schemaPath`, `keyword`, `params`, and `message`. The array is empty on success. |

### Error localization

The validator uses the supplied `locale` or the current [application locale](../runtime/locales.md) when reporting a validation failure. It tries the exact locale code first, then its language subtag. For example, `fr-FR` falls back to `fr`. If no matching translation is available, the errors retain their original Ajv messages.

## Throws

Development assertions check the shape of `schema` and `options`. Ajv compilation errors propagate to the caller. Validation failures are reported in `errors`. Other exceptions from the underlying validator propagate, as rejected promises for asynchronous validators.

## Examples

```js
import { validate } from '@kalisio/common-core/operators/validate'

const schema = {
  type: 'object',
  required: ['email'],
  properties: {
    email: { type: 'string', format: 'email' }
  }
}

const validateContact = validate(schema)

validateContact({ email: 'ada@example.com' })
// { valid: true, errors: [] }

const result = validateContact({}, { locale: 'fr' })
result.valid // false
result.errors[0].message // 'requiert la propriété email'
```

```js
const validateContactAsync = validate({ ...schema, $async: true })
const result = await validateContactAsync({ email: 'ada@example.com' })
// { valid: true, errors: [] }
```
