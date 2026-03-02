# conforms

## schema

### Signature

```javascript
schema(obj, schema)
```

### Description

Check if an object matches a schema.  
The schema is an object where keys are property names and values are either:

- a validator function (like `is.string`, `is.number`, etc.)  
- a nested schema object for sub-objects  

Returns `true` if the object matches the schema, otherwise `false`.

### Parameters

| Name   | Type   | Required | Description |
|--------|--------|----------|-------------|
| obj    | object | yes      | The object to validate |
| schema | object | yes      | The schema describing expected keys and their validators |

### Returns

| Type    | Description |
|---------|-------------|
| boolean | True if object conforms to the schema, false otherwise |

### Examples

```javascript
const obj = {
  name: 'Alice',
  age: 25,
  address: { city: 'Paris', zip: '75001' }
}

const schema = {
  name: is.string,
  age: is.number,
  address: {
    city: is.string,
    zip: is.string
  }
}

conforms.schema(obj, schema) // true

conforms.schema({ name: 'Bob', age: '25' }, schema) // false
```