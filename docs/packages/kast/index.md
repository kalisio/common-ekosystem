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

### transform

- Convert to array

```js
transform(
  { a: 1, b: 2 },
  {
    toArray: true
  }
)
```

- Filter array

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

- Apply mapping

```js
transform(
  { name: "John" },
  {
    mapping: {
      name: "firstName"
    }
  }
)

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

- Apply unit mapping

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

- Apply modifiers

```js
// pick
transform(
  { name: "John", age: 30, password: "123" },
  {
    omit: ["name"]
  }
)

// omit
transform(
  { name: "John", password: "123" },
  {
    omit: ["password"]
  }
)

// merge
transform(
  { name: "John" },
  {
    merge: {
      source: "api"
    }
  }
)
```









