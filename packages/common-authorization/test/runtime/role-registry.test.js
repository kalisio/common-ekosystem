import { RoleRegistry } from '../../src/runtime/index.js'

// member <- editor, reviewer <- manager <- owner: a diamond on member
function createRoles () {
  const roles = new RoleRegistry()
  roles.register('member', {})
  roles.register('editor', { inherits: ['member'] })
  roles.register('reviewer', { inherits: ['member'] })
  roles.register('manager', { inherits: ['editor', 'reviewer'] })
  roles.register('owner', { inherits: ['manager'] })
  return roles
}

describe('RoleRegistry', () => {
  describe('register', () => {
    it('stores a frozen copy of the definition', () => {
      const roles = new RoleRegistry()
      const inherits = []
      const definition = { label: 'Member', inherits }

      roles.register('member', definition)
      inherits.push('owner')

      expect(roles.get('member')).toEqual({ label: 'Member', inherits: [] })
      expect(roles.get('member')).not.toBe(definition)
      expect(Object.isFrozen(roles.get('member'))).toBe(true)
      expect(Object.isFrozen(roles.get('member').inherits)).toBe(true)
    })
    it('defaults inherits to an empty array', () => {
      const roles = new RoleRegistry()
      roles.register('member', {})
      expect(roles.get('member').inherits).toEqual([])
    })
    it('rejects a role already registered', () => {
      const roles = createRoles()
      expect(() => roles.register('member', {}))
        .toThrow('entry already registered: member')
    })
    it('rejects an unknown parent', () => {
      const roles = new RoleRegistry()
      expect(() => roles.register('manager', { inherits: ['member'] }))
        .toThrow(new TypeError('unknown parent role: member'))
    })
    it.each([
      ['inherits that is not an array', { inherits: 'member' }],
      ['an empty parent name', { inherits: [''] }],
      ['a definition that is not an object', 'member']
    ])('rejects %s', (name, definition) => {
      expect(() => new RoleRegistry().register('manager', definition))
        .toThrow('invalid role definition')
    })
  })

  describe('replace', () => {
    it('updates the definition', () => {
      const roles = createRoles()
      roles.replace('owner', { inherits: ['editor'] })
      expect(roles.resolve(['owner'])).toEqual(['member', 'editor', 'owner'])
    })
    it.each([
      ['itself', 'member', ['member']],
      ['a descendant', 'member', ['owner']],
      ['an indirect descendant', 'editor', ['owner']]
    ])('rejects a cycle through %s', (name, role, inherits) => {
      const roles = createRoles()
      expect(() => roles.replace(role, { inherits })).toThrow(TypeError)
    })
    it('rejects an unknown parent', () => {
      const roles = createRoles()
      expect(() => roles.replace('editor', { inherits: ['admin'] }))
        .toThrow(new TypeError('unknown parent role: admin'))
    })
    it('preserves the previous definition when replacement is rejected', () => {
      const roles = createRoles()
      const definition = roles.get('editor')
      const version = roles.version

      expect(() => roles.replace('editor', {
        inherits: ['owner']
      })).toThrow(TypeError)

      expect(roles.get('editor')).toBe(definition)
      expect(roles.resolve(['owner']))
        .toEqual(['member', 'editor', 'reviewer', 'manager', 'owner'])
      expect(roles.version).toBe(version)
    })
    it('updates inheritance for all descendants', () => {
      const roles = createRoles()

      roles.replace('manager', { inherits: ['reviewer'] })

      expect(roles.resolve(['owner']))
        .toEqual(['member', 'reviewer', 'manager', 'owner'])

      expect(roles.inherits('owner', 'editor')).toBe(false)
      expect(roles.getDescendants('editor')).toEqual([])
      expect(roles.getDescendants('reviewer'))
        .toEqual(['manager', 'owner'])

      expect(roles.unregister('editor')).toBe(true)
    })
    it('stores a frozen copy of the replacement definition', () => {
      const roles = createRoles()
      const inherits = ['reviewer']
      const definition = { inherits }

      roles.replace('owner', definition)
      inherits.push('editor')

      expect(roles.get('owner')).not.toBe(definition)
      expect(roles.get('owner').inherits).toEqual(['reviewer'])
      expect(Object.isFrozen(roles.get('owner'))).toBe(true)
      expect(Object.isFrozen(roles.get('owner').inherits)).toBe(true)
    })
  })

  describe('version', () => {
    it('increments the version once per mutation', () => {
      const roles = new RoleRegistry()

      expect(roles.version).toBe(0)

      roles.register('member', {})
      expect(roles.version).toBe(1)

      roles.replace('member', { label: 'Member' })
      expect(roles.version).toBe(2)

      roles.unregister('member')
      expect(roles.version).toBe(3)

      roles.clear()
      expect(roles.version).toBe(4)
    })
    it('is left unchanged by a rejected or ineffective mutation', () => {
      const roles = createRoles()
      const version = roles.version

      expect(() => roles.register('member', {})).toThrow()
      expect(() => roles.register('admin', { inherits: ['unknown'] })).toThrow()
      expect(() => roles.replace('member', { inherits: ['owner'] })).toThrow()
      expect(() => roles.replace('editor', { inherits: ['unknown'] })).toThrow()
      expect(() => roles.unregister('member')).toThrow()
      expect(roles.unregister('unknown')).toBe(false)

      expect(roles.version).toBe(version)
    })
    it('is left unchanged by read operations', () => {
      const roles = createRoles()
      const version = roles.version

      roles.get('member')
      roles.has('owner')
      roles.keys()
      roles.resolve(['owner'])
      roles.inherits('owner', 'member')
      roles.getAncestors('owner')
      roles.getDescendants('member')

      expect(roles.version).toBe(version)
    })
    it('is not reset when the registry is cleared', () => {
      const roles = createRoles()
      const version = roles.version

      roles.clear()
      expect(roles.version).toBe(version + 1)

      roles.register('member', {})
      expect(roles.version).toBe(version + 2)
    })
  })

  describe('unregister', () => {
    it('removes a role that no other role inherits', () => {
      const roles = createRoles()
      expect(roles.unregister('owner')).toBe(true)
      expect(roles.has('owner')).toBe(false)
    })
    it('refuses to remove an inherited role', () => {
      const roles = createRoles()

      expect(() => roles.unregister('editor'))
        .toThrow('role still inherited by: manager, owner')

      expect(roles.has('editor')).toBe(true)
    })
    it('returns false for an unknown role', () => {
      const roles = createRoles()
      expect(roles.unregister('admin')).toBe(false)
    })
    it('allows a role to be removed once its descendants are removed', () => {
      const roles = createRoles()

      expect(roles.unregister('owner')).toBe(true)
      expect(roles.unregister('manager')).toBe(true)
      expect(roles.unregister('editor')).toBe(true)
      expect(roles.unregister('reviewer')).toBe(true)
      expect(roles.unregister('member')).toBe(true)

      expect(roles.keys()).toEqual([])
    })
  })

  describe('clear', () => {
    it('removes all roles regardless of their inheritance', () => {
      const roles = createRoles()

      roles.clear()

      expect(roles.keys()).toEqual([])
      expect(roles.resolve([])).toEqual([])
      expect(roles.has('member')).toBe(false)
      expect(roles.has('owner')).toBe(false)
    })
    it('allows roles to be registered again after clearing', () => {
      const roles = createRoles()

      roles.clear()
      roles.register('member', {})
      roles.register('owner', { inherits: ['member'] })

      expect(roles.resolve(['owner'])).toEqual(['member', 'owner'])
    })
  })

  describe('resolve', () => {
    it('lists ancestors before their descendants, the role last', () => {
      const roles = new RoleRegistry()

      roles.register('member', {})
      roles.register('manager', { inherits: ['member'] })
      roles.register('owner', { inherits: ['manager'] })

      expect(roles.resolve(['owner'])).toEqual(['member', 'manager', 'owner'])
    })
    it('lists a common ancestor once, before every branch', () => {
      expect(createRoles().resolve(['manager']))
        .toEqual(['member', 'editor', 'reviewer', 'manager'])
    })
    it('keeps the order of several roles, without duplicates', () => {
      const roles = createRoles()

      expect(roles.resolve(['reviewer', 'editor']))
        .toEqual(['member', 'reviewer', 'editor'])

      expect(roles.resolve(['owner', 'editor']))
        .toEqual(['member', 'editor', 'reviewer', 'manager', 'owner'])
    })
    it('respects the order of inherited roles', () => {
      const roles = createRoles()

      roles.replace('manager', { inherits: ['reviewer', 'editor'] })

      expect(roles.resolve(['manager']))
        .toEqual(['member', 'reviewer', 'editor', 'manager'])
    })
    it('resolves a role without ancestors', () => {
      expect(createRoles().resolve(['member'])).toEqual(['member'])
    })
    it('resolves independent roles in the given order', () => {
      const roles = new RoleRegistry()

      roles.register('editor', {})
      roles.register('reviewer', {})

      expect(roles.resolve(['editor', 'reviewer']))
        .toEqual(['editor', 'reviewer'])

      expect(roles.resolve(['reviewer', 'editor']))
        .toEqual(['reviewer', 'editor'])
    })
    it('ignores duplicate roles', () => {
      const roles = createRoles()

      expect(roles.resolve(['member', 'member']))
        .toEqual(['member'])

      expect(roles.resolve(['editor', 'reviewer', 'editor']))
        .toEqual(['member', 'editor', 'reviewer'])
    })
    it('resolves no role to an empty array', () => {
      expect(createRoles().resolve([])).toEqual([])
    })
    it.each([
      ['an unknown role', ['admin'], 'unknown role: admin'],
      ['a single name', 'member', 'roles must be an array of names'],
      ['an empty name', [''], 'roles must be an array of names'],
      ['a non-string name', [123], 'roles must be an array of names']
    ])('rejects %s', (name, names, message) => {
      expect(() => createRoles().resolve(names)).toThrow(message)
    })
  })

  describe('inherits', () => {
    it.each([
      ['itself', 'manager', 'manager', true],
      ['a parent', 'manager', 'editor', true],
      ['an indirect ancestor', 'owner', 'member', true],
      ['a descendant', 'member', 'owner', false],
      ['a role on another branch', 'editor', 'reviewer', false],
      ['a role on another branch, the other way round', 'reviewer', 'editor', false]
    ])('tells whether a role inherits %s', (name, role, ancestor, expected) => {
      expect(createRoles().inherits(role, ancestor)).toBe(expected)
    })
    it('rejects unknown roles', () => {
      const roles = createRoles()

      expect(() => roles.inherits('admin', 'member'))
        .toThrow(new TypeError('unknown role: admin'))

      expect(() => roles.inherits('owner', 'admin'))
        .toThrow('unknown role: admin')
    })
  })

  describe('getAncestors and getDescendants', () => {
    it('lists ancestors in reverse resolution order', () => {
      const roles = createRoles()

      expect(roles.getAncestors('owner'))
        .toEqual(['manager', 'reviewer', 'editor', 'member'])

      expect(roles.getAncestors('member')).toEqual([])
    })
    it('lists ancestors without duplicates', () => {
      const roles = createRoles()

      expect(roles.getAncestors('manager'))
        .toEqual(['reviewer', 'editor', 'member'])
    })
    it('lists descendants in registration order', () => {
      const roles = createRoles()

      expect(roles.getDescendants('member'))
        .toEqual(['editor', 'reviewer', 'manager', 'owner'])

      expect(roles.getDescendants('reviewer'))
        .toEqual(['manager', 'owner'])

      expect(roles.getDescendants('owner')).toEqual([])
    })
    it('does not include unrelated roles', () => {
      const roles = createRoles()
      roles.register('admin', {})

      expect(roles.getAncestors('admin')).toEqual([])
      expect(roles.getDescendants('admin')).toEqual([])
      expect(roles.getAncestors('owner')).not.toContain('admin')
      expect(roles.getDescendants('member')).not.toContain('admin')
    })
    it('rejects unknown roles', () => {
      const roles = createRoles()

      expect(() => roles.getAncestors('admin'))
        .toThrow(new TypeError('unknown role: admin'))

      expect(() => roles.getDescendants('admin'))
        .toThrow('unknown role: admin')
    })
  })

  describe('instances', () => {
    it('maintains independent roles and versions', () => {
      const first = new RoleRegistry()
      const second = new RoleRegistry()

      first.register('member', {})
      second.register('admin', {})

      expect(first.has('admin')).toBe(false)
      expect(second.has('member')).toBe(false)

      first.register('owner', { inherits: ['member'] })

      expect(first.version).toBe(2)
      expect(second.version).toBe(1)

      first.clear()

      expect(second.has('admin')).toBe(true)
      expect(second.version).toBe(1)
    })
  })

  describe('in production', () => {
    afterEach(() => {
      vi.unstubAllEnvs()
      vi.resetModules()
    })

    it('preserves registry invariants', async () => {
      vi.stubEnv('NODE_ENV', 'production')
      vi.resetModules()

      const { RoleRegistry } = await import('../../src/runtime/role-registry.js')

      const roles = new RoleRegistry()
      roles.register('member', {})
      roles.register('owner', { inherits: ['member'] })

      const version = roles.version

      expect(() => roles.resolve(['admin'])).toThrow(TypeError)

      expect(() => roles.register('manager', {
        inherits: ['admin']
      })).toThrow(TypeError)

      expect(() => roles.replace('member', {
        inherits: ['member']
      })).toThrow(TypeError)

      expect(() => roles.replace('member', {
        inherits: ['owner']
      })).toThrow(TypeError)

      expect(() => roles.unregister('member'))
        .toThrow('role still inherited by: owner')

      expect(roles.resolve(['owner'])).toEqual(['member', 'owner'])
      expect(roles.version).toBe(version)
    })
  })
})
