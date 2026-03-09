# text

## compare

### Signature

```js
compare(a, b, options)
```

### Description

Perform a comparison between two strings and return the status along with detailed differences.
Differences are reported at the `"text"` path if the strings do not match after normalization.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| a | string | yes | The source string |
| b | string | yes | The target string |
| options | Object | no | Normalization options |

### Returns

| Type | Description |
|------|-------------|
| Object | An object containing `isEqual` (boolean) and `differences` (updated) |

### Examples

```js
text.compare("Apple", "apple")
/*
{
  isEqual: false,
  differences: {
    updated: [
      { path: "text", oldValue: "Apple", newValue: "apple" }
    ]
  }
}
*/
```

```js
text.compare("Hello world", "Hello  world")
/*
{
  isEqual: false,
  differences: {
    updated: [
      { path: "text", oldValue: "Hello world", newValue: "Hello  world" }
    ]
  }
}
*/
```

## isEqual

### Signature

```js
isEqual(text1, text2, options)
```

### Description

Compares two strings after normalization.
The comparison can ignore case differences, surrounding spaces (trim), and/or accents (diacritical marks) based on the provided options.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| text1 | string | yes | The first string to compare |
| text2 | string | yes | The second string to compare |
| options | Object | no | Normalization options |
| options.ignoreCase | boolean | no | Ignore case differences |
| options.ignoreSpaces | boolean | no | Ignore leading/trailing spaces |
| options.ignoreAccents | boolean | no | Remove accents before comparison |

### Returns

| Type | Description |
|------|-------------|
| boolean | True if the normalized strings are equal |

### Examples

Ignore case differences:

```js
text.isEqual("Hello", "hello", { ignoreCase: true })
// true
```

Ignore accents:

```js
text.isEqual("École", "ecole", {
  ignoreCase: true,
  ignoreAccents: true
})
// true
```

Ignore surrounding spaces:

```js
text.isEqual(" Hello ", "Hello", {
  ignoreSpaces: true
})
// true
```

Detect real differences:

```js
text.isEqual("Hello world", "Hello worlds")
// false
```

## isEqualFile

### Signature

```js
isEqualFile(content, filePath, options)
```

### Description

Compare a string with the content of a file.
The file is read as UTF-8 and both strings are normalized according to the options before comparison.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| content | string | yes | The string to compare |
| filePath | string | yes | Path to the file |
| options | Object | no | Normalization options |

### Returns

| Type | Description |
|------|-------------|
| boolean | True if the content matches the file |

### Example

`greeting.txt`

```
Hello World
```

```js
text.isEqualFile("hello world", "./greeting.txt", {
  ignoreCase: true
})
// true
```

```js
text.isEqualFile("Hello Mars", "./greeting.txt")

// false
```

## isEqualFiles

### Signature

```js
isEqualFiles(path1, path2, options)
```

### Description

Compare the content of two different files.
Both files are read and normalized before being compared.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| path1 | string | yes | Path to the first file |
| path2 | string | yes | Path to the second file |
| options | Object | no | Normalization options |

### Returns

| Type | Description |
|------|-------------|
| boolean | True if both files contain the same normalized text |

### Example

`doc1.txt`

```
Hello World
```

`doc2.txt`

```
hello world
```

```js
text.isEqualFiles("./doc1.txt", "./doc2.txt", {
  ignoreCase: true
})
// true
```

```js
text.isEqualFiles("./doc1.txt", "./doc2.txt")
// false
```