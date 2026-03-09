# yaml

## compare

### Signature

```js
compare(a, b, options)
```

### Description

Perform a deep comparison between two YAML strings and return detailed differences.
The YAML is parsed into objects to identify missing, extra, or updated properties.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| a | string | yes | The source YAML string |
| b | string | yes | The target YAML string |
| options | Object | no | Normalization options |

### Returns

| Type | Description |
|------|-------------|
| Object | An object containing `isEqual` (boolean) and `differences` (missing, extra, updated) |

### Examples

```js
const yamlA = `
version: 1
service:
  name: api
  port: 3000
database:
  host: localhost
  port: 5432
features:
  - login
  - search
`

const yamlB = `
version: 2
service:
  name: api
  port: 3000
database:
  host: db.internal
  port: 5432
features:
  - login
  - search
  - export
`

yaml.compare(yamlA, yamlB)
/*
{
  isEqual: false,
  differences: {
    missing: [],
    extra: ["features[2]"],
    updated: [
      { path: "version", oldValue: 1, newValue: 2 },
      { path: "database.host", oldValue: "localhost", newValue: "db.internal" }
    ]
  }
}
*/
```

## isEqual

### Signature

```js
isEqual(yaml1, yaml2, options)
```

### Description

Compares two YAML strings after normalization and parsing into objects.
The comparison uses the same structural logic as JSON comparison, allowing key order differences while still detecting real data changes.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| yaml1 | string | yes | The first YAML string to compare |
| yaml2 | string | yes | The second YAML string to compare |
| options | Object | no | Normalization options |
| options.ignoreCase | boolean | no | Whether to ignore case differences |
| options.ignoreSpaces | boolean | no | Whether to ignore leading/trailing spaces |
| options.ignoreAccents | boolean | no | Whether to remove accents before comparison |

### Returns

| Type | Description |
|------|-------------|
| boolean | True if the parsed YAML structures are equal, false otherwise |

### Examples

Ignore case in values:

```js
yaml.isEqual(
`
status: Active
`,
`
status: active
`,
{ ignoreCase: true }
)
// true
```

Ignore surrounding spaces:

```js
yaml.isEqual(
`
name:  Alice
`,
`
name: Alice
`,
{ ignoreSpaces: true }
)
// true
```

Compare nested configuration:

```js
const configA = `
app:
  name: my-service
  env: production
logging:
  level: info
`

const configB = `
logging:
  level: info
app:
  env: production
  name: my-service
`

yaml.isEqual(configA, configB)
// true
```

Detect a real difference:

```js
yaml.isEqual(
`
server:
  port: 3000
`,
`
server:
  port: 4000
`
)
// false
```

## isEqualFile

### Signature

```js
isEqualFile(content, filePath, options)
```

### Description

Compare a YAML string with the content of a YAML file.
The file is read as UTF-8 and parsed before being compared structurally.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| content | string | yes | The YAML string to compare |
| filePath | string | yes | The path to the YAML file |
| options | Object | no | Normalization options |

### Returns

| Type | Description |
|------|-------------|
| boolean | True if the YAML content matches the file content |

### Example

`config.yaml`

```
app:
  name: api
  port: 3000
```

```js
const yaml = `
app:
  name: api
  port: 3000
`

yaml.isEqualFile(yaml, "./config.yaml")
// true
```

```js
yaml.isEqualFile("app:\n  port: 4000", "./config.yaml")
// false
```

## isEqualFiles

### Signature

```js
isEqualFiles(path1, path2, options)
```

### Description

Compare the content of two YAML files.
Both files are parsed to ensure they represent the same data structure, regardless of key order or formatting.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| path1 | string | yes | Path to the first YAML file |
| path2 | string | yes | Path to the second YAML file |
| options | Object | no | Normalization options |

### Returns

| Type | Description |
|------|-------------|
| boolean | True if both files are structurally equal |

### Example

`env.prod.yaml`

```
app:
  name: service
  env: production
database:
  host: db
  port: 5432
```

`env.backup.yaml`

```
database:
  port: 5432
  host: db
app:
  env: production
  name: service
```

```js
yaml.isEqualFiles("./env.prod.yaml", "./env.backup.yaml")
// true
```

```js
yaml.isEqualFiles("./env.prod.yaml", "./env.dev.yaml")
// false
```