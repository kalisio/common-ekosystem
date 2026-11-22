---
title: Locales
description: Runtime management of supported locales and localized resources.
---

# Locales

Manages supported locales, locale preferences, and localized resources contributed by multiple packages.

Each `Locales` instance maintains its own configuration and resource registries. Resources are organized by namespace and can be registered multiple times to support application-specific overrides.

Locale identifiers follow the BCP 47 standard and are normalized using `Intl.getCanonicalLocales()`.

## Locales

### Signature

```js
new Locales({ defaultLocale, fallbackLocale, eventBus } = {})
```

### Description

Creates an independent locale manager.

The default and fallback locales must be registered before resolving locales, changing the current locale, or retrieving resources.

No global instance is created automatically.

### Parameters

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `defaultLocale` | `string` | no | `'en'` | Initial locale |
| `fallbackLocale` | `string` | no | `'en'` | Locale used when no preference matches |
| `eventBus` | `object` | no | `undefined` | Optional event bus supporting `emit()` |

### Returns

| Type | Description |
|------|-------------|
| `Locales` | A new locale manager |

### Example

```js
import { Locales } from '@kalisio/common-core/runtime'

const locales = new Locales({
  defaultLocale: 'en',
  fallbackLocale: 'en'
})

locales.register('en', { label: 'English' })
locales.register('fr', { label: 'Français' })
```

## createLocales

### Signature

```js
createLocales(options)
```

### Description

Factory function equivalent to `new Locales(options)`.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `options` | `object` | no | Options passed to the `Locales` constructor |

### Returns

| Type | Description |
|------|-------------|
| `Locales` | A new locale manager |

### Example

```js
import { createLocales } from '@kalisio/common-core/runtime'

const locales = createLocales({
  defaultLocale: 'fr',
  fallbackLocale: 'en'
})
```

## register

### Signature

```js
locales.register(code, metadata = {})
```

### Description

Registers a supported locale and optional metadata.

Locale identifiers are normalized automatically. Registering the same normalized locale more than once throws an error.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `code` | `string` | yes | BCP 47 locale identifier |
| `metadata` | `object` | no | Additional locale metadata |

### Returns

| Type | Description |
|------|-------------|
| `object` | Registered metadata |

### Example

```js
locales.register('en', { label: 'English' })
locales.register('fr', { label: 'Français' })
locales.register('fr-ca', { label: 'Français (Canada)' })

locales.list()
// ['en', 'fr', 'fr-CA']
```

## list

### Signature

```js
locales.list()
```

### Description

Returns the registered locale identifiers in registration order.

### Returns

| Type | Description |
|------|-------------|
| `string[]` | Array of normalized locale identifiers |

### Example

```js
locales.list()
// ['en', 'fr', 'fr-CA']
```

## getCurrent

### Signature

```js
locales.getCurrent()
```

### Description

Returns the current locale.

Initially, the current locale is the configured `defaultLocale`.

### Returns

| Type | Description |
|------|-------------|
| `string` | Current normalized locale identifier |

### Example

```js
locales.getCurrent()
// 'en'
```

## setCurrent

### Signature

```js
locales.setCurrent(code)
```

### Description

Changes the current locale.

The locale must already be registered. If it differs from the current locale, a `locale:changed` event is emitted when an event bus is configured.

No event is emitted when the locale remains unchanged.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `code` | `string` | yes | Registered locale identifier |

### Returns

| Type | Description |
|------|-------------|
| `undefined` | No return value |

### Example

```js
locales.setCurrent('fr')
locales.getCurrent()
// 'fr'

// An unregistered locale is rejected
locales.setCurrent('de')
// RangeError: Unknown locale: de
```

### Events

| Event | Data | Description |
|-------|------|-------------|
| `locale:changed` | `{ locale, previous }` | Emitted when the current locale changes |

