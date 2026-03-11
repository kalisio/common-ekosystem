# kompare

**kompare** is a lightweight utility for object and file comparison.

**kompare** is built around four format-specific modules ([text](API/text.md), [json](API/json.md), [yaml](API/yaml.md), [xml](API/xml.md)) and a [comparator](API/comparator.md) factory for creating custom format comparators.

## Installation

Install with your preferred package manager:

```shell
pnpm add @kalisio/kompare
```

```shell
npm install @kalisio/kompare
```

```shell
yarn add @kalisio/kompare
```

## Examples

### Deep object comparison

Check if two objects are identical, even if the keys are in a different order:

```js
import { json } from '@kalisio/kompare'

const obj1 = {
  id: 'A-1',
  details: { version: 1.5, status: 'stable', tags: ['prod', 'web', 'api'] },
  metrics: [{ type: 'cpu', value: 45 }, { type: 'ram', value: 80 }],
  updatedAt: '2026-01-01'
}

 const obj2 = {
  details: { status: 'stable', tags: ['api', 'prod', 'web'], version: 1.5 },
  metrics: [{ value: 80, type: 'ram' }, { value: 45, type: 'cpu' }],
  id: 'B-2',
  updatedAt: '2026-02-18'
}

// Returns true
const isEqual = json.isEqual(obj1, obj2, { ignoredKeys: ['id', 'updatedAt'] })
```

### Flexible text comparison

Compare strings while ignoring "noise" like case differences, accents, or extra spaces:

```js
import { text } from '@kalisio/kompare'

const input = "  Kalisio  "
const reference = "kalisio"

// Returns true by cleaning the input before comparison
const match = text.isEqual(input, reference, {
  ignoreCase: true,
  ignoreSpaces: true
})
```

### Finding differences

Instead of a simple true/false, get a detailed report of exactly what changed:

```js
import { yaml } from '@kalisio/kompare'

const v1 = "version: 1.0"
const v2 = "version: 1.1"

const result = yaml.compare(v1, v2)

if (!result.isEqual) {
  console.log('Changes:', result.differences)
}
```