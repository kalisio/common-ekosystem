import sanitizeHtml from 'sanitize-html'
import { assert, is, has } from '../predicates/index.js'

const SAFE_LINK_CONFIG = {
  allowedSchemes: ['http', 'https', 'mailto'],
  allowedSchemesAppliedToAttributes: ['href'],
  transformTags: {
    // merge: true — keeps existing attribs (href) and adds rel
    a: sanitizeHtml.simpleTransform('a', { rel: 'noopener noreferrer' }, true)
  }
}

// rel must be explicitly allowed, otherwise allowedAttributes strips it
// even after transformTags has injected it
const LINK_ATTRS = ['href', 'rel']

const MARKDOWN_BASE = {
  allowedTags: [
    'p', 'br',
    'strong', 'em',
    'code', 'pre',
    'blockquote',
    'ul', 'ol', 'li',
    'a'
  ],
  allowedAttributes: {
    a: LINK_ATTRS
  },
  ...SAFE_LINK_CONFIG,
  disallowedTagsMode: 'discard'
}

const SANITIZE_PROFILES = {
  // Removes all HTML tags
  strict: {
    allowedTags: [],
    allowedAttributes: {},
    disallowedTagsMode: 'discard'
  },

  // Basic formatting for comments/user-generated content (no links)
  basicFormatting: {
    allowedTags: [
      'b', 'strong',
      'i', 'em',
      'u',
      'p', 'br',
      'ul', 'ol', 'li'
    ],
    allowedAttributes: {},
    disallowedTagsMode: 'discard'
  },

  // Only allows safe links
  linksOnly: {
    allowedTags: ['a'],
    allowedAttributes: {
      a: LINK_ATTRS
    },
    ...SAFE_LINK_CONFIG,
    disallowedTagsMode: 'discard'
  },

  // Markdown-rendered content
  markdown: {
    ...MARKDOWN_BASE
  },

  // Rich content for blog/CMS/editor content
  richContent: {
    ...MARKDOWN_BASE,
    allowedTags: [
      ...MARKDOWN_BASE.allowedTags,
      'h1', 'h2', 'h3',
      'img'
    ],
    allowedAttributes: {
      a: LINK_ATTRS,
      img: ['src', 'alt', 'width', 'height']
    },
    allowedSchemes: ['http', 'https'],
    allowedSchemesAppliedToAttributes: ['href', 'src']
  },

  // Inline code and preformatted blocks only (e.g. user-submitted code snippets)
  codeSnippet: {
    allowedTags: ['code', 'pre'],
    allowedAttributes: {
      code: ['class']
    },
    disallowedTagsMode: 'discard'
  },

  // Incoming email content (preserves layout while stripping dangerous elements)
  emailContent: {
    allowedTags: [
      'p', 'br',
      'strong', 'em', 'b', 'i', 'u',
      'ul', 'ol', 'li',
      'blockquote',
      'a',
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
      'h1', 'h2', 'h3',
      'hr',
      'span', 'div'
    ],
    allowedAttributes: {
      a: LINK_ATTRS,
      table: ['width', 'cellpadding', 'cellspacing'],
      td: ['colspan', 'rowspan', 'width', 'align', 'valign'],
      th: ['colspan', 'rowspan', 'width', 'align', 'valign'],
      '*': ['style']
    },
    allowedStyles: {
      '*': {
        color: [/.*/],
        'background-color': [/.*/],
        'font-size': [/.*/],
        'font-weight': [/.*/],
        'text-align': [/.*/],
        padding: [/.*/],
        margin: [/.*/]
      }
    },
    ...SAFE_LINK_CONFIG,
    allowedSchemes: ['http', 'https', 'mailto'],
    disallowedTagsMode: 'discard'
  }
}

export function sanitize (html, config = 'basicFormatting') {
  assert.all([
    {
      value: html,
      validator: is.string,
      message: 'html must be a string'
    },
    {
      value: config,
      validator: (v) => is.nonEmptyObject(v) || has.key(SANITIZE_PROFILES, v),
      message: `config must be a profile name (${Object.keys(SANITIZE_PROFILES).join(', ')}) or a config object`
    }
  ])
  const options = is.string(config)
    ? SANITIZE_PROFILES[config]
    : config
  return sanitizeHtml(html, options)
}
