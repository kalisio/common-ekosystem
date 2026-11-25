import { detectSubjectType, subject as setSubjectType } from '@casl/ability'
import { abilities, permissions } from '../../src/utilities/index.js'

const aliases = {
  update: ['patch'],
  read: ['get', 'find']
}

const ability = abilities.create([
  { action: 'update', subject: 'items', conditions: { context: 'org-1', ownerId: 'user-1' } },
  { action: 'update', subject: 'items', fields: ['title'], conditions: { context: 'org-2' } },
  { action: 'update', subject: 'items', inverted: true, conditions: { locked: true } }
], { aliases })

describe('permissions', () => {
  describe('createSubject', () => {
    it('types a copy of the subject', () => {
      const item = { _id: 'item-1', name: 'My item' }
      const subject = permissions.createSubject('items', item)
      expect(detectSubjectType(subject)).toBe('items')
      expect(subject).toEqual(item)
      expect(subject).not.toBe(item)
      expect(detectSubjectType(item)).toBe('Object')
    })
    it('merges attributes into the copy', () => {
      expect(permissions.createSubject('items', { _id: 'item-1' }, { context: 'org-1' }))
        .toEqual({ _id: 'item-1', context: 'org-1' })
    })
    it('types attributes alone, or an empty object', () => {
      expect(permissions.createSubject('items', null, { context: 'org-1' })).toEqual({ context: 'org-1' })
      expect(detectSubjectType(permissions.createSubject('items'))).toBe('items')
    })
    it('accepts a frozen subject', () => {
      const item = Object.freeze({ _id: 'item-1' })
      expect(detectSubjectType(permissions.createSubject('items', item))).toBe('items')
    })
    it('accepts frozen attributes', () => {
      const attributes = Object.freeze({ context: 'org-1' })
      expect(permissions.createSubject('items', { _id: 'item-1' }, attributes))
        .toEqual({ _id: 'item-1', context: 'org-1' })
    })
    it('retypes a subject already typed by CASL, without altering it', () => {
      const layer = setSubjectType('layers', { _id: 'layer-1' })
      expect(detectSubjectType(permissions.createSubject('items', layer))).toBe('items')
      expect(detectSubjectType(layer)).toBe('layers')
    })
    it('gives priority to attributes over subject properties', () => {
      expect(permissions.createSubject('items', { _id: 'item-1', context: 'org-2' }, { context: 'org-1' }))
        .toEqual({ _id: 'item-1', context: 'org-1' })
    })
    it('never alters the subject or attributes', () => {
      const item = { _id: 'item-1', context: 'org-2' }
      const attributes = { context: 'org-1', locked: false }

      const subject = permissions.createSubject('items', item, attributes)

      expect(subject).toEqual({
        _id: 'item-1',
        context: 'org-1',
        locked: false
      })
      expect(item).toEqual({ _id: 'item-1', context: 'org-2' })
      expect(attributes).toEqual({ context: 'org-1', locked: false })
      expect(detectSubjectType(item)).toBe('Object')
      expect(detectSubjectType(attributes)).toBe('Object')
    })
    it('preserves falsy attribute values when overriding subject properties', () => {
      const subject = permissions.createSubject(
        'items',
        { locked: true, count: 1, name: 'My item' },
        { locked: false, count: 0, name: '' }
      )

      expect(subject).toEqual({ locked: false, count: 0, name: '' })
    })
    it('preserves nested properties', () => {
      const item = {
        _id: 'item-1',
        meta: { title: 'My item', tags: ['public'] }
      }

      expect(permissions.createSubject('items', item)).toEqual(item)
    })
    it.each([
      ['an empty subject type', ['', {}], 'subjectType must be a non-empty string'],
      ['a subject that is not an object', ['items', 'item-1'], 'subject must be an object or nil'],
      ['attributes that are not an object', ['items', {}, ['org-1']], 'attributes must be an object or nil']
    ])('rejects %s', (name, args, message) => {
      expect(() => permissions.createSubject(...args)).toThrow(message)
    })
  })

  describe('can and cannot', () => {
    const checks = [
      ['a matching subject', ['patch', 'items', { context: 'org-1', ownerId: 'user-1' }], true],
      ['a subject matching a cannot rule', ['patch', 'items', { context: 'org-1', ownerId: 'user-1', locked: true }], false],
      ['a subject not matching', ['patch', 'items', { context: 'org-1', ownerId: 'user-2' }], false],
      ['a subject with attributes', ['patch', 'items', { ownerId: 'user-1' }, { attributes: { context: 'org-1' } }], true],
      ['a subject with other attributes', ['patch', 'items', { ownerId: 'user-1' }, { attributes: { context: 'org-3' } }], false],
      ['attributes taking priority over the subject', ['patch', 'items', { context: 'org-3', ownerId: 'user-1' }, { attributes: { context: 'org-1' } }], true],
      ['attributes alone', ['update', 'items', null, { attributes: { context: 'org-2' } }], true],
      ['attributes alone, with an equality on a missing property', ['update', 'items', null, { attributes: { context: 'org-1' } }], false],
      ['the subject type alone, with conditional rules only', ['update', 'items'], true],
      ['the subject type alone, without any rule', ['remove', 'items'], false],
      ['a permitted field', ['update', 'items', {}, { attributes: { context: 'org-2' }, field: 'title' }], true],
      ['another field', ['update', 'items', {}, { attributes: { context: 'org-2' }, field: 'body' }], false],
      ['an empty subject', ['update', 'items', {}], false],
      ['a null subject without attributes', ['update', 'items', null], true],
      ['empty attributes without a subject', ['update', 'items', undefined, { attributes: {} }], false],
      ['another subject type', ['update', 'projects', { context: 'org-1', ownerId: 'user-1' }], false],
      ['another action', ['execute', 'items', { context: 'org-1', ownerId: 'user-1' }], false],
      ['attributes matching a cannot rule', ['update', 'items', { context: 'org-1', ownerId: 'user-1' }, { attributes: { locked: true } }], false],
      ['a permitted field matching a cannot rule', ['update', 'items', { context: 'org-2', locked: true }, { field: 'title' }], false],
      ['an unrestricted field', ['update', 'items', { context: 'org-1', ownerId: 'user-1' }, { field: 'body' }], true]
    ]

    it.each(checks)('evaluates %s', (name, args, expected) => {
      expect(permissions.can(ability, ...args)).toBe(expected)
      expect(permissions.cannot(ability, ...args)).toBe(!expected)
    })
    it('denies everything without ability', () => {
      expect(permissions.can(null, 'read', 'items')).toBe(false)
      expect(permissions.can(undefined, 'read', 'items')).toBe(false)
      expect(permissions.cannot(null, 'read', 'items')).toBe(true)
      expect(permissions.cannot(undefined, 'read', 'items')).toBe(true)
    })
    it('denies everything with an empty ability', () => {
      const ability = abilities.create()
      expect(permissions.can(ability, 'update', 'items')).toBe(false)
      expect(permissions.can(ability, 'update', 'items', {})).toBe(false)
      expect(permissions.cannot(ability, 'update', 'items')).toBe(true)
    })
    it('never alters the subject', () => {
      const item = { context: 'org-1', ownerId: 'user-1' }
      permissions.can(ability, 'patch', 'items', item, { attributes: { locked: false } })
      expect(item).toEqual({ context: 'org-1', ownerId: 'user-1' })
      expect(detectSubjectType(item)).toBe('Object')
    })
    it('never alters the attributes', () => {
      const attributes = { context: 'org-1', locked: false }
      permissions.can(ability, 'patch', 'items', { ownerId: 'user-1' }, { attributes })
      expect(attributes).toEqual({ context: 'org-1', locked: false })
      expect(detectSubjectType(attributes)).toBe('Object')
    })
    it('evaluates permissions on a frozen subject', () => {
      const item = Object.freeze({ context: 'org-1', ownerId: 'user-1' })
      expect(permissions.can(ability, 'patch', 'items', item)).toBe(true)
    })
    it('uses the explicitly provided subject type', () => {
      const item = setSubjectType('layers', { context: 'org-1', ownerId: 'user-1' })
      expect(permissions.can(ability, 'patch', 'items', item)).toBe(true)
      expect(permissions.can(ability, 'patch', 'layers', item)).toBe(false)
      expect(detectSubjectType(item)).toBe('layers')
    })
    it('distinguishes a type-level check from an empty subject check', () => {
      const ability = abilities.create([
        { action: 'read', subject: 'items', conditions: { public: true } }
      ])

      expect(permissions.can(ability, 'read', 'items')).toBe(true)
      expect(permissions.can(ability, 'read', 'items', {})).toBe(false)
      expect(permissions.can(ability, 'read', 'items', undefined, { attributes: {} })).toBe(false)
    })
    it('evaluates nested subject properties', () => {
      const ability = abilities.create([
        { action: 'read', subject: 'items', conditions: { 'meta.public': true } }
      ])

      expect(permissions.can(ability, 'read', 'items', {
        meta: { public: true }
      })).toBe(true)

      expect(permissions.can(ability, 'read', 'items', {
        meta: { public: false }
      })).toBe(false)
    })
    it('evaluates logical operators on subjects and attributes', () => {
      const ability = abilities.create([
        {
          action: 'read',
          subject: 'items',
          conditions: {
            $and: [
              { context: 'org-1' },
              { $or: [{ public: true }, { ownerId: 'user-1' }] }
            ]
          }
        }
      ])

      expect(permissions.can(ability, 'read', 'items', {
        public: true
      }, { attributes: { context: 'org-1' } })).toBe(true)

      expect(permissions.can(ability, 'read', 'items', {
        ownerId: 'user-1'
      }, { attributes: { context: 'org-1' } })).toBe(true)

      expect(permissions.can(ability, 'read', 'items', {
        public: true
      }, { attributes: { context: 'org-2' } })).toBe(false)
    })
    it('reflects changes to the ability rules', () => {
      const ability = abilities.create([
        { action: 'read', subject: 'items' }
      ])

      expect(permissions.can(ability, 'read', 'items')).toBe(true)
      expect(permissions.can(ability, 'update', 'items')).toBe(false)

      abilities.update(ability, [
        { action: 'update', subject: 'items' }
      ])

      expect(permissions.can(ability, 'read', 'items')).toBe(false)
      expect(permissions.can(ability, 'update', 'items')).toBe(true)
    })

    describe('field restrictions', () => {
      const ability = abilities.create([
        { action: 'update', subject: 'items', fields: ['title', 'meta.*'] },
        { action: 'update', subject: 'items', fields: ['meta.secret'], inverted: true }
      ])

      it('matches fields with patterns', () => {
        expect(permissions.can(ability, 'update', 'items', {}, { field: 'title' })).toBe(true)
        expect(permissions.can(ability, 'update', 'items', {}, { field: 'meta.description' })).toBe(true)
        expect(permissions.can(ability, 'update', 'items', {}, { field: 'body' })).toBe(false)
      })
      it('applies cannot rules on fields', () => {
        expect(permissions.can(ability, 'update', 'items', {}, { field: 'meta.secret' })).toBe(false)
        expect(permissions.cannot(ability, 'update', 'items', {}, { field: 'meta.secret' })).toBe(true)
      })
      it('allows an action without a field when some fields are permitted', () => {
        expect(permissions.can(ability, 'update', 'items', {})).toBe(true)
      })
      it('evaluates fields at the subject type level', () => {
        expect(permissions.can(ability, 'update', 'items', undefined, { field: 'title' })).toBe(true)
        expect(permissions.can(ability, 'update', 'items', undefined, { field: 'body' })).toBe(false)
      })
    })

    describe('on a partial subject', () => {
      const ability = abilities.create([
        { action: 'update', subject: 'projects' },
        { action: 'update', subject: 'projects', inverted: true, conditions: { protected: true } },
        { action: 'read', subject: 'projects', conditions: { archived: { $ne: true } } }
      ])

      const project = { organizationId: '123', protected: true, archived: true }
      const attributes = { organizationId: '123' }

      it('ignores a cannot rule depending on a missing property', () => {
        expect(permissions.can(ability, 'update', 'projects', undefined, { attributes })).toBe(true)
        expect(permissions.can(ability, 'update', 'projects', project)).toBe(false)
      })
      it('may match a condition on a missing property', () => {
        expect(permissions.can(ability, 'read', 'projects', undefined, { attributes })).toBe(true)
        expect(permissions.can(ability, 'read', 'projects', project)).toBe(false)
      })
      it('behaves the same with a projection of the resource', () => {
        const projection = { organizationId: '123', archived: true }
        expect(permissions.can(ability, 'update', 'projects', projection)).toBe(true)
      })
      it('may match a cannot rule on a missing property', () => {
        const ability = abilities.create([
          { action: 'update', subject: 'projects' },
          {
            action: 'update',
            subject: 'projects',
            inverted: true,
            conditions: { ownerId: { $exists: false } }
          }
        ])

        expect(permissions.can(ability, 'update', 'projects', {})).toBe(false)
        expect(permissions.can(ability, 'update', 'projects', { ownerId: 'user-1' })).toBe(true)
        expect(permissions.cannot(ability, 'update', 'projects', {})).toBe(true)
      })
    })

    it.each([
      ['anything but a CASL ability', [{ can: () => true }, 'read', 'items'], 'ability must be a CASL ability'],
      ['an empty action', [ability, '', 'items'], 'action must be a non-empty string'],
      ['an empty subject type', [ability, 'read', ''], 'subjectType must be a non-empty string'],
      ['a subject that is not an object', [ability, 'update', 'items', 'item-1'], 'subject must be an object or nil'],
      ['a subject that is an array', [ability, 'update', 'items', []], 'subject must be an object or nil'],
      ['options that are not an object', [ability, 'update', 'items', {}, 'invalid'], 'invalid permission options'],
      ['an empty field', [ability, 'update', 'items', {}, { field: '' }], 'invalid permission options'],
      ['a field that is not a string', [ability, 'update', 'items', {}, { field: 123 }], 'invalid permission options'],
      ['attributes that are not an object', [ability, 'update', 'items', {}, { attributes: 'org-1' }], 'invalid permission options']
    ])('rejects %s', (name, args, message) => {
      expect(() => permissions.can(...args)).toThrow(message)
      expect(() => permissions.cannot(...args)).toThrow(message)
    })
  })

  describe('in production', () => {
    afterEach(() => {
      vi.unstubAllEnvs()
      vi.resetModules()
    })

    it('gives priority to attributes over subject properties', async () => {
      vi.stubEnv('NODE_ENV', 'production')
      vi.resetModules()

      const { permissions: production } = await import('../../src/utilities/permissions.js')

      const item = { context: 'org-2', ownerId: 'user-1' }
      const attributes = { context: 'org-1' }

      expect(production.createSubject('items', item, attributes))
        .toEqual({ context: 'org-1', ownerId: 'user-1' })

      expect(production.can(ability, 'update', 'items', item, { attributes })).toBe(true)
      expect(production.cannot(ability, 'update', 'items', item, { attributes })).toBe(false)
    })
    it('denies everything without ability', async () => {
      vi.stubEnv('NODE_ENV', 'production')
      vi.resetModules()

      const { permissions: production } = await import('../../src/utilities/permissions.js')

      expect(production.can(undefined, 'update', 'items')).toBe(false)
      expect(production.cannot(undefined, 'update', 'items')).toBe(true)
    })
  })
})
