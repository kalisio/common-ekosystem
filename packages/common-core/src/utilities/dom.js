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
    for (const current of Array.from(node?.childNodes ?? [])) {
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

  number (node) {
    const value = dom.text(node)
    if (value === undefined || value === '') return undefined
    const result = Number(value)
    return Number.isFinite(result) ? result : undefined
  },

  attribute (node, name) {
    assert.all([
      { value: node, validator: isNullableDomNode, message: 'node must be a DOM node' },
      { value: name, validator: is.nonEmptyString, message: 'name must be a non-empty string' }
    ])
    if (node?.hasAttribute?.(name)) return node.getAttribute(name)
    for (const attribute of Array.from(node?.attributes ?? [])) {
      if (attribute.localName === name) return attribute.value
    }
    return undefined
  }

}
