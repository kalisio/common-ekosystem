import { Ability } from '@casl/ability'
import { ObjectId } from 'mongodb'
import { Authorization, RoleRegistry } from '../../src/runtime/index.js'
import { permissions } from '../../src/utilities/index.js'

const aliases = { update: ['patch'], read: ['get', 'find'] }
const key = principal => principal?._id ?? 'anonymous'

const user = {
  _id: 'user-1',
  organizations: [
    { _id: 'org-1', role: 'manager' },
    { _id: 'org-2', role: 'member' }
  ]
}
const otherUser = { _id: 'user-2', organizations: [] }

// Registers the roles and a hook scoping them to each organization of the principal
function createAuthorization (options = {}) {
  const authorization = new Authorization({ aliases, ...options })
  authorization.roles.register('member', {})
  authorization.roles.register('manager', { inherits: ['member'] })
  const hook = vi.fn(async (principal, { defineRoleAbilities }) => {
    for (const organization of principal?.organizations ?? []) {
      await defineRoleAbilities(organization.role, {
        member: ({ can }) => can('read', 'items'),
        manager: ({ can }) => can('update', 'items')
      }, { context: organization._id })
    }
  })
  authorization.registerHook('organizations', hook)
  return { authorization, hook }
}

describe('Authorization', () => {
  describe('constructor', () => {
    it('owns its role registry', () => {
      const authorization = new Authorization()
      expect(authorization.roles).toBeInstanceOf(RoleRegistry)
      expect(authorization.roles).not.toBe(new Authorization().roles)
    })
    it.each([
      ['a cache without key', { cache: { max: 10 } }, 'invalid authorization options'],
      ['invalid aliases', { aliases: { update: 'patch' } }, 'invalid ability options'],
      ['an invalid cache size', { cache: { key, max: 0 } }, 'max must be a positive integer or Infinity']
    ])('rejects %s', (name, options, message) => {
      expect(() => new Authorization(options)).toThrow(message)
    })
  })

  describe('hooks', () => {
    it('receive the principal, the functions to define rules and the context', async () => {
      const authorization = new Authorization()
      const hook = vi.fn()
      authorization.registerHook('test', hook)
      await authorization.defineAbility(user, { organizationId: 'org-1' })
      const [principal, definitions, context] = hook.mock.calls[0]
      expect(principal).toBe(user)
      expect(Object.keys(definitions)).toEqual(['can', 'cannot', 'defineRoleAbilities'])
      expect(context).toEqual({ organizationId: 'org-1' })
    })
    it('run in registration order, each one once the previous one has completed', async () => {
      const authorization = new Authorization()
      const calls = []
      authorization.registerHook('first', async () => {
        await new Promise(resolve => setTimeout(resolve, 10))
        calls.push('first')
      })
      authorization.registerHook('second', () => calls.push('second'))
      await authorization.defineAbility(user)
      expect(calls).toEqual(['first', 'second'])
    })
    it('take precedence over the hooks registered before them', async () => {
      const authorization = new Authorization()
      authorization.registerHook('grant', (principal, { can }) => can('read', 'items'))
      authorization.registerHook('deny', (principal, { cannot }) => cannot('read', 'items'))
      expect((await authorization.defineAbility(user)).can('read', 'items')).toBe(false)
    })
    it('registered while hooks run only apply to the next abilities', async () => {
      const authorization = new Authorization()
      const late = vi.fn()
      let registered = false
      authorization.registerHook('first', () => {
        if (registered) return
        registered = true
        authorization.registerHook('late', late)
      })
      await authorization.defineAbility(user)
      expect(late).not.toHaveBeenCalled()
      await authorization.defineAbility(user)
      expect(late).toHaveBeenCalledTimes(1)
    })
    it('cannot be registered twice under the same name', () => {
      const { authorization } = createAuthorization()
      expect(() => authorization.registerHook('organizations', () => {})).toThrow('entry already registered: organizations')
    })
    it('no longer run once unregistered', async () => {
      const { authorization, hook } = createAuthorization()
      expect(authorization.unregisterHook('organizations')).toBe(true)
      expect(authorization.unregisterHook('organizations')).toBe(false)
      await authorization.defineAbility(user)
      expect(hook).not.toHaveBeenCalled()
    })
    it('reject a hook that is not a function', () => {
      expect(() => new Authorization().registerHook('test', {})).toThrow('hook must be a function')
    })
  })

  describe('defineAbility', () => {
    it('builds a new ability on every call', async () => {
      const { authorization, hook } = createAuthorization()
      const first = await authorization.defineAbility(user)
      const second = await authorization.defineAbility(user)
      expect(first).toBeInstanceOf(Ability)
      expect(first).not.toBe(second)
      expect(hook).toHaveBeenCalledTimes(2)
    })
    it('scopes role abilities to each organization, with the configured aliases', async () => {
      const { authorization } = createAuthorization()
      const ability = await authorization.defineAbility(user)
      expect(permissions.can(ability, 'patch', 'items', { context: 'org-1' })).toBe(true)
      expect(permissions.can(ability, 'find', 'items', { context: 'org-1' })).toBe(true)
      expect(permissions.can(ability, 'patch', 'items', { context: 'org-2' })).toBe(false)
      expect(permissions.can(ability, 'find', 'items', { context: 'org-2' })).toBe(true)
      expect(permissions.cannot(ability, 'find', 'items', { context: 'org-3' })).toBe(true)
    })
    it('keeps a restriction inherited through a diamond', async () => {
      const authorization = new Authorization()
      authorization.roles.register('member', {})
      authorization.roles.register('editor', { inherits: ['member'] })
      authorization.roles.register('reviewer', { inherits: ['member'] })
      authorization.roles.register('manager', { inherits: ['editor', 'reviewer'] })
      authorization.registerHook('items', (principal, { defineRoleAbilities }) => defineRoleAbilities('manager', {
        member: ({ can }) => can('update', 'items'),
        editor: ({ cannot }) => cannot('update', 'items', { locked: true }),
        reviewer: ({ can }) => can('review', 'items')
      }))
      const ability = await authorization.defineAbility(user)
      // Repeating member after editor would grant again what editor restricts
      expect(permissions.can(ability, 'update', 'items', { locked: true })).toBe(false)
      expect(permissions.can(ability, 'update', 'items', { locked: false })).toBe(true)
      expect(permissions.can(ability, 'review', 'items', { locked: true })).toBe(true)
    })
    it('defines the abilities of an anonymous principal', async () => {
      const { authorization } = createAuthorization()
      authorization.registerHook('public', (principal, { can }) => can('read', 'publications'))
      const ability = await authorization.defineAbility(null)
      expect(ability.can('read', 'publications')).toBe(true)
      expect(ability.can('read', 'items')).toBe(false)
    })
    it('fails when a hook does', async () => {
      const { authorization } = createAuthorization()
      authorization.registerHook('failing', () => { throw new Error('hook failure') })
      await expect(authorization.defineAbility(user)).rejects.toThrow('hook failure')
    })
    it('fails on a role unknown to the registry', async () => {
      const { authorization } = createAuthorization()
      await expect(authorization.defineAbility({ organizations: [{ _id: 'org-1', role: 'admin' }] }))
        .rejects.toThrow(new TypeError('unknown role: admin'))
    })
    it('rejects a context that is not an object', async () => {
      await expect(new Authorization().defineAbility(user, 'org-1')).rejects.toThrow('context must be an object')
    })
  })

  describe('getAbility without cache', () => {
    it('defines a new ability on every call', async () => {
      const { authorization, hook } = createAuthorization()
      await authorization.getAbility(user)
      await authorization.getAbility(user)
      expect(hook).toHaveBeenCalledTimes(2)
      expect(authorization.invalidateAbility(user)).toBe(false)
      expect(() => authorization.clearAbilities()).not.toThrow()
    })
  })

  describe('getAbility with cache', () => {
    afterEach(() => {
      vi.useRealTimers()
    })
    it('computes the rules once per key', async () => {
      const { authorization, hook } = createAuthorization({ cache: { key } })
      await authorization.getAbility(user)
      await authorization.getAbility(user)
      await authorization.getAbility(otherUser)
      expect(hook).toHaveBeenCalledTimes(2)
    })
    it('returns a new ability on every call, which may be altered without affecting the others', async () => {
      const { authorization } = createAuthorization({ cache: { key } })
      const first = await authorization.getAbility(user)
      const second = await authorization.getAbility(user)
      expect(first).toBeInstanceOf(Ability)
      expect(first).not.toBe(second)
      first.update([])
      expect(first.can('find', 'items')).toBe(false)
      expect(permissions.can(await authorization.getAbility(user), 'patch', 'items', { context: 'org-1' })).toBe(true)
    })
    it('gives every ability its own copy of the rules, isolated from the hooks', async () => {
      const authorization = new Authorization({ cache: { key } })
      const principal = { _id: 'user-1', organizationIds: ['org-1', 'org-2'] }
      authorization.registerHook('items', ({ organizationIds }, { can }) => {
        can('read', 'items', { context: { $in: organizationIds } })
      })
      const first = await authorization.getAbility(principal)
      expect(Object.isFrozen(first.rules)).toBe(false)
      first.rules[0].conditions.context.$in.push('org-3')
      principal.organizationIds.push('org-4')
      const second = await authorization.getAbility(principal)
      expect(second.rules[0].conditions.context.$in).toEqual(['org-1', 'org-2'])
    })
    it('keeps the aliases given at construction', async () => {
      const aliases = { update: ['patch'] }
      const authorization = new Authorization({ aliases, cache: { key } })
      authorization.registerHook('items', (principal, { can }) => can('update', 'items'))
      aliases.update.push('replace')
      expect((await authorization.defineAbility(user)).can('replace', 'items')).toBe(false)
      expect((await authorization.getAbility(user)).can('replace', 'items')).toBe(false)
      expect((await authorization.getAbility(user)).can('patch', 'items')).toBe(true)
    })
    it('validates the context even when the rules are cached', async () => {
      const { authorization } = createAuthorization({ cache: { key } })
      await authorization.getAbility(user)
      await expect(authorization.getAbility(user, 'org-1')).rejects.toThrow('context must be an object')
      expect(() => authorization.invalidateAbility(user, 'org-1')).toThrow('context must be an object')
    })
    it('keeps values such as ObjectId comparable', async () => {
      const authorization = new Authorization({ cache: { key } })
      const id = new ObjectId()
      authorization.registerHook('users', (principal, { can }) => can('update', 'users', { _id: id }))
      const ability = await authorization.getAbility(user)
      expect(permissions.can(ability, 'update', 'users', { _id: new ObjectId(id.toHexString()) })).toBe(true)
      expect(permissions.can(ability, 'update', 'users', { _id: new ObjectId() })).toBe(false)
    })
    it('shares a computation between concurrent calls', async () => {
      const { authorization, hook } = createAuthorization({ cache: { key } })
      const abilities = await Promise.all([1, 2, 3].map(() => authorization.getAbility(user)))
      expect(hook).toHaveBeenCalledTimes(1)
      expect(new Set(abilities).size).toBe(3)
    })
    it('recomputes the rules once roles change', async () => {
      const { authorization, hook } = createAuthorization({ cache: { key } })
      await authorization.getAbility(user)
      authorization.roles.register('owner', { inherits: ['manager'] })
      await authorization.getAbility(user)
      expect(hook).toHaveBeenCalledTimes(2)
    })
    it('recomputes the rules once hooks change', async () => {
      const { authorization, hook } = createAuthorization({ cache: { key } })
      await authorization.getAbility(user)
      authorization.registerHook('public', (principal, { can }) => can('read', 'publications'))
      const ability = await authorization.getAbility(user)
      expect(hook).toHaveBeenCalledTimes(2)
      expect(ability.can('read', 'publications')).toBe(true)
    })
    it('recomputes the rules of an invalidated principal only', async () => {
      const { authorization, hook } = createAuthorization({ cache: { key } })
      await authorization.getAbility(user)
      await authorization.getAbility(otherUser)
      expect(authorization.invalidateAbility(user)).toBe(true)
      expect(authorization.invalidateAbility(user)).toBe(false)
      await authorization.getAbility(user)
      await authorization.getAbility(otherUser)
      expect(hook).toHaveBeenCalledTimes(3)
    })
    it('recomputes every rules once cleared', async () => {
      const { authorization, hook } = createAuthorization({ cache: { key } })
      await authorization.getAbility(user)
      await authorization.getAbility(otherUser)
      authorization.clearAbilities()
      await authorization.getAbility(user)
      await authorization.getAbility(otherUser)
      expect(hook).toHaveBeenCalledTimes(4)
    })
    it('does not cache a failure', async () => {
      const { authorization, hook } = createAuthorization({ cache: { key } })
      hook.mockRejectedValueOnce(new Error('hook failure'))
      await expect(authorization.getAbility(user)).rejects.toThrow('hook failure')
      await expect(authorization.getAbility(user)).resolves.toBeInstanceOf(Ability)
      expect(hook).toHaveBeenCalledTimes(2)
    })
    it('keeps a newer computation when an invalidated one fails', async () => {
      const authorization = new Authorization({ cache: { key } })
      // Promises resolved from the outside, to control when each call of the hook completes
      const gates = [Promise.withResolvers(), Promise.withResolvers()]
      let calls = 0
      authorization.registerHook('slow', async () => {
        const call = calls++
        await gates[call].promise
        if (call === 0) throw new Error('first failure')
      })
      const first = authorization.getAbility(user)
      authorization.invalidateAbility(user)
      const second = authorization.getAbility(user)
      gates[0].resolve()
      await expect(first).rejects.toThrow('first failure')
      gates[1].resolve()
      await expect(second).resolves.toBeInstanceOf(Ability)
      await authorization.getAbility(user)
      expect(calls).toBe(2)
    })
    it('expires the rules after the ttl', async () => {
      vi.useFakeTimers({ toFake: ['Date'] })
      const { authorization, hook } = createAuthorization({ cache: { key, ttl: 1000 } })
      await authorization.getAbility(user)
      vi.setSystemTime(Date.now() + 999)
      await authorization.getAbility(user)
      vi.setSystemTime(Date.now() + 2)
      await authorization.getAbility(user)
      expect(hook).toHaveBeenCalledTimes(2)
    })
    it('evicts the least recently used rules', async () => {
      const { authorization, hook } = createAuthorization({ cache: { key, max: 1 } })
      await authorization.getAbility(user)
      await authorization.getAbility(otherUser)
      await authorization.getAbility(user)
      expect(hook).toHaveBeenCalledTimes(3)
    })
    it('isolates cached rules by context when the key includes it', async () => {
      const authorization = new Authorization({
        cache: { key: (principal, context) => JSON.stringify([principal._id, context.organizationId]) }
      })
      const hook = vi.fn((principal, { can }, context) => {
        can('read', 'items', { context: context.organizationId })
      })
      authorization.registerHook('items', hook)
      const firstContext = { organizationId: 'org-1' }
      const secondContext = { organizationId: 'org-2' }
      const first = await authorization.getAbility(user, firstContext)
      const second = await authorization.getAbility(user, secondContext)
      expect(permissions.can(first, 'read', 'items', { context: 'org-1' })).toBe(true)
      expect(permissions.can(first, 'read', 'items', { context: 'org-2' })).toBe(false)
      expect(permissions.can(second, 'read', 'items', { context: 'org-2' })).toBe(true)
      expect(permissions.can(second, 'read', 'items', { context: 'org-1' })).toBe(false)
      expect(authorization.invalidateAbility(user, firstContext)).toBe(true)
      await authorization.getAbility(user, secondContext)
      expect(hook).toHaveBeenCalledTimes(2)
      await authorization.getAbility(user, firstContext)
      expect(hook).toHaveBeenCalledTimes(3)
    })
    it('recomputes permissions after a role inheritance changes', async () => {
      const { authorization, hook } = createAuthorization({ cache: { key } })
      const before = await authorization.getAbility(user)
      expect(permissions.can(before, 'find', 'items', { context: 'org-1' })).toBe(true)
      authorization.roles.replace('manager', { inherits: [] })
      const after = await authorization.getAbility(user)
      expect(permissions.can(after, 'find', 'items', { context: 'org-1' })).toBe(false)
      expect(permissions.can(after, 'patch', 'items', { context: 'org-1' })).toBe(true)
      expect(permissions.can(after, 'find', 'items', { context: 'org-2' })).toBe(true)
      expect(hook).toHaveBeenCalledTimes(2)
    })
    it('recomputes permissions after a hook is removed', async () => {
      const { authorization, hook } = createAuthorization({ cache: { key } })
      expect((await authorization.getAbility(user)).can('find', 'items')).toBe(true)
      expect(authorization.unregisterHook('organizations')).toBe(true)
      expect((await authorization.getAbility(user)).can('find', 'items')).toBe(false)
      expect(hook).toHaveBeenCalledTimes(1)
    })
    it('preserves dates and regular expressions when cloning rules', async () => {
      const authorization = new Authorization({ cache: { key } })
      const date = new Date('2026-11-20T10:00:00Z')
      const pattern = /^public-/i
      authorization.registerHook('items', (principal, { can }) => {
        can('read', 'items', { createdAt: { $gte: date }, name: { $regex: pattern } })
      })
      const first = await authorization.getAbility(user)
      const second = await authorization.getAbility(user)
      const conditions = first.rules[0].conditions
      expect(conditions.createdAt.$gte).toBeInstanceOf(Date)
      expect(conditions.name.$regex).toBeInstanceOf(RegExp)
      expect(conditions.createdAt.$gte).not.toBe(date)
      expect(conditions.createdAt.$gte).not.toBe(second.rules[0].conditions.createdAt.$gte)
      expect(conditions.name.$regex).not.toBe(second.rules[0].conditions.name.$regex)
      expect(conditions.name.$regex.flags).toBe('i')
      conditions.createdAt.$gte.setUTCFullYear(2030)
      const third = await authorization.getAbility(user)
      expect(permissions.can(third, 'read', 'items', {
        createdAt: new Date('2026-11-21T10:00:00Z'), name: 'PUBLIC-item'
      })).toBe(true)
      expect(permissions.can(third, 'read', 'items', {
        createdAt: new Date('2026-11-19T10:00:00Z'), name: 'PUBLIC-item'
      })).toBe(false)
      expect(permissions.can(third, 'read', 'items', {
        createdAt: new Date('2026-11-21T10:00:00Z'), name: 'private-item'
      })).toBe(false)
    })
    it('isolates ObjectId values across cached abilities', async () => {
      const authorization = new Authorization({ cache: { key } })
      const id = new ObjectId()
      authorization.registerHook('users', (principal, { can }) => can('read', 'users', { _id: id }))
      const first = await authorization.getAbility(user)
      const second = await authorization.getAbility(user)
      const firstId = first.rules[0].conditions._id
      const secondId = second.rules[0].conditions._id
      expect(firstId).toBeInstanceOf(ObjectId)
      expect(firstId).not.toBe(id)
      expect(firstId).not.toBe(secondId)
      expect(firstId.toHexString()).toBe(id.toHexString())
      firstId.id[0] ^= 255
      expect(secondId.toHexString()).toBe(id.toHexString())
      expect((await authorization.getAbility(user)).rules[0].conditions._id.toHexString()).toBe(id.toHexString())
    })
    it('does not restore invalidated rules when an older computation completes', async () => {
      const authorization = new Authorization({ cache: { key } })
      const gate = Promise.withResolvers()
      const started = Promise.withResolvers()
      let granted = true
      const hook = vi.fn(async (principal, { can }) => {
        const allowed = granted
        if (allowed) {
          started.resolve()
          await gate.promise
          can('read', 'items')
        }
      })
      authorization.registerHook('items', hook)
      const first = authorization.getAbility(user)
      await started.promise
      granted = false
      expect(authorization.invalidateAbility(user)).toBe(true)
      const second = await authorization.getAbility(user)
      gate.resolve()
      expect((await first).can('read', 'items')).toBe(true)
      expect(second.can('read', 'items')).toBe(false)
      expect((await authorization.getAbility(user)).can('read', 'items')).toBe(false)
      expect(hook).toHaveBeenCalledTimes(2)
    })
    it('refreshes the recency of a cached entry when accessed', async () => {
      const { authorization, hook } = createAuthorization({ cache: { key, max: 2 } })
      const thirdUser = { _id: 'user-3', organizations: [] }
      await authorization.getAbility(user)
      await authorization.getAbility(otherUser)
      await authorization.getAbility(user)
      await authorization.getAbility(thirdUser)
      await authorization.getAbility(user)
      expect(hook).toHaveBeenCalledTimes(3)
      await authorization.getAbility(otherUser)
      expect(hook).toHaveBeenCalledTimes(4)
    })
    it('rejects a key that is not a string', async () => {
      const authorization = new Authorization({ cache: { key: principal => principal._id } })
      await expect(authorization.getAbility({ _id: new ObjectId() }))
        .rejects.toThrow('cache key must be a non-empty string')
      expect(() => authorization.invalidateAbility({ _id: new ObjectId() })).toThrow('cache key must be a non-empty string')
    })
  })
})