```js
import { createEventBus, createLocales } from '@kalisio/common-core/runtime'

const eventBus = createEventBus()
const locales = createLocales({ eventBus })

locales.register('en')
locales.register('fr')

eventBus.on('locale:changed', event => {
  console.log(event.data)
})

locales.setCurrent('fr')
// { locale: 'fr', previous: 'en' }
```

## resolve

### Signature

```js
locales.resolve(...codes)
```

### Description

Resolves the best supported locale from an ordered list of preferences.

Each preference is normalized and progressively reduced from its most specific form to its parent language.

Invalid preferences are ignored. When no preference matches, the configured fallback locale is returned.

When called without arguments, the current locale is used.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `...codes` | `string[]` | no | Locale preferences in priority order |

### Returns

| Type | Description |
|------|-------------|
| `string` | Best matching registered locale, or fallback locale |

### Examples

```js
// Supported locales: en, fr

locales.resolve('fr-CA')
// 'fr'

locales.resolve('de', 'fr-FR')
// 'fr'

locales.resolve('de', 'it')
// 'en'

locales.resolve('*', 'invalid_locale', 'fr')
// 'fr'
```

Resolve browser preferences:

```js
const preferred = locales.resolve(...navigator.languages)
locales.setCurrent(preferred)
```

A parent match for an earlier preference takes priority over an exact match for a later preference.

HTTP `Accept-Language` headers must be parsed into an ordered list before being passed to `resolve()`.

## registerResources

### Signature

```js
locales.registerResources(namespace, resources)
```

### Description

Registers localized resources under a namespace.

Multiple contributions can be registered under the same namespace. Existing contributions are preserved, allowing applications to provide overrides.

Resources can contain arbitrary defined values, including translation dictionaries or resource loader functions.

Locale identifiers are normalized automatically. Duplicate identifiers within a single contribution are rejected.

Resources can be registered before their locales are declared.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `namespace` | `string` | yes | Resource namespace |
| `resources` | `object` | yes | Map of locale identifiers to resources |

### Returns

| Type | Description |
|------|-------------|
| `undefined` | No return value |

### Example

```js
locales.registerResources('common-geospatial', {
  en: { north: 'North', south: 'South' },
  fr: { north: 'Nord', south: 'Sud' }
})

// Additional contribution from the application
locales.registerResources('common-geospatial', {
  fr: { north: 'Nord géographique' }
})
```

Resources are not automatically merged or loaded. Consumers are responsible for interpreting and combining the registered contributions.

## getResources

### Signature

```js
locales.getResources(namespace, code = currentLocale)
```

### Description

Returns the localized resource contributions for a namespace.

Resources are returned in the following priority order:

1. Exact requested locale.
2. Progressively less specific parent locales.
3. Configured fallback locale.

For each locale, the most recently registered contributions are returned first.

The requested locale does not need to be registered as a supported application locale.

No resource merging or asynchronous loading is performed.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `namespace` | `string` | yes | Resource namespace |
| `code` | `string` | no | Requested locale; defaults to current locale |

### Returns

| Type | Description |
|------|-------------|
| `Array<{ locale, resource }>` | Ordered resource contributions; empty if none are available |

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

The consumer can select the first matching contribution or merge compatible resources according to its own rules.

## Example: package contributions

Packages can expose explicit registration functions accepting a `Locales` instance.

```js
// common-geospatial
export function registerGeospatialLocales (locales) {
  locales.registerResources('common-geospatial', {
    en: enMessages,
    fr: frMessages
  })
}
```

The application registers its supported locales and installs the resources it needs.

```js
import { createLocales } from '@kalisio/common-core/runtime'
import { registerGeospatialLocales } from '@kalisio/common-geospatial'

const locales = createLocales({
  defaultLocale: 'en',
  fallbackLocale: 'en'
})

locales.register('en')
locales.register('fr')

registerGeospatialLocales(locales)

locales.setCurrent(locales.resolve('fr-CA'))
```

The same `Locales` instance can be shared across packages without requiring a global singleton.