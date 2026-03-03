# kompare

**kompare** is a lightweight utility for object and file comparison.

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
### Deep Object Comparison

Check if two objects are identical, even if the keys are in a different order.
```javascript

import { json } from '@kalisio/kompare'

const configA = { active: true, timeout: 3000 }
const configB = { timeout: 3000, active: true }

// Returns true
const isEqual = json.isEqual(configA, configB)
```
### Flexible Text Normalization

Compare strings while ignoring "noise" like case differences, accents, or extra spaces.
```javascript

import { text } from '@kalisio/kompare'

const input = "  Kalisio  "
const reference = "kalisio"

// Returns true by cleaning the input before comparison
const match = text.isEqual(input, reference, {
ignoreCase: true,
ignoreSpaces: true
})
```
### Finding Differences

Instead of a simple true/false, get a detailed report of exactly what changed.
```javascript

import { yaml } from '@kalisio/kompare'

const v1 = "version: 1.0"
const v2 = "version: 1.1"

const diff = yaml.compare(v1, v2)

if (!diff.isEqual) {
console.log('Changes:', diff.differences.updated)
}
```