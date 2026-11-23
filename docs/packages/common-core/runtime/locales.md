---
title: Locales
description: Shared runtime management of supported locales and localized resources.
---

# Locales

`Locales` manages supported locale codes, the current locale, locale resolution, and localized resource contributions. Locale codes are normalized with `Intl.getCanonicalLocales()` (BCP 47).

The application creates and installs one shared instance. Packages contribute resources to that instance by namespace; `Locales` does not merge or load those resources itself.

## Constructor

### Signature

```js
new Locales({ default: 'en', fallback: 'en' } = {})
```

### Parameters

| Option | Type | Required | Default | Description |
|---|---|---|---|---|
| `default` | `string` | no | `'en'` | Initially selected locale. |
| `fallback` | `string` | no | `'en'` | Fallback locale used in resolution and resource lookup. |

The default and fallback locales are automatically registered when the instance is created. Do not register them again.

### Example

```js
import { Locales } from '@kalisio/common-core/runtime'

const locales = new Locales({ default: 'en', fallback: 'en' })
locales.register('fr', { label: 'Français' })

locales.list() // ['en', 'fr']
```

## Locale management

### register

```js
locales.register(code, metadata = {})
```

Registers a supported locale and optional plain-object metadata. Throws when the normalized locale is already registered. Returns the metadata.

### list

```js
locales.list()
```

Returns the registered locale codes in insertion order (`string[]`).

### getCurrent

```js
locales.getCurrent()
```

Returns the current normalized locale code.

### setCurrent

```js
locales.setCurrent(code)
```

Selects a previously registered locale. Throws `RangeError` for an unknown locale. Does nothing if the locale is already current.

If the shared event bus has been configured, a successful change emits `locale:changed` with data `{ locale, previous }`. Listeners receive the standard event envelope `{ type, timestamp, data }`.

### resolve

```js
locales.resolve(...codes)
```

Resolves the first supported locale from the requested preferences, trying progressively less specific language tags before the configured fallback. Invalid preferences are skipped. Without arguments, starts with the current locale.

### Example

```js
const locales = new Locales({ default: 'en', fallback: 'en' })
locales.register('fr', { label: 'Français' })

locales.resolve('fr-CA') // 'fr'
locales.resolve('de', 'fr-FR') // 'fr'
locales.resolve('de') // 'en'

locales.setCurrent('fr')
locales.getCurrent() // 'fr'
```

## Resource contributions

### registerResources

```js
locales.registerResources(namespace, resources)
```

Registers a contribution under a non-empty namespace. `resources` must be a plain object whose keys are BCP 47 locale identifiers and whose values are defined resources. A namespace can receive multiple contributions, including application overrides. The corresponding locale does not need to be registered as a selectable locale.

### getResources

```js
locales.getResources(namespace, code = locales.getCurrent())
```

Returns an array of `{ locale, resource }` contributions, ordered first by locale specificity (requested locale, parent tags, fallback), then by contribution recency (newest first). No merging or loading is performed.

### Example

```js
locales.registerResources('messages', {
  en: { greeting: 'Hello' },
  fr: { greeting: 'Bonjour' },
  'fr-CA': { greeting: 'Allô' }
})
locales.registerResources('messages', {
  fr: { greeting: 'Salut' }
})

locales.getResources('messages', 'fr-CA')
// [
//   { locale: 'fr-CA', resource: { greeting: 'Allô' } },
//   { locale: 'fr', resource: { greeting: 'Salut' } },
//   { locale: 'fr', resource: { greeting: 'Bonjour' } },
//   { locale: 'en', resource: { greeting: 'Hello' } }
// ]
```

## Shared instance

### setLocales

```js
setLocales(locales)
```

Installs a `Locales` instance. An invalid argument raises an assertion error.

### getLocales

```js
getLocales()
```

Returns the installed instance. Throws an assertion error if no instance has been installed.

### Example: application initialization

```js
import { setup } from '@kalisio/common-core/setup'
import { EventBus, Locales, getLocales } from '@kalisio/common-core/runtime'

const bus = new EventBus()
const locales = new Locales({ default: 'en', fallback: 'en' })
locales.register('fr', { label: 'Français' })

bus.on('locale:changed', ({ data }) => {
  console.log(data.locale, data.previous)
})

setup({ bus, locales })
getLocales().setCurrent('fr')
```

The runtime bus is shared rather than passed to the `Locales` constructor. See [event-bus](./event-bus.md) and [setup](../setup.md).
