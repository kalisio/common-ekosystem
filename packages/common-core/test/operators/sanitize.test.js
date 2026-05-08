import { describe, it, expect } from 'vitest'
import { sanitize } from '../../src/operators'

// ─── Helpers ────────────────────────────────────────────────────────────────

const xss = '<script>alert("xss")</script>'
const iframe = '<iframe src="https://evil.com"></iframe>'
const jsLink = '<a href="javascript:alert(1)">click</a>'
const dataImg = '<img src="data:image/png;base64,abc123" alt="x">'

// ─── Input validation ────────────────────────────────────────────────────────

describe('sanitize() — input validation', () => {
  it('throws if html is not a string', () => {
    expect(() => sanitize(null)).toThrow('html must be a string')
    expect(() => sanitize(42)).toThrow('html must be a string')
    expect(() => sanitize(undefined)).toThrow('html must be a string')
  })

  it('throws if config is an unknown profile name', () => {
    expect(() => sanitize('<p>hi</p>', 'unknown')).toThrow('config must be a profile name')
  })

  it('throws if config is an empty object', () => {
    expect(() => sanitize('<p>hi</p>', {})).toThrow('key must be a non empty string')
  })

  it('accepts a valid profile name', () => {
    expect(() => sanitize('<p>hi</p>', 'strict')).not.toThrow()
  })

  it('accepts a non-empty custom config object', () => {
    expect(() => sanitize('<p>hi</p>', { allowedTags: ['p'] })).not.toThrow()
  })

  it('defaults to basicFormatting when no config is provided', () => {
    // links are stripped in basicFormatting
    expect(sanitize('<a href="https://example.com">x</a>')).not.toContain('<a')
  })
})

// ─── strict ──────────────────────────────────────────────────────────────────

describe('sanitize() — strict', () => {
  it('strips all HTML tags', () => {
    expect(sanitize('<p><strong>hello</strong></p>', 'strict')).toBe('hello')
  })

  it('strips script tags', () => {
    expect(sanitize(xss, 'strict')).not.toContain('<script')
  })

  it('strips iframes', () => {
    expect(sanitize(iframe, 'strict')).not.toContain('<iframe')
  })

  it('returns plain text content', () => {
    expect(sanitize('<h1>Title</h1><p>Body</p>', 'strict')).toBe('TitleBody')
  })

  it('returns empty string for tag-only input', () => {
    expect(sanitize('<br>', 'strict')).toBe('')
  })
})

// ─── basicFormatting ─────────────────────────────────────────────────────────

describe('sanitize() — basicFormatting', () => {
  it('keeps allowed formatting tags', () => {
    const input = '<p><strong>bold</strong> and <em>italic</em></p>'
    expect(sanitize(input)).toContain('<strong>')
    expect(sanitize(input)).toContain('<em>')
    expect(sanitize(input)).toContain('<p>')
  })

  it('strips links', () => {
    expect(sanitize('<a href="https://x.com">link</a>')).not.toContain('<a')
  })

  it('strips script tags', () => {
    expect(sanitize(xss)).not.toContain('<script')
  })

  it('strips attributes from allowed tags', () => {
    expect(sanitize('<p class="danger" onclick="evil()">text</p>')).toBe('<p>text</p>')
  })

  it('keeps list structure', () => {
    const input = '<ul><li>one</li><li>two</li></ul>'
    const result = sanitize(input)
    expect(result).toContain('<ul>')
    expect(result).toContain('<li>')
  })
})

// ─── linksOnly ───────────────────────────────────────────────────────────────

describe('sanitize() — linksOnly', () => {
  it('keeps safe http/https links', () => {
    const result = sanitize('<a href="https://example.com">link</a>', 'linksOnly')
    expect(result).toContain('<a href="https://example.com"')
  })

  it('keeps mailto links', () => {
    const result = sanitize('<a href="mailto:hi@example.com">mail</a>', 'linksOnly')
    expect(result).toContain('href="mailto:hi@example.com"')
  })

  it('strips javascript: hrefs', () => {
    expect(sanitize(jsLink, 'linksOnly')).not.toContain('javascript:')
  })

  it('adds rel="noopener noreferrer" to links', () => {
    const result = sanitize('<a href="https://example.com">x</a>', 'linksOnly')
    expect(result).toContain('rel="noopener noreferrer"')
  })

  it('strips surrounding formatting tags (only <a> allowed)', () => {
    const result = sanitize('<p><a href="https://x.com">link</a></p>', 'linksOnly')
    expect(result).not.toContain('<p>')
    expect(result).toContain('<a')
  })
})

