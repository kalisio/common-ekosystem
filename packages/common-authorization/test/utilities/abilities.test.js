import { AbilityBuilder, createMongoAbility, subject } from '@casl/ability'
import { ObjectId } from 'mongodb'
import { abilities, UNSCOPED } from '../../src/utilities/index.js'
import { RoleRegistry } from '../../src/runtime/index.js'

const aliases = {
  update: ['patch'],
  read: ['get', 'find'],
  remove: ['delete'],
  all: ['read', 'create', 'update', 'remove']
}

const item = (properties = {}) => subject('items', { _id: 'item-1', ...properties })

const invalid = [
  ['$or with a string', { $or: 'invalid' }],
  ['$or with an empty array', { $or: [] }],
  ['$in with a scalar', { count: { $in: 5 } }],
  ['$size with a string', { tags: { $size: 'two' } }]
]

const unsupported = [
  ['$mod', { count: { $mod: [2, 0] } }],
  ['$not', { count: { $not: { $eq: 1 } } }],
  ['$where', { $where: 'this.count > 1' }],
  ['$expr', { $expr: { $gt: ['$count', 1] } }],
  ['a nested operator', { $or: [{ locked: true }, { count: { $mod: [2, 0] } }] }]
]

describe('abilities', () => {
  describe('create', () => {
    it('creates an ability without any permission by default', () => {
      expect(abilities.create().can('read', 'items')).toBe(false)
    })
    it.each([
      ['a string alias', { update: 'patch' }],
      ['an empty alias', { update: [] }]
    ])('rejects %s', (name, aliases) => {
      expect(() => abilities.create([], { aliases })).toThrow('invalid ability options')
    })
    it.each([
      ['null', null],
      ['a string', 'read items']
    ])('rejects a rule that is %s', (name, rule) => {
      expect(() => abilities.create([rule])).toThrow(new TypeError('rule must be an object'))
    })
    it.each([
      [{ action: 'remove', subjects: 'items' }, 'rule subject'],
      [{ action: [], subject: 'items' }, 'rule action'],
      [{ action: 'read', subject: ['items', ''] }, 'rule subject'],
      [{ action: 'read', subject: 'items', inverted: 'false' }, 'rule inverted'],
      [{ action: 'read', subject: 'items', fields: [] }, 'rule fields']
    ])('rejects malformed rules through create, build and update', (rule, message) => {
      const builder = abilities.createBuilder()
      builder.rules.push(rule)
      expect(() => abilities.create([rule])).toThrow(message)
      expect(() => builder.build()).toThrow(message)
      expect(() => abilities.update(abilities.create(), [rule])).toThrow(message)
    })
    it('copies the input rule array on creation and update', () => {
      const rules = [{ action: 'read', subject: 'items' }]
      const ability = abilities.create(rules)
      rules.pop()
      expect(ability.rules).toHaveLength(1)
      const replacement = [{ action: 'update', subject: 'items' }]
      abilities.update(ability, replacement)
      replacement.pop()
      expect(ability.rules).toHaveLength(1)
      expect(ability.can('update', 'items')).toBe(true)
    })
    it('rejects conditions that are not an object', () => {
      expect(() => abilities.create([{ action: 'read', subject: 'items', conditions: 'locked' }]))
        .toThrow(new TypeError('conditions must be an object'))
    })
    it('evaluates conditions on typed subjects', () => {
      const ability = abilities.create([{ action: 'update', subject: 'items', conditions: { ownerId: 'user-1' } }])
      expect(ability.can('update', item({ ownerId: 'user-1' }))).toBe(true)
      expect(ability.can('update', item({ ownerId: 'user-2' }))).toBe(false)
    })
    it('resolves configured aliases, nested ones included', () => {
      const ability = abilities.create([{ action: 'all', subject: 'items' }], { aliases })
      for (const action of ['read', 'get', 'find', 'create', 'update', 'patch', 'remove', 'delete']) {
        expect(ability.can(action, 'items')).toBe(true)
      }
      expect(ability.can('execute', 'items')).toBe(false)
    })
    it.each([
      ['$or', { $or: [{ locked: true }, { archived: true }] }],
      ['$and', { $and: [{ locked: true }, { archived: false }] }],
      ['$nor', { $nor: [{ locked: false }] }]
    ])('applies cannot rules written with %s', (name, conditions) => {
      const ability = abilities.create([
        { action: 'update', subject: 'items' },
        { action: 'update', subject: 'items', inverted: true, conditions }
      ])
      expect(ability.can('update', item({ locked: true, archived: false }))).toBe(false)
      expect(ability.can('update', item({ locked: false, archived: false }))).toBe(true)
    })
    it('evaluates nested logical operators in cannot rules', () => {
      const ability = abilities.create([
        { action: 'update', subject: 'items' },
        {
          action: 'update',
          subject: 'items',
          inverted: true,
          conditions: {
            $and: [
              { $or: [{ locked: true }, { archived: true }] },
              { $nor: [{ ownerId: 'user-1' }] }
            ]
          }
        }
      ])
      expect(ability.can('update', item({ locked: true, ownerId: 'user-2' }))).toBe(false)
      expect(ability.can('update', item({ archived: true, ownerId: 'user-2' }))).toBe(false)
      expect(ability.can('update', item({ locked: true, ownerId: 'user-1' }))).toBe(true)
      expect(ability.can('update', item({
        locked: false, archived: false, ownerId: 'user-2'
      }))).toBe(true)
    })
    it.each(unsupported)('rejects %s, which CASL would silently evaluate to false', (name, conditions) => {
      const rules = [
        { action: 'update', subject: 'items' },
        { action: 'update', subject: 'items', inverted: true, conditions }
      ]
      expect(() => abilities.create(rules)).toThrow(TypeError)
    })
    it.each(invalid)('rejects %s as soon as the ability is built', (name, conditions) => {
      expect(() => abilities.create([{ action: 'read', subject: 'items', conditions }])).toThrow(TypeError)
    })
    it('keeps the parser error as cause', () => {
      try {
        abilities.create([{ action: 'read', subject: 'items', conditions: { $or: 'invalid' } }])
        expect.unreachable()
      } catch (error) {
        expect(error.message).toMatch(/^invalid conditions: /)
        expect(error.cause).toBeInstanceOf(Error)
      }
    })
    it('compares ObjectId values without taking them for operators', () => {
      const id = new ObjectId()
      const ability = abilities.create([{ action: 'update', subject: 'users', conditions: { _id: { $in: [id] } } }])
      expect(ability.can('update', subject('users', { _id: new ObjectId(id.toHexString()) }))).toBe(true)
      expect(ability.can('update', subject('users', { _id: new ObjectId() }))).toBe(false)
    })
  })

  describe('createBuilder', () => {
    it('builds with the shared matcher and the configured aliases, once destructured', () => {
      const { can, cannot, build } = abilities.createBuilder({ aliases })
      can('update', 'items')
      cannot('update', 'items', { $or: [{ locked: true }, { archived: true }] })
      const ability = build()
      expect(ability.can('patch', item({ locked: false }))).toBe(true)
      expect(ability.can('patch', item({ archived: true }))).toBe(false)
    })
    it('gives precedence to the last matching rule', () => {
      const { can, cannot, build } = abilities.createBuilder()
      can('update', 'items')
      cannot('update', 'items', { locked: true })
      can('update', 'items', { ownerId: 'user-1' })
      const ability = build()
      expect(ability.can('update', item({ locked: true, ownerId: 'user-1' }))).toBe(true)
      expect(ability.can('update', item({ locked: true, ownerId: 'user-2' }))).toBe(false)
      expect(ability.can('update', item({ locked: false, ownerId: 'user-2' }))).toBe(true)
    })
    it('keeps fields restrictions', () => {
      const { can, build } = abilities.createBuilder()
      can('update', 'items', ['title'], { ownerId: 'user-1' })
      const ability = build()
      expect(ability.can('update', item({ ownerId: 'user-1' }), 'title')).toBe(true)
      expect(ability.can('update', item({ ownerId: 'user-1' }), 'ownerId')).toBe(false)
    })
    it('matches fields with patterns', () => {
      const { can, build } = abilities.createBuilder()
      can('update', 'items', ['meta.*'])
      const ability = build()
      expect(ability.can('update', item(), 'meta.title')).toBe(true)
      expect(ability.can('update', item(), 'title')).toBe(false)
    })
    it('rejects options given to build', () => {
      const { can, build } = abilities.createBuilder({ aliases })
      can('update', 'items')
      expect(() => build({ resolveAction: action => action })).toThrow('ability options must be passed to abilities.createBuilder')
      expect(build().can('patch', 'items')).toBe(true)
    })
    it.each([...unsupported, ...invalid])('rejects %s when building', (name, conditions) => {
      const { cannot, build } = abilities.createBuilder()
      cannot('update', 'items', conditions)
      expect(() => build()).toThrow(TypeError)
    })
    it('isolates the built ability from rules defined afterwards', () => {
      const { can, build } = abilities.createBuilder()
      can('read', 'items')
      const ability = build()
      can('remove', 'items')
      expect(ability.rules).toHaveLength(1)
      expect(ability.can('remove', 'items')).toBe(false)
    })
  })

  describe('defineRoleAbilities', () => {
    function createRoles () {
      const roles = new RoleRegistry()
      roles.register('member', {})
      roles.register('manager', { inherits: ['member'] })
      return roles
    }
    const definitions = {
      member: ({ can }) => can('read', 'items'),
      manager: ({ can, cannot }) => {
        can('update', 'items')
        cannot('update', 'items', { locked: true })
      }
    }
    it('defines the rules of every resolved role', async () => {
      const builder = abilities.createBuilder()
      expect(await abilities.defineRoleAbilities(builder, createRoles(), 'manager', definitions)).toBeUndefined()
      const ability = builder.build()
      expect(ability.can('read', item())).toBe(true)
      expect(ability.can('update', item({ locked: false }))).toBe(true)
      expect(ability.can('update', item({ locked: true }))).toBe(false)
    })
    it('scopes the rules with an object or an asynchronous function', async () => {
      const builder = abilities.createBuilder()
      await abilities.defineRoleAbilities(builder, createRoles(), ['member'], definitions, { context: 'org-1' })
      await abilities.defineRoleAbilities(builder, createRoles(), ['manager'], definitions, async rule => ({ context: `org-2-${rule.action}` }))
      const ability = builder.build()
      expect(ability.can('read', item({ context: 'org-1' }))).toBe(true)
      expect(ability.can('read', item({ context: 'org-3' }))).toBe(false)
      expect(ability.can('update', item({ context: 'org-2-update' }))).toBe(true)
      expect(ability.can('update', item({ context: 'org-2-update', locked: true }))).toBe(false)
    })
    it('awaits definitions in inheritance order', async () => {
      const builder = abilities.createBuilder()
      await abilities.defineRoleAbilities(builder, createRoles(), 'manager', {
        member: async ({ can }) => {
          await Promise.resolve()
          can('read', 'items')
        },
        manager: ({ cannot }) => cannot('read', 'items', { locked: true })
      })
      expect(builder.build().can('read', item({ locked: true }))).toBe(false)
      expect(builder.build().can('read', item({ locked: false }))).toBe(true)
    })
    it('serializes overlapping calls and rejects direct writes while they are pending', async () => {
      const builder = abilities.createBuilder()
      const roles = createRoles()
      const first = abilities.defineRoleAbilities(builder, roles, 'member', definitions, async () => ({ context: 'org-1' }))
      const second = abilities.defineRoleAbilities(builder, roles, 'member', {
        member: ({ cannot }) => cannot('read', 'items')
      }, { context: 'org-1' })
      expect(() => builder.can('update', 'items')).toThrow('role abilities must finish')
      expect(() => builder.cannot('read', 'items')).toThrow('role abilities must finish')
      expect(() => builder.build()).toThrow('role abilities must finish')
      await Promise.all([first, second])
      expect(builder.build().can('read', item({ context: 'org-1' }))).toBe(false)
      expect(builder.rules.map(rule => rule.conditions)).toEqual([{ context: 'org-1' }, { context: 'org-1' }])
      builder.can('read', 'items')
      expect(builder.build().can('read', item({ context: 'org-1' }))).toBe(true)
    })
    it.each([[undefined], [null], [{}], [[]], [{ context: undefined }], [{ context: null }]])('rejects an invalid dynamic scope %j', async scope => {
      const builder = abilities.createBuilder()
      await expect(abilities.defineRoleAbilities(builder, createRoles(), 'member', definitions, async () => scope))
        .rejects.toThrow('scope must return non-empty conditions')
      expect(builder.rules).toEqual([])
    })
    it.each([{}, { context: undefined }, { context: { $in: [undefined] } }])('rejects an invalid static scope %j', async scope => {
      const builder = abilities.createBuilder()
      await expect(abilities.defineRoleAbilities(builder, createRoles(), 'member', definitions, scope)).rejects.toThrow(TypeError)
      expect(builder.rules).toEqual([])
    })
    it('preserves the original rule when a scope returns UNSCOPED', async () => {
      const builder = abilities.createBuilder()
      await abilities.defineRoleAbilities(builder, createRoles(), 'member', {
        member: ({ can }) => can('read', 'items', { locked: false })
      }, async rule => {
        rule.action = 'update'
        rule.conditions.locked = true
        return UNSCOPED
      })
      const ability = builder.build()
      expect(ability.can('read', item({ locked: false }))).toBe(true)
      expect(ability.can('read', item({ locked: true }))).toBe(false)
      expect(ability.can('update', item({ locked: false }))).toBe(false)
    })
    it('accepts UNSCOPED as a static scope', async () => {
      const builder = abilities.createBuilder()
      await abilities.defineRoleAbilities(builder, createRoles(), 'member', definitions, UNSCOPED)
      expect(builder.build().can('read', item())).toBe(true)
    })
    it('reports unawaited nested role definitions', async () => {
      const builder = abilities.createBuilder()
      const roles = createRoles()
      const { promise, resolve } = Promise.withResolvers()
      let nested
      await expect(abilities.defineRoleAbilities(builder, roles, 'member', {
        member: staged => {
          nested = abilities.defineRoleAbilities(staged, roles, 'member', {
            member: async ({ can }) => {
              await promise
              can('read', 'items')
            }
          })
        }
      })).rejects.toThrow('role definitions must await nested role abilities')
      resolve()
      await nested
      expect(builder.build().rules).toEqual([])
    })
    it.each([[['member', 'manager']], [['manager', 'member']]])('gives the scoped descendant priority for %j', async names => {
      const builder = abilities.createBuilder()
      await abilities.defineRoleAbilities(builder, createRoles(), names, {
        member: ({ cannot }) => cannot('remove', 'items'),
        manager: ({ can }) => can('remove', 'items')
      }, { organization: 'A' })
      const ability = builder.build()
      expect(ability.can('remove', item({ organization: 'A' }))).toBe(true)
      expect(ability.can('remove', item({ organization: 'B' }))).toBe(false)
    })
    it('snapshots a static scope with BSON values and intersects overlapping conditions', async () => {
      const builder = abilities.createBuilder()
      const id = new ObjectId()
      const other = new ObjectId()
      const scope = { context: { $in: [id] } }
      const pending = abilities.defineRoleAbilities(builder, createRoles(), 'member', {
        member: ({ can }) => can('read', 'items', { context: { $in: [id, other] } })
      }, scope)
      scope.context.$in.push(other)
      await pending
      const ability = builder.build()
      expect(ability.can('read', item({ context: new ObjectId(id.toHexString()) }))).toBe(true)
      expect(ability.can('read', item({ context: other }))).toBe(false)
    })
    it('uses input order to break precedence between unrelated roles', async () => {
      const registry = createRoles()
      registry.register('admin', {})
      const definitions = {
        admin: ({ can }) => can('remove', 'items'),
        member: ({ cannot }) => cannot('remove', 'items')
      }
      const denied = abilities.createBuilder()
      const allowed = abilities.createBuilder()
      await abilities.defineRoleAbilities(denied, registry, ['admin', 'member'], definitions)
      await abilities.defineRoleAbilities(allowed, registry, ['member', 'admin'], definitions)
      expect(denied.build().can('remove', 'items')).toBe(false)
      expect(allowed.build().can('remove', 'items')).toBe(true)
    })
    it('rejects foreign builders and malformed role selections', async () => {
      await expect(abilities.defineRoleAbilities(new AbilityBuilder(createMongoAbility), createRoles(), 'member', definitions))
        .rejects.toThrow('builder must be created by abilities.createBuilder')
      await expect(abilities.defineRoleAbilities(abilities.createBuilder(), createRoles(), [''], definitions))
        .rejects.toThrow('roles must be a non-empty string or an array of role names')
    })
    const failure = new Error('failure')
    it.each([
      ['definition', {
        member: async ({ can }) => {
          can('read', 'items')
          throw failure
        }
      }, undefined],
      ['scope', definitions, async () => { throw failure }]
    ])('propagates a failing asynchronous %s without adding partial rules', async (name, roleDefinitions, scope) => {
      const builder = abilities.createBuilder()
      await expect(abilities.defineRoleAbilities(builder, createRoles(), 'member', roleDefinitions, scope))
        .rejects.toBe(failure)
      expect(builder.build().rules).toEqual([])
    })
  })

  describe('update', () => {
    it('applies new rules to the same instance, with its options', () => {
      const ability = abilities.create([{ action: 'read', subject: 'items' }], { aliases })
      expect(abilities.update(ability, [{ action: 'update', subject: 'items' }])).toBe(ability)
      expect(ability.can('get', 'items')).toBe(false)
      expect(ability.can('patch', 'items')).toBe(true)
    })
    it('preserves custom condition and field matchers', () => {
      const ability = abilities.create()
      abilities.update(ability, [
        {
          action: 'update',
          subject: 'items',
          fields: ['meta.*'],
          conditions: {
            $or: [{ public: true }, { ownerId: 'user-1' }]
          }
        }
      ])
      expect(ability.can('update', item({ public: true }), 'meta.title')).toBe(true)
      expect(ability.can('update', item({ ownerId: 'user-1' }), 'meta.title')).toBe(true)
      expect(ability.can('update', item({ ownerId: 'user-2' }), 'meta.title')).toBe(false)
      expect(ability.can('update', item({ public: true }), 'ownerId')).toBe(false)
    })
    it('leaves the ability unchanged when the rules are rejected', () => {
      const ability = abilities.create([{ action: 'read', subject: 'items' }])
      const rules = [{ action: 'read', subject: 'items', inverted: true, conditions: { count: { $mod: [2, 0] } } }]
      expect(() => abilities.update(ability, rules)).toThrow(TypeError)
      expect(ability.can('read', 'items')).toBe(true)
    })
    it('rejects abilities created outside the package', () => {
      expect(() => abilities.update(createMongoAbility(), [])).toThrow('ability must be created by abilities.create or abilities.createBuilder')
    })
  })

  describe('serialized rules', () => {
    it('give the client the same decisions as the server', () => {
      const { can, cannot, build } = abilities.createBuilder({ aliases })
      can('read', 'items', { $or: [{ public: true }, { ownerId: 'user-1' }] })
      can('update', 'items', { ownerId: 'user-1' })
      cannot('update', 'items', { locked: true })
      const server = build()
      const client = abilities.create(JSON.parse(JSON.stringify(server.rules)), { aliases })
      const checks = [
        ['find', item({ public: true })],
        ['find', item({ ownerId: 'user-2' })],
        ['patch', item({ ownerId: 'user-1' })],
        ['patch', item({ ownerId: 'user-1', locked: true })]
      ]
      for (const [action, resource] of checks) {
        expect(client.can(action, resource)).toBe(server.can(action, resource))
      }
    })
  })

  describe('mergeConditions', () => {
    it('returns undefined when there is no condition at all', () => {
      expect(abilities.mergeConditions()).toBeUndefined()
      expect(abilities.mergeConditions({}, null)).toBeUndefined()
    })
    it('returns a copy of the only non-empty side', () => {
      const conditions = { ownerId: 'user-1' }
      expect(abilities.mergeConditions(conditions, {})).toEqual(conditions)
      expect(abilities.mergeConditions(undefined, conditions)).toEqual(conditions)
      expect(abilities.mergeConditions(undefined, conditions)).not.toBe(conditions)
    })
    it('merges disjoint keys', () => {
      expect(abilities.mergeConditions({ locked: false }, { organizationId: 'org-1' }))
        .toEqual({ locked: false, organizationId: 'org-1' })
    })
    it.each([
      ['a field', { context: 'org-1' }, { context: 'org-2' }],
      ['an operator', { $or: [{ public: true }, { ownerId: 'user-1' }] }, { $or: [{ context: 'org-1' }, { context: 'org-2' }] }]
    ])('nests both sides in $and when they share %s', (name, left, right) => {
      expect(abilities.mergeConditions(left, right)).toEqual({ $and: [left, right] })
    })
    it('never mutates its arguments', () => {
      const left = { locked: false }
      const right = { organizationId: 'org-1' }
      abilities.mergeConditions(left, right)
      expect(left).toEqual({ locked: false })
      expect(right).toEqual({ organizationId: 'org-1' })
    })
    it('keeps both constraints on a shared field', () => {
      const conditions = abilities.mergeConditions({ age: { $gte: 18 } }, { age: { $lte: 65 } })
      const ability = abilities.create([{ action: 'read', subject: 'items', conditions }])
      expect(ability.can('read', item({ age: 30 }))).toBe(true)
      expect(ability.can('read', item({ age: 10 }))).toBe(false)
      expect(ability.can('read', item({ age: 70 }))).toBe(false)
    })
    it('combines logical operators with regular conditions', () => {
      const conditions = abilities.mergeConditions(
        { $or: [{ public: true }, { ownerId: 'user-1' }] },
        { locked: false }
      )
      const ability = abilities.create([{ action: 'update', subject: 'items', conditions }])
      expect(ability.can('update', item({ public: true, locked: false }))).toBe(true)
      expect(ability.can('update', item({ public: true, locked: true }))).toBe(false)
      expect(ability.can('update', item({
        public: false, locked: false, ownerId: 'user-2'
      }))).toBe(false)
    })
    it('produces conditions evaluated by the shared matcher', () => {
      const conditions = abilities.mergeConditions(
        { $or: [{ public: true }, { ownerId: 'user-1' }] },
        { $or: [{ context: 'org-1' }, { context: 'org-2' }] }
      )
      const ability = abilities.create([{ action: 'read', subject: 'items', conditions }])
      expect(ability.can('read', item({ public: true, context: 'org-2' }))).toBe(true)
      expect(ability.can('read', item({ public: true, context: 'org-3' }))).toBe(false)
    })
  })

  describe('in production', () => {
    afterEach(() => {
      vi.unstubAllEnvs()
      vi.resetModules()
    })
    it.each([...unsupported, ...invalid])('still rejects %s, while assertions are disabled', async (name, conditions) => {
      vi.stubEnv('NODE_ENV', 'production')
      vi.resetModules()
      const { abilities: production } = await import('../../src/utilities/abilities.js')
      // Control: this assertion is skipped, so the production code path is really exercised
      expect(() => production.create([], { aliases: { update: 'patch' } })).not.toThrow()
      const rules = [{ action: 'update', subject: 'items', inverted: true, conditions }]
      expect(() => production.create(rules)).toThrow(TypeError)

      const { cannot, build } = production.createBuilder()
      cannot('update', 'items', conditions)
      expect(() => build()).toThrow(TypeError)

      const ability = production.create([{ action: 'update', subject: 'items' }])
      expect(() => production.update(ability, rules)).toThrow(TypeError)
      expect(ability.can('update', 'items')).toBe(true)
    })
    it('still validates asynchronous scopes, while assertions are disabled', async () => {
      vi.stubEnv('NODE_ENV', 'production')
      vi.resetModules()
      const { abilities: production } = await import('../../src/utilities/abilities.js')
      const roles = new RoleRegistry()
      roles.register('member', {})
      await expect(production.defineRoleAbilities(production.createBuilder(), roles, 'member', {
        member: ({ can }) => can('read', 'items')
      }, async () => [])).rejects.toThrow(TypeError)
    })
  })
})
