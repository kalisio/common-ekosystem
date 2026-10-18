import { is, assert, optional } from '../predicates/index.js'

const isDomNode = v => is.object(v) && is.integer(v.nodeType)
const isNullableDomNode = v => v == null || isDomNode(v)

export const dom = {

  children (node, name) {
    assert.all([
      { value: node, validator: isNullableDomNode, message: 'node must be a DOM node' },
      { value: name, validator: optional(is.nonEmptyString), message: 'name must be a non-empty string' }
    ])
    const result = []
    const nodes = node?.childNodes
    if (!nodes) return result
    for (let i = 0; i < nodes.length; i++) {
      const current = nodes[i]
      if (current.nodeType === 1 && (name === undefined || current.localName === name)) {
        result.push(current)
      }
    }
    return result
  },

  child (node, name) {
    return dom.children(node, name)[0] ?? null
  },

  text (node) {
    assert.that(node, isNullableDomNode, 'node must be a DOM node')
    const value = node?.textContent
    return value == null ? undefined : value.trim()
  },

  num (node) {
    const value = dom.text(node)
    if (value === undefined || value === '') return undefined
    const result = Number(value)
    return Number.isFinite(result) ? result : undefined
  },

  attr (node, name) {
    assert.all([
      { value: node, validator: isNullableDomNode, message: 'node must be a DOM node' },
      { value: name, validator: is.nonEmptyString, message: 'name must be a non-empty string' }
    ])
    // hasAttribute rather than getAttribute: xmldom returns '' for a missing
    // attribute, which would hide prefixed matches such as xlink:href.
    if (node?.hasAttribute?.(name)) return node.getAttribute(name)
    const attributes = node?.attributes
    if (!attributes) return undefined
    for (let i = 0; i < attributes.length; i++) {
      if (attributes[i].localName === name) return attributes[i].value
    }
    return undefined
  }

}
