---
title: setup
description: Configure the shared authorization instance for an application.
---

# setup

Configures the shared authorization instance used by `common-authorization`.
The application owns the creation and configuration of this instance.

## Signature

```js
setup(options = {})
```

## Parameters

| Option | Type | Required | Description |
|---|---|---|---|
| `authorization` | `Authorization` | no | Authorization instance to install as the shared authorization. |

`setup()` installs the authorization instance when provided.
Omitting `authorization` or passing `undefined` leaves the current instance unchanged.

## Returns

| Type | Description |
|---|---|
| `undefined` | No return value. |

## Example

```js
import { Authorization, getGlobalAuthorization } from '@kalisio/common-authorization'
import { setup } from '@kalisio/common-authorization/setup'

const authorization = new Authorization({
  aliases: {
    read: ['get', 'find'],
    update: ['patch']
  }
})

setup({ authorization })

getGlobalAuthorization() === authorization // true
```

## Shared authorization

| Service | Access | Behavior |
|---|---|---|
| Authorization | `getGlobalAuthorization()` | Returns the installed authorization instance. Throws an error if no instance has been configured. |

See [global-authorization](./runtime/global-authorization.md).