// ─── markdown ────────────────────────────────────────────────────────────────

describe('sanitize() — markdown', () => {
  it('keeps all MARKDOWN_BASE tags', () => {
    const input = '<p>text</p><strong>bold</strong><em>italic</em><code>x</code><pre>y</pre><blockquote>q</blockquote><ul><li>a</li></ul>'
    const result = sanitize(input, 'markdown')
    ;['<p>', '<strong>', '<em>', '<code>', '<pre>', '<blockquote>', '<ul>', '<li>'].forEach(tag => {
      expect(result).toContain(tag)
    })
  })

  it('strips img tags', () => {
    expect(sanitize('<img src="https://x.com/img.png" alt="x">', 'markdown')).not.toContain('<img')
  })

  it('strips h1-h3 tags but keeps text', () => {
    expect(sanitize('<h1>Title</h1>', 'markdown')).not.toContain('<h1>')
    expect(sanitize('<h1>Title</h1>', 'markdown')).toContain('Title')
  })

  it('adds rel="noopener noreferrer" to links', () => {
    const result = sanitize('<a href="https://example.com">x</a>', 'markdown')
    expect(result).toContain('rel="noopener noreferrer"')
  })

  it('strips javascript: hrefs', () => {
    expect(sanitize(jsLink, 'markdown')).not.toContain('javascript:')
  })
})

// ─── richContent ─────────────────────────────────────────────────────────────

describe('sanitize() — richContent', () => {
  it('keeps headings', () => {
    const result = sanitize('<h1>A</h1><h2>B</h2><h3>C</h3>', 'richContent')
    expect(result).toContain('<h1>')
    expect(result).toContain('<h2>')
    expect(result).toContain('<h3>')
  })

  it('keeps safe images', () => {
    const result = sanitize('<img src="https://example.com/img.png" alt="photo" width="100" height="80">', 'richContent')
    expect(result).toContain('<img')
    expect(result).toContain('alt="photo"')
  })

  it('strips data: URI images', () => {
    expect(sanitize(dataImg, 'richContent')).not.toContain('data:')
  })

  it('strips mailto: from image src (only http/https allowed for src)', () => {
    const result = sanitize('<img src="mailto:x@x.com" alt="x">', 'richContent')
    expect(result).not.toContain('mailto:')
  })

  it('adds rel="noopener noreferrer" to links', () => {
    const result = sanitize('<a href="https://example.com">x</a>', 'richContent')
    expect(result).toContain('rel="noopener noreferrer"')
  })

  it('strips script tags', () => {
    expect(sanitize(xss, 'richContent')).not.toContain('<script')
  })

  it('strips img attributes not in allowlist', () => {
    const result = sanitize('<img src="https://x.com/img.png" onclick="evil()" loading="lazy">', 'richContent')
    expect(result).not.toContain('onclick')
    expect(result).not.toContain('loading')
  })
})

// ─── codeSnippet ─────────────────────────────────────────────────────────────

describe('sanitize() — codeSnippet', () => {
  it('keeps <code> and <pre> tags', () => {
    const result = sanitize('<pre><code class="language-js">const x = 1</code></pre>', 'codeSnippet')
    expect(result).toContain('<pre>')
    expect(result).toContain('<code')
  })

  it('keeps language class on <code>', () => {
    const result = sanitize('<code class="language-python">pass</code>', 'codeSnippet')
    expect(result).toContain('class="language-python"')
  })

  it('strips all other tags', () => {
    const result = sanitize('<p>text</p><strong>bold</strong><a href="#">link</a>', 'codeSnippet')
    expect(result).not.toContain('<p>')
    expect(result).not.toContain('<strong>')
    expect(result).not.toContain('<a')
  })

  it('strips script tags', () => {
    expect(sanitize(xss, 'codeSnippet')).not.toContain('<script')
  })

  it('strips arbitrary attributes from <code>', () => {
    const result = sanitize('<code onclick="evil()" style="color:red">x</code>', 'codeSnippet')
    expect(result).not.toContain('onclick')
    expect(result).not.toContain('style')
  })
})

