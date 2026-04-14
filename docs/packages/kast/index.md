---
title: kast
description: A JSON transformation utility
---

# kast

**kast** is a lightweight JSON transformation library that offers a set of utilities to filter, reshape, and manipulate JSON objects and arrays.

## Installation

Install with your preferred package manager:

```shell
pnpm add @kalisio/check
```

```shell
npm install @kalisio/check
```

```shell
yarn add @kalisio/check
```

## Examples

### transform

> [!NOTE]
> `transform` is a small data transformation pipeline that:
> 1. Converts data structures
> 2. Filters data
> 3. Applies field mappings
> 4. Converts values (units, types, dates)
> 5. Modifies object structure (pick / omit / merge)

- Rename Fields (Simple Mapping)

```js
const data = { first_name: 'John', age: 30 }

const options = {
  mapping: {
    first_name: 'name'
  }
}

// Result
{ name: 'John', age: 30 }
```

- Filter Data

```js
const data = [
  { name: 'John', age: 17 },
  { name: 'Jane', age: 25 }
]

const options = {
  filter: { age: { $gte: 18 } }
}

// Result
[
  { name: 'Jane', age: 25 }
]
```

- Convert String to Number

```js
const data = { age: '42' }

const options = {
  unitMapping: {
    age: { asNumber: true }
  }
}

// Result
{ age: 42 }
```

- Format Dates

```js
const data = { date: '2024-01-01' }

const options = {
  unitMapping: {
    date: {
      asDate: true,
      to: 'DD/MM/YYYY'
    }
  }
}

// Result
{ date: '01/01/2024' }
```

- Map Values and rename field

```js
const data = { status: 1 }

const options = {
  mapping: {
    status: {
      path: 'statusLabel',
      values: {
        1: 'active',
        0: 'inactive'
      }
    }
  }
}

// Result
{ statusLabel: 'active' }
```

- Remove or keep fields

```js
const data = {
  name: 'John',
  age: 30,
  password: 'secret'
}

const options = {
  omit: ['password']
}

// Result
{ name: 'John', age: 30 }
```

```js
const options = {
  pick: ['name']
}

// Result
{ name: 'John' }
```

- Merge additional data

```js
const data = { name: 'John' }

const options = {
  merge: { country: 'FR' }
}

// Result
{ name: 'John', country: 'FR' }
```

- Convert array of arrays to objects

```js
const data = [
  ['John', 30],
  ['Jane', 25]
]

const options = {
  toObjects: ['name', 'age']
}

// Result
[
  { name: 'John', age: 30 },
  { name: 'Jane', age: 25 }
]
```

- Full example

```js
const data = [
  { first_name: 'John', age: '20', status: 1 },
  { first_name: 'Jane', age: '17', status: 0 }
]

const options = {
  filter: { age: { $gte: 18 } },
  mapping: {
    first_name: 'name',
    status: {
      path: 'statusLabel',
      values: { 1: 'active', 0: 'inactive' }
    }
  },
  unitMapping: {
    age: { asNumber: true }
  },
  pick: ['name', 'age', 'statusLabel']
}

// Result
[
  { name: 'John', age: 20, statusLabel: 'active' }
]
```

