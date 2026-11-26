---
title: predicates (internal)
description: Checks shared by the package, active in production.
---

# predicates

Checks shared by [Authorization](../runtime/authorization.md) and [abilities](./abilities.md). Unlike assertions, they remain active in production, as their violation would make an authorization decision unreliable.

The module is internal to the package: it is not exported.

## ensureSynchronous

### Signature

```js
ensureSynchronous(value, message)
```

### Description

Ensures that the value returned by a function supplied to the package is not a promise. Rules must all be defined before the ability is built: an asynchronous function would complete afterwards, silently leaving the ability incomplete or unscoped.

Any value with a `then` method is treated as a promise, including the result of an `async` function.

The function has already run when its result is checked. When the result is a promise, a handler is attached to it before the error is thrown, so that its rejection is not left unhandled. The rejection itself is discarded: the `TypeError` is the only error reported.

The package checks the values returned by:

| Function | Message |
|----------|---------|
| Authorization hooks | `hook <name> must be synchronous` |
| Role definitions supplied to [defineRoleAbilities](./abilities.md#defineroleabilities) | `definition of role <role> must be synchronous` |
| Scope functions supplied to [defineRoleAbilities](./abilities.md#defineroleabilities) | `scope must be synchronous` |

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `value` | `any` | yes | Value returned by the function |
| `message` | `string` | yes | Error message when the value is a promise |

### Returns

| Type | Description |
|------|-------------|
| `any` | The value, when it is not a promise |

### Throws

Throws a `TypeError` with the given message if the value is a promise, in production too.

### Examples

```js
const conditions = ensureSynchronous(scope(rule), 'scope must be synchronous')
```