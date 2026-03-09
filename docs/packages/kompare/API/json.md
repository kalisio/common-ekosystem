# json

## compare

### Signature

```js
compare(a, b, options)
```

### Description

Perform a deep comparison between two objects and return detailed differences.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| a | Object \| Array | yes | The source object |
| b | Object \| Array | yes | The target object |
| options | Object | no | Comparison options |

### Returns

| Type | Description |
|------|-------------|
| Object | An object containing isEqual (boolean) and differences (missing, extra, updated) |

### Examples

```js
const source = {
  id: 1,
  name: "Alice",
  tags: ["admin", "user"],
  profile: {
    age: 25,
    address: {
      city: "Paris",
      zip: "75000"
    }
  }
}

const target = {
  id: 1,
  name: "Alice",
  tags: ["admin", "editor"],
  profile: {
    age: 26,
    address: {
      city: "Paris",
      zip: "75000"
    }
  },
  active: true
}

json.compare(source, target)

/*
{
  isEqual: false,
  differences: {
    missing: [],
    extra: ["active"],
    updated: [
      { path: "tags[1]", oldValue: "user", newValue: "editor" },
      { path: "profile.age", oldValue: 25, newValue: 26 }
    ]
  }
}
*/
```

## isEqual

### Signature

```js
isEqual(object1, object2, options)
```

### Description

Compares two JSON objects after normalization. The comparison can ignore specific keys provided in the options.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| object1 | Object \| Array | yes | The first object to compare |
| object2 | Object \| Array | yes | The second object to compare |
| options | Object | no | Comparison options |
| options.ignoredKeys | string[] | no | Keys to ignore during comparison |

### Returns

| Type | Description |
|------|-------------|
| boolean | Returns true if the normalized objects are equal, otherwise false |

### Examples

- Ignore dynamic fields

```js
const user1 = {
  id: "abc123",
  createdAt: "2024-01-01",
  profile: {
    name: "Alice",
    roles: ["admin", "user"]
  }
}

const user2 = {
  id: "xyz999",
  createdAt: "2024-05-10",
  profile: {
    roles: ["admin", "user"],
    name: "Alice"
  }
}

json.isEqual(user1, user2, {
  ignoredKeys: ["id", "createdAt"]
})
// true
```

- Detect array difference

```js
json.isEqual(
  {
    items: [
      { id: 1, name: "Book" },
      { id: 2, name: "Pen" }
    ]
  },
  {
    items: [
      { id: 1, name: "Book" },
      { id: 2, name: "Pencil" }
    ]
  }
)
// false
```

## isEqualFile

### Signature

```js
isEqualFile(object, filePath, options)
```

### Description

Compare an object with the content of a JSON file.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| object | Object \| Array | yes | The object to compare |
| filePath | string | yes | The path to the JSON file |
| options | Object | no | Comparison options |

### Returns

| Type | Description |
|------|-------------|
| boolean | Returns true if the object matches the file content |

### Examples

`data.json`:

```json
{
  "users": [
    {
      "id": 1,
      "name": "Alice",
      "roles": ["admin", "user"]
    },
    {
      "id": 2,
      "name": "Bob",
      "roles": ["user"]
    }
  ]
}
```

```js
const data = {
  users: [
    {
      id: 1,
      roles: ["user", "admin"],
      name: "Alice"
    },
    {
      id: 2,
      name: "Bob",
      roles: ["user"]
    }
  ]
}

json.isEqualFile(data, "./data.json")
// true
```

## isEqualFiles

### Signature

```js
isEqualFiles(path1, path2, options)
```

### Description

Compare the content of two JSON files.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| path1 | string | yes | Path to the first file |
| path2 | string | yes | Path to the second file |
| options | Object | no | Comparison options |

### Returns

| Type | Description |
|------|-------------|
| boolean | Returns true if both files are structurally equal |

### Examples

`baseline.json`:

```json
{
  "settings": {
    "theme": "dark",
    "notifications": true
  },
  "features": ["search", "export"]
}
```

`current.json`:

```json
{
  "features": ["search", "export"],
  "settings": {
    "notifications": true,
    "theme": "dark"
  }
}
```

```js
json.isEqualFiles("./baseline.json", "./current.json")
// true
```

