---
title: sanitize
description: Sanitizes an HTML string using a named profile or a custom sanitize-html config.
---

# sanitize

## Signature

```js
sanitize (html, config = 'basicFormatting')
```

## Description

Sanitizes an HTML string by stripping disallowed tags and attributes. Accepts either a named built-in profile or a custom `sanitize-html` configuration object. All profiles discard disallowed tags and block common XSS vectors including `javascript:` hrefs, inline event handlers, and `<script>` or `<iframe>` elements.

## Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `html` | `string` | yes | The HTML string to sanitize |
| `config` | `string \| object` | no | A profile name or a custom `sanitize-html` config object. Defaults to `'basicFormatting'` |

### Built-in profiles

| Name | Description |
|------|-------------|
| `strict` | Strips all HTML tags. Returns plain text only |
| `basicFormatting` | Allows basic formatting tags (`b`, `strong`, `i`, `em`, `u`, `p`, `br`, `ul`, `ol`, `li`). No links |
| `linksOnly` | Allows `<a href>` only. Enforces `rel="noopener noreferrer"` and restricts schemes to `http`, `https`, `mailto` |
| `markdown` | Allows tags typically produced by Markdown renderers. No images or headings |
| `richContent` | Full CMS/blog profile. Allows headings, images, and all Markdown tags. Restricts image src to `http`/`https` |
| `codeSnippet` | Allows `<code>` and `<pre>` only. Preserves `class` on `<code>` for syntax highlighter hints |
| `emailContent` | Preserves email layout including tables, `div`, `span`, and safe inline styles. Strips unsafe CSS properties |

## Returns

| Type | Description |
|------|-------------|
| `string` | The sanitized HTML string |

## Throws

Throws if `html` is not a string or if `config` is neither a valid profile name nor a non-empty object.

## Examples

```js
// Default profile (basicFormatting)
sanitize('<p><strong>Hello</strong> <a href="https://x.com">world</a></p>')
// '<p><strong>Hello</strong> world</p>'
```

```js
// strict — plain text only
sanitize('<h1>Title</h1><p>Body</p>', 'strict')
// 'TitleBody'
```

```js
// linksOnly — adds rel, strips javascript: hrefs
sanitize('<a href="javascript:alert(1)">x</a><a href="https://example.com">y</a>', 'linksOnly')
// '<a href="https://example.com" rel="noopener noreferrer">y</a>'
```

```js
// markdown — strips img and headings, keeps formatting
sanitize('<h1>Title</h1><p><strong>bold</strong></p><img src="https://x.com/img.png">', 'markdown')
// 'Title<p><strong>bold</strong></p>'
```

```js
// richContent — allows headings and images, strips data: URIs
sanitize('<h2>Section</h2><img src="data:image/png;base64,abc" alt="x">', 'richContent')
// '<h2>Section</h2>'
```

```js
// codeSnippet — preserves language class, strips everything else
sanitize('<p>Example:</p><pre><code class="language-js">const x = 1</code></pre>', 'codeSnippet')
// '<pre><code class="language-js">const x = 1</code></pre>'
```

```js
// emailContent — keeps table layout and safe inline styles
sanitize('<table><tr><td style="color: red">cell</td></tr></table>', 'emailContent')
// '<table><tr><td style="color: red">cell</td></tr></table>'
```

```js
// Custom config
sanitize('<p>text</p><strong>bold</strong>', { allowedTags: ['p'] })
// '<p>text</p>'
```