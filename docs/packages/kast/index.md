---
title: kast
description: A JSON transformation utility
---

# kast

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

### Basic field mapping

```js
transform(
  { name: "John" },
  {
    mapping: {
      name: "firstName"
    }
  }
)
```

### Pick fields
```js
transform(
  { name: "John", age: 30 },
  {
    pick: ["name"]
  }
)
```

### Omit fields

```js
transform(
  { name: "John", password: "123" },
  {
    omit: ["password"]
  }
)
```

### Filter array

```js
transform(
  [
    { age: 20 },
    { age: 30 }
  ],
  {
    filter: { age: { $gt: 25 } }
  }
)
```

### Type conversion

```js
transform(
  { value: "42" },
  {
    unitMapping: {
      value: { asNumber: true }
    }
  }
)
```

### Rename and value mapping

```js
transform(
  { status: "A" },
  {
    mapping: {
      status: {
        path: "state",
        values: {
          A: "active"
        }
      }
    }
  }
)
```

### Merge data

```js
transform(
  { name: "John" },
  {
    merge: {
      source: "api"
    }
  }
)
```

### Convert to array

```js
transform(
  { a: 1, b: 2 },
  {
    toArray: true
  }
)
```