// ─── emailContent ─────────────────────────────────────────────────────────────

describe('sanitize() — emailContent', () => {
  it('keeps table structure', () => {
    const input = '<table><thead><tr><th>A</th></tr></thead><tbody><tr><td>B</td></tr></tbody></table>'
    const result = sanitize(input, 'emailContent')
    ;['<table>', '<thead>', '<tbody>', '<tr>', '<th>', '<td>'].forEach(tag => {
      expect(result).toContain(tag)
    })
  })

  it('keeps safe inline styles', () => {
    const result = sanitize('<p style="color: red; font-size: 14px;">text</p>', 'emailContent')
    expect(result).toContain('color')
    expect(result).toContain('font-size')
  })

  it('strips unsafe CSS properties', () => {
    const result = sanitize('<p style="position:fixed; top:0; left:0; display:none">text</p>', 'emailContent')
    expect(result).not.toContain('position')
    expect(result).not.toContain('display')
  })

  it('strips script tags', () => {
    expect(sanitize(xss, 'emailContent')).not.toContain('<script')
  })

  it('strips javascript: hrefs', () => {
    expect(sanitize(jsLink, 'emailContent')).not.toContain('javascript:')
  })

  it('adds rel="noopener noreferrer" to links', () => {
    const result = sanitize('<a href="https://example.com">x</a>', 'emailContent')
    expect(result).toContain('rel="noopener noreferrer"')
  })

  it('keeps mailto links', () => {
    const result = sanitize('<a href="mailto:hi@example.com">contact</a>', 'emailContent')
    expect(result).toContain('mailto:hi@example.com')
  })

  it('keeps div and span for layout', () => {
    const result = sanitize('<div><span style="font-weight:bold">text</span></div>', 'emailContent')
    expect(result).toContain('<div>')
    expect(result).toContain('<span')
  })
})

// ─── Custom config ────────────────────────────────────────────────────────────

describe('sanitize() — custom config object', () => {
  it('applies a custom allowedTags config', () => {
    const result = sanitize('<p>text</p><strong>bold</strong>', { allowedTags: ['p'] })
    expect(result).toContain('<p>')
    expect(result).not.toContain('<strong>')
  })

  it('strips everything with an empty allowedTags array', () => {
    const result = sanitize('<p>hello</p>', { allowedTags: [], allowedAttributes: {} })
    expect(result).toBe('hello')
  })
})

// ─── XSS cross-profile ───────────────────────────────────────────────────────

describe('sanitize() — XSS hardening across all profiles', () => {
  const profiles = ['strict', 'basicFormatting', 'linksOnly', 'markdown', 'richContent', 'codeSnippet', 'emailContent']
  const attacks = [
    '<script>alert(1)</script>',
    '<img src=x onerror=alert(1)>',
    '<svg onload=alert(1)>',
    '<a href="javascript:alert(1)">x</a>',
    '<iframe src="https://evil.com"></iframe>',
    '<body onload=alert(1)>',
    '<input type="hidden" name="x" value="<script>alert(1)</script>">'
  ]

  profiles.forEach(profile => {
    attacks.forEach(attack => {
      it(`[${profile}] blocks: ${attack.slice(0, 40)}`, () => {
        const result = sanitize(attack, profile)
        expect(result).not.toMatch(/javascript:/i)
        expect(result).not.toMatch(/<script/i)
        expect(result).not.toMatch(/onerror=/i)
        expect(result).not.toMatch(/onload=/i)
        expect(result).not.toMatch(/<iframe/i)
      })
    })
  })
})
