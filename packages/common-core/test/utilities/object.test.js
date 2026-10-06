import { object } from '../../src/utilities/index.js'

describe('object', () => {
  describe('clone', () => {
    it('should throw if obj is undefined', () => {
      expect(() => object.clone(undefined)).toThrow('obj must be defined')
    })
    it('should throw if obj is null', () => {
      expect(() => object.clone(null)).toThrow('obj must be defined')
    })
    it('should throw if options do not conform to schema', () => {
      expect(() => object.clone({ a: 1 }, { plain: 'yes' })).toThrow()
    })
    it('should return a deep clone', () => {
      const original = { a: 1, b: { c: 2 } }
      const cloned = object.clone(original)
      expect(cloned).toEqual(original)
      expect(cloned).not.toBe(original)
      expect(cloned.b).not.toBe(original.b)
    })
    it('should clone arrays', () => {
      const original = [1, 2, [3, 4]]
      const cloned = object.clone(original)
      expect(cloned).toEqual(original)
      expect(cloned).not.toBe(original)
    })
    it('should not share references', () => {
      const original = { a: { b: 1 } }
      const cloned = object.clone(original)
      cloned.a.b = 99
      expect(original.a.b).toBe(1)
    })
    it('should keep functions by reference', () => {
      const fn = () => 42
      const original = { a: { fn }, list: [fn] }
      const cloned = object.clone(original)
      expect(cloned.a.fn).toBe(fn)
      expect(cloned.list[0]).toBe(fn)
      expect(cloned.a).not.toBe(original.a)
      expect(cloned.list).not.toBe(original.list)
    })
    it('should clone dates, regular expressions, maps and sets', () => {
      const fn = () => 42
      const original = {
        date: new Date(0),
        regexp: /a/gi,
        map: new Map([['a', { b: 1 }], ['fn', fn]]),
        set: new Set([{ a: 1 }])
      }
      const cloned = object.clone(original)
      expect(cloned).toEqual(original)
      expect(cloned.date).not.toBe(original.date)
      expect(cloned.regexp).not.toBe(original.regexp)
      expect(cloned.map).not.toBe(original.map)
      expect(cloned.map.get('a')).not.toBe(original.map.get('a'))
      expect(cloned.map.get('fn')).toBe(fn)
      expect(cloned.set).not.toBe(original.set)
      expect([...cloned.set][0]).not.toBe([...original.set][0])
    })
    it('should clone symbol keys', () => {
      const key = Symbol('key')
      const hidden = Symbol('hidden')
      const original = { a: 1, [key]: { b: 1 } }
      Object.defineProperty(original, hidden, { value: 1, enumerable: false })
      const cloned = object.clone(original)
      expect(Reflect.ownKeys(cloned)).toEqual(['a', key])
      expect(cloned[key]).toEqual({ b: 1 })
      expect(cloned[key]).not.toBe(original[key])
    })
    it('should clone binary data', () => {
      const buffer = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]).buffer
      const original = {
        buffer,
        bytes: new Uint8Array([1, 2, 3]),
        floats: new Float32Array([1.5, 2.5]),
        partial: new Uint16Array(buffer, 2, 2),
        view: new DataView(buffer, 4, 2),
        nodeBuffer: Buffer.from([1, 2, 3])
      }
      const cloned = object.clone(original)
      expect(cloned).toEqual(original)
      expect(cloned.buffer).not.toBe(buffer)
      expect(cloned.bytes).toBeInstanceOf(Uint8Array)
      expect(cloned.floats).toBeInstanceOf(Float32Array)
      expect(cloned.partial).toHaveLength(2)
      expect(cloned.view.byteLength).toBe(2)
      expect(cloned.view.getUint8(0)).toBe(5)
      expect(Buffer.isBuffer(cloned.nodeBuffer)).toBe(true)
      // the clones do not share their memory with the original
      cloned.bytes[0] = 99
      cloned.partial[0] = 99
      cloned.view.setUint8(0, 99)
      cloned.nodeBuffer[0] = 99
      new Uint8Array(cloned.buffer)[0] = 99
      expect(original.bytes[0]).toBe(1)
      expect(original.nodeBuffer[0]).toBe(1)
      expect(Array.from(new Uint8Array(buffer))).toEqual([1, 2, 3, 4, 5, 6, 7, 8])
    })

    describe('class instances', () => {
      class Foo {
        constructor () { this.a = { b: 1 } }
        get () { return this.a.b }
      }
      it('should clone class instances with their prototype', () => {
        const foo = new Foo()
        const cloned = object.clone({ foo, list: [foo] })
        expect(cloned.foo).not.toBe(foo)
        expect(cloned.foo).toBeInstanceOf(Foo)
        expect(cloned.foo.a).not.toBe(foo.a)
        expect(cloned.list[0]).toBeInstanceOf(Foo)
        cloned.foo.a.b = 99
        expect(cloned.foo.get()).toBe(99)
        expect(foo.get()).toBe(1)
      })
      it('should clone the symbol keys of class instances', () => {
        const key = Symbol('key')
        const foo = new Foo()
        foo[key] = { b: 1 }
        const cloned = object.clone(foo)
        expect(cloned[key]).toEqual({ b: 1 })
        expect(cloned[key]).not.toBe(foo[key])
      })
      it('should clone a class instance given as root value', () => {
        const foo = new Foo()
        const cloned = object.clone(foo)
        expect(cloned).not.toBe(foo)
        expect(cloned).toBeInstanceOf(Foo)
        expect(cloned).toEqual(foo)
      })
      it('should keep functions and other objects by reference', () => {
        const fn = () => 42
        const weakMap = new WeakMap()
        const promise = Promise.resolve()
        const cloned = object.clone({ fn, weakMap, promise })
        expect(cloned.fn).toBe(fn)
        expect(cloned.weakMap).toBe(weakMap)
        expect(cloned.promise).toBe(promise)
      })
      it('should keep class instances by reference when plain is true', () => {
        const foo = new Foo()
        const cloned = object.clone({ foo, list: [foo] }, { plain: true })
        expect(cloned.foo).toBe(foo)
        expect(cloned.list[0]).toBe(foo)
      })
    })
  })

  describe('normalize', () => {
    it('should throw if obj is undefined', () => {
      expect(() => object.normalize(undefined)).toThrow('obj must be an array or a plain object')
    })
    it('should throw if obj is null', () => {
      expect(() => object.normalize(null)).toThrow('obj must be an array or a plain object')
    })
    it('should throw if obj is a primitive', () => {
      expect(() => object.normalize('hello')).toThrow('obj must be an array or a plain object')
      expect(() => object.normalize(42)).toThrow('obj must be an array or a plain object')
    })
    it('should throw if options do not conform to schema', () => {
      expect(() => object.normalize({ a: 1 }, { ignoreCase: 'yes' })).toThrow()
      expect(() => object.normalize({ a: 1 }, { locale: 42 })).toThrow()
      expect(() => object.normalize({ a: 1 }, { ignoredKeys: 'a' })).toThrow()
    })
    it('should not mutate the original object', () => {
      const original = { c: 3, a: 1, b: 2 }
      const snapshot = { ...original }
      object.normalize(original)
      expect(original).toEqual(snapshot)
    })

    describe('plain objects', () => {
      it('should sort keys alphabetically', () => {
        const result = object.normalize({ c: 3, a: 1, b: 2 })
        expect(Object.keys(result)).toEqual(['a', 'b', 'c'])
      })
      it('should sort keys of nested objects', () => {
        const result = object.normalize({ b: { d: 4, c: 3 }, a: 1 })
        expect(Object.keys(result.b)).toEqual(['c', 'd'])
      })
      it('should filter ignored keys', () => {
        const result = object.normalize(
          { a: 1, b: 2, c: 3 },
          { ignoredKeys: ['b'] }
        )
        expect(result).not.toHaveProperty('b')
        expect(result).toHaveProperty('a')
        expect(result).toHaveProperty('c')
      })
      it('should filter ignored keys recursively', () => {
        const result = object.normalize(
          { a: { b: 1, c: 2 } },
          { ignoredKeys: ['b'] }
        )
        expect(result.a).not.toHaveProperty('b')
        expect(result.a).toHaveProperty('c')
      })
    })

    describe('arrays', () => {
      it('should sort a top-level array', () => {
        const result = object.normalize([3, 1, 2])
        expect(result).toEqual([1, 2, 3])
      })
      it('should sort array elements', () => {
        const result = object.normalize({ a: [3, 1, 2] })
        expect(result.a).toEqual([1, 2, 3])
      })
      it('should normalize array elements recursively', () => {
        const result = object.normalize({
          a: [{ b: 2, a: 1 }, { d: 4, c: 3 }]
        })
        expect(Object.keys(result.a[0])).toEqual(['a', 'b'])
        expect(Object.keys(result.a[1])).toEqual(['c', 'd'])
      })
      it('should push undefined values to the end without invoking the comparator', () => {
        // Array.prototype.sort() special-cases undefined elements per spec: they are
        // always moved to the end and never passed to the comparator function, so
        // JSON.stringify(undefined) never reaches string.compare.
        const result = object.normalize({ a: [3, undefined, 1] })
        expect(result.a).toEqual([1, 3, undefined])
      })
    })

    describe('strings', () => {
      it('should normalize strings with ignoreCase', () => {
        const result = object.normalize({ a: 'Hello' }, { ignoreCase: true })
        expect(result.a).toBe('hello')
      })
      it('should normalize strings with ignoreDiacritics', () => {
        const result = object.normalize({ a: 'éàü' }, { ignoreDiacritics: true })
        expect(result.a).toBe('eau')
      })
      it('should normalize strings with ignoreSpaces', () => {
        const result = object.normalize({ a: 'hello   world' }, { ignoreSpaces: true })
        expect(result.a).toBe('hello world')
      })
      it('should normalize strings recursively inside nested objects', () => {
        const result = object.normalize({ a: { b: 'Héllo' } }, { ignoreCase: true, ignoreDiacritics: true })
        expect(result.a.b).toBe('hello')
      })
      it('should normalize strings inside arrays', () => {
        const result = object.normalize({ a: ['Héllo', 'Wörld'] }, { ignoreDiacritics: true, ignoreCase: true })
        expect(result.a).toContain('hello')
        expect(result.a).toContain('world')
      })
    })

    describe('primitives', () => {
      it('should return numbers as-is', () => {
        expect(object.normalize({ a: 42 }).a).toBe(42)
      })
      it('should return booleans as-is', () => {
        expect(object.normalize({ a: false }).a).toBe(false)
      })
      it('should return nested null as-is', () => {
        expect(object.normalize({ a: null }).a).toBeNull()
      })
      it('should return nested undefined as-is', () => {
        expect(object.normalize({ a: undefined }).a).toBeUndefined()
      })
    })
  })

  describe('sort', () => {
    const items = [
      { id: 1, label: 'zèbre' },
      { id: 2, label: 'étoile' },
      { id: 3, label: 'abricot' }
    ]

    it('should sort an array of objects by a string property', () => {
      const result = object.sort(items, 'label')
      expect(result.map(i => i.id)).toEqual([3, 2, 1])
    })
    it('should not mutate the original array', () => {
      const snapshot = [...items]
      object.sort(items, 'label')
      expect(items).toEqual(snapshot)
    })
    it('should respect compare options (e.g. ignoreDiacritics: false)', () => {
      const result = object.sort(
        [{ label: 'ete' }, { label: 'été' }],
        'label',
        { ignoreDiacritics: false }
      )
      expect(result.map(i => i.label)).toEqual(['ete', 'été'])
    })
    it('should respect the locale option', () => {
      const result = object.sort(items, 'label', { locale: 'fr-FR' })
      expect(result.map(i => i.id)).toEqual([3, 2, 1])
    })
    it('should throw if arr is not an array', () => {
      expect(() => object.sort('not an array', 'label')).toThrow('arr must be an array')
      expect(() => object.sort({ a: 1 }, 'label')).toThrow('arr must be an array')
    })
    it('should throw if property is not a string', () => {
      expect(() => object.sort(items, 42)).toThrow('property must be a string')
    })
    it('should throw if options do not conform to schema', () => {
      expect(() => object.sort(items, 'label', { locale: 42 })).toThrow()
      expect(() => object.sort(items, 'label', { ignoreCase: 'yes' })).toThrow()
    })
  })

  describe('reorder', () => {
    const dict = { z: { label: 'zèbre' }, e: { label: 'étoile' }, a: { label: 'abricot' } }

    it('should reorder a dictionary of objects by a string property, preserving keys', () => {
      const result = object.reorder(dict, 'label')
      expect(Object.keys(result)).toEqual(['a', 'e', 'z'])
    })
    it('should not mutate the original dictionary', () => {
      const snapshot = { ...dict }
      object.reorder(dict, 'label')
      expect(dict).toEqual(snapshot)
    })
    it('should keep each value attached to its original key', () => {
      const result = object.reorder(dict, 'label')
      expect(result.a).toEqual({ label: 'abricot' })
      expect(result.z).toEqual({ label: 'zèbre' })
    })
    it('should respect compare options (e.g. ignoreDiacritics: false)', () => {
      const result = object.reorder(
        { x: { label: 'ete' }, y: { label: 'été' } },
        'label',
        { ignoreDiacritics: false }
      )
      expect(Object.values(result).map(v => v.label)).toEqual(['ete', 'été'])
    })
    it('should respect the locale option', () => {
      const result = object.reorder(dict, 'label', { locale: 'fr-FR' })
      expect(Object.keys(result)).toEqual(['a', 'e', 'z'])
    })
    it('should throw if obj is not a plain object', () => {
      expect(() => object.reorder([1, 2], 'label')).toThrow('obj must be a plain object')
      expect(() => object.reorder('not an object', 'label')).toThrow('obj must be a plain object')
    })
    it('should throw if property is not a string', () => {
      expect(() => object.reorder(dict, 42)).toThrow('property must be a string')
    })
    it('should throw if options do not conform to schema', () => {
      expect(() => object.reorder(dict, 'label', { locale: 42 })).toThrow()
      expect(() => object.reorder(dict, 'label', { ignoreCase: 'yes' })).toThrow()
    })
  })

  describe('lookup', () => {
    const value = {
      foo: {
        bar: 42,
        falsy: false,
        zero: 0,
        nil: null
      },
      items: [
        { name: 'first' },
        { name: 'second' }
      ]
    }
    it('returns a top-level value', () => {
      expect(object.lookup(value, 'foo')).toEqual(value.foo)
    })
    it('returns a nested value', () => {
      expect(object.lookup(value, 'foo.bar')).toBe(42)
    })
    it('traverses arrays', () => {
      expect(object.lookup(value, 'items.0.name')).toBe('first')
      expect(object.lookup(value, 'items.1.name')).toBe('second')
    })
    it('preserves falsy values', () => {
      expect(object.lookup(value, 'foo.falsy')).toBe(false)
      expect(object.lookup(value, 'foo.zero')).toBe(0)
      expect(object.lookup(value, 'foo.nil')).toBe(null)
    })
    it('returns undefined when the path does not exist', () => {
      expect(object.lookup(value, 'foo.unknown')).toBeUndefined()
      expect(object.lookup(value, 'unknown.foo')).toBeUndefined()
    })
    it('accepts an array as root value', () => {
      expect(object.lookup([{ name: 'foo' }], '0.name')).toBe('foo')
    })
    it('throws when obj is undefined', () => {
      expect(() => object.lookup(undefined, 'foo')).toThrow()
    })
    it('throws when path is empty', () => {
      expect(() => object.lookup(value, '')).toThrow()
    })
  })

  describe('dotify', () => {
    it('flattens a nested object', () => {
      expect(object.dotify({ a: { b: { c: 1 }, d: 2 }, e: 3 })).toEqual({
        'a.b.c': 1,
        'a.d': 2,
        e: 3
      })
    })
    it('returns a flat object unchanged', () => {
      expect(object.dotify({ a: 1, b: 2 })).toEqual({ a: 1, b: 2 })
    })
    it('handles empty object', () => {
      expect(object.dotify({})).toEqual({})
    })
    it('handles null values', () => {
      expect(object.dotify({ a: { b: null } })).toEqual({ 'a.b': null })
    })
    it('handles nested empty objects', () => {
      expect(object.dotify({ a: { b: {} } })).toEqual({ 'a.b': {} })
    })
    it('handles false values', () => {
      expect(object.dotify({ a: { b: false } })).toEqual({ 'a.b': false })
    })
    it('handles zero values', () => {
      expect(object.dotify({ a: { b: 0 } })).toEqual({ 'a.b': 0 })
    })
    it('handles string values', () => {
      expect(object.dotify({ a: { b: 'hello' } })).toEqual({ 'a.b': 'hello' })
    })
    it('keeps nested arrays as arrays', () => {
      expect(object.dotify({ geometry: { type: 'Point', coordinates: [1, 2] } })).toEqual({
        'geometry.type': 'Point',
        'geometry.coordinates': [1, 2]
      })
    })
    it('handles nested empty arrays', () => {
      expect(object.dotify({ a: { b: [] } })).toEqual({ 'a.b': [] })
    })
    it('throws if obj is not a plain object', () => {
      expect(() => object.dotify(null)).toThrow('obj must be a plain object')
      expect(() => object.dotify([])).toThrow('obj must be a plain object')
      expect(() => object.dotify('str')).toThrow('obj must be a plain object')
    })
  })
})
