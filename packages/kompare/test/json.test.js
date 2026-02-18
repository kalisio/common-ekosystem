import { it, expect } from 'vitest'
import { compareJsonObjects } from '../src/json.js'

it('should reach 100% coverage', () => {
  const a = { x: 1, y: [10, 20] }
  const b = { y: [10, 20], x: 1 }

  expect(compareJsonObjects(a, b)).toBe(true)
  expect(compareJsonObjects({ a: 1, b: 2 }, { a: 1, b: 3 }, ['b'])).toBe(true)

  const obj1 = { a: 1, b: { c: 3 } }
  const obj2 = { a: 2, b: { d: 4 } }

  expect(compareJsonObjects(obj1, obj2)).toBe(false)

  const objExtra = { a: 1, extra: true }
  const objBase = { a: 1 }

  expect(compareJsonObjects(objBase, objExtra)).toBe(false)
})
