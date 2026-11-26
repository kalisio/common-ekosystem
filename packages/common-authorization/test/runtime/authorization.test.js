import { Ability } from '@casl/ability'
import { ObjectId } from 'mongodb'
import { Authorization, RoleRegistry } from '../../src/runtime/index.js'
import { permissions } from '../../src/utilities/index.js'

const aliases = { update: ['patch'], read: ['get', 'find'] }
const key = actor => actor?._id ?? 'anonymous'

const user = {
  _id: 'user-1',
  organizations: [
    { _id: 'org-1', role: 'manager' },
    { _id: 'org-2', role: 'member' }
  ]
}
const otherUser = { _id: 'user-2', organizations: [] }

// Registers the roles and a hook scoping them to each organization of the actor
function createAuthorization (options = {}) {
  const authorization = new Authorization({ aliases, ...options })
  authorization.roles.register('member', {})
  authorization.roles.register('manager', { inherits: ['member'] })
  const hook = vi.fn((actor, { defineRoleAbilities }) => {
    for (const organization of actor?.organizations ?? []) {
      defineRoleAbilities(organization.role, {
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
    it('receive the actor, the functions to define rules and the context', () => {
      const authorization = new Authorization()
      const hook = vi.fn()
      authorization.registerHook('test', hook)
      authorization.defineAbility(user, { organizationId: 'org-1' })
      const [actor, definitions, context] = hook.mock.calls[0]
      expect(actor).toBe(user)
      expect(Object.keys(definitions)).toEqual(['can', 'cannot', 'defineRoleAbilities'])
      expect(context).toEqual({ organizationId: 'org-1' })
    })
    it('run in registration order', () => {
      const authorization = new Authorization()
      const calls = []
      authorization.registerHook('first', () => { calls.push('first') })
      authorization.registerHook('second', () => { calls.push('second') })
      authorization.defineAbility(user)
      expect(calls).toEqual(['first', 'second'])
    })
    it.each([
      ['an asynchronous hook', async (actor, { can }) => can('read', 'items')],
      ['a hook returning a promise', (actor, { can }) => Promise.resolve(can('read', 'items'))]
    ])('reject %s, without building any ability', (name, hook) => {
      const authorization = new Authorization({ cache: { key } })
      authorization.registerHook('async', hook)
      expect(() => authorization.defineAbility(user)).toThrow(new TypeError('hook async must be synchronous'))
      expect(() => authorization.getAbility(user)).toThrow(new TypeError('hook async must be synchronous'))
      expect(authorization.invalidateAbility(user)).toBe(false)
    })
    it('reject a failing asynchronous hook, without leaving its rejection unhandled', async () => {
      const unhandled = vi.fn()
      process.on('unhandledRejection', unhandled)
      try {
        const authorization = new Authorization()
        authorization.registerHook('async', async () => { throw new Error('hook failure') })
        expect(() => authorization.defineAbility(user)).toThrow(new TypeError('hook async must be synchronous'))
        // Unhandled rejections are reported once the current task completes
        await new Promise(resolve => setTimeout(resolve, 0))
        expect(unhandled).not.toHaveBeenCalled()
      } finally {
        process.off('unhandledRejection', unhandled)
      }
    })
    it('take precedence over the hooks registered before them', () => {
      const authorization = new Authorization()
      authorization.registerHook('grant', (actor, { can }) => can('read', 'items'))
      authorization.registerHook('deny', (actor, { cannot }) => cannot('read', 'items'))
      expect(authorization.defineAbility(user).can('read', 'items')).toBe(false)
    })
    it('registered while hooks run only apply to the next abilities', () => {
      const authorization = new Authorization()
      const late = vi.fn()
      let registered = false
      authorization.registerHook('first', () => {
        if (registered) return
        registered = true
        authorization.registerHook('late', late)
      })
      authorization.defineAbility(user)
      expect(late).not.toHaveBeenCalled()
      authorization.defineAbility(user)
      expect(late).toHaveBeenCalledTimes(1)
    })
    it('cannot be registered twice under the same name', () => {
      const { authorization } = createAuthorization()
      expect(() => authorization.registerHook('organizations', () => {})).toThrow('entry already registered: organizations')
    })
    it('no longer run once unregistered', () => {
      const { authorization, hook } = createAuthorization()
      expect(authorization.unregisterHook('organizations')).toBe(true)
      expect(authorization.unregisterHook('organizations')).toBe(false)
      authorization.defineAbility(user)
      expect(hook).not.toHaveBeenCalled()
    })
    it('reject a hook that is not a function', () => {
      expect(() => new Authorization().registerHook('test', {})).toThrow('hook must be a function')
    })
  })

  describe('defineAbility', () => {
    it('builds a new ability on every call', () => {
      const { authorization, hook } = createAuthorization()
      const first = authorization.defineAbility(user)
      const second = authorization.defineAbility(user)
      expect(first).toBeInstanceOf(Ability)
      expect(first).not.toBe(second)
      expect(hook).toHaveBeenCalledTimes(2)
    })
    it('scopes role abilities to each organization, with the configured aliases', () => {
      const { authorization } = createAuthorization()
      const ability = authorization.defineAbility(user)
      expect(permissions.can(ability, 'patch', 'items', { context: 'org-1' })).toBe(true)
      expect(permissions.can(ability, 'find', 'items', { context: 'org-1' })).toBe(true)
      expect(permissions.can(ability, 'patch', 'items', { context: 'org-2' })).toBe(false)
      expect(permissions.can(ability, 'find', 'items', { context: 'org-2' })).toBe(true)
      expect(permissions.cannot(ability, 'find', 'items', { context: 'org-3' })).toBe(true)
    })
    it('keeps a restriction inherited through a diamond', () => {
      const authorization = new Authorization()
      authorization.roles.register('member', {})
      authorization.roles.register('editor', { inherits: ['member'] })
      authorization.roles.register('reviewer', { inherits: ['member'] })
      authorization.roles.register('manager', { inherits: ['editor', 'reviewer'] })
      authorization.registerHook('items', (actor, { defineRoleAbilities }) => defineRoleAbilities('manager', {
        member: ({ can }) => can('update', 'items'),
        editor: ({ cannot }) => cannot('update', 'items', { locked: true }),
        reviewer: ({ can }) => can('review', 'items')
      }))
      const ability = authorization.defineAbility(user)
      // Repeating member after editor would grant again what editor restricts
      expect(permissions.can(ability, 'update', 'items', { locked: true })).toBe(false)
      expect(permissions.can(ability, 'update', 'items', { locked: false })).toBe(true)
      expect(permissions.can(ability, 'review', 'items', { locked: true })).toBe(true)
    })
    it('defines the abilities of an anonymous actor', () => {
      const { authorization } = createAuthorization()
      authorization.registerHook('public', (actor, { can }) => can('read', 'publications'))
      const ability = authorization.defineAbility(null)
      expect(ability.can('read', 'publications')).toBe(true)
      expect(ability.can('read', 'items')).toBe(false)
    })
    it('fails when a hook does', () => {
      const { authorization } = createAuthorization()
      authorization.registerHook('failing', () => { throw new Error('hook failure') })
      expect(() => authorization.defineAbility(user)).toThrow('hook failure')
    })
    it('fails on a role unknown to the registry', () => {
      const { authorization } = createAuthorization()
      expect(() => authorization.defineAbility({ organizations: [{ _id: 'org-1', role: 'admin' }] }))
        .toThrow(new TypeError('unknown role: admin'))
    })
    it('rejects a context that is not an object', () => {
      expect(() => new Authorization().defineAbility(user, 'org-1')).toThrow('context must be an object')
    })
  })

  describe('getAbility without cache', () => {
    it('defines a new ability on every call', () => {
      const { authorization, hook } = createAuthorization()
      authorization.getAbility(user)
      authorization.getAbility(user)
      expect(hook).toHaveBeenCalledTimes(2)
      expect(authorization.invalidateAbility(user)).toBe(false)
      expect(() => authorization.clearAbilities()).not.toThrow()
    })
  })

  describe('getAbility with cache', () => {
    afterEach(() => {
      vi.useRealTimers()
    })
    it('computes the rules once per key', () => {
      const { authorization, hook } = createAuthorization({ cache: { key } })
      authorization.getAbility(user)
      authorization.getAbility(user)
      authorization.getAbility(otherUser)
      expect(hook).toHaveBeenCalledTimes(2)
    })
    it('returns a new ability on every call, which may be altered without affecting the others', () => {
      const { authorization } = createAuthorization({ cache: { key } })
      const first = authorization.getAbility(user)
      const second = authorization.getAbility(user)
      expect(first).toBeInstanceOf(Ability)
      expect(first).not.toBe(second)
      first.update([])
      expect(first.can('find', 'items')).toBe(false)
      expect(permissions.can(authorization.getAbility(user), 'patch', 'items', { context: 'org-1' })).toBe(true)
    })
    it('gives every ability its own copy of the rules, isolated from the hooks', () => {
      const authorization = new Authorization({ cache: { key } })
      const actor = { _id: 'user-1', organizationIds: ['org-1', 'org-2'] }
      authorization.registerHook('items', ({ organizationIds }, { can }) => {
        can('read', 'items', { context: { $in: organizationIds } })
      })
      const first = authorization.getAbility(actor)
      expect(Object.isFrozen(first.rules)).toBe(false)
      first.rules[0].conditions.context.$in.push('org-3')
      actor.organizationIds.push('org-4')
      const second = authorization.getAbility(actor)
      expect(second.rules[0].conditions.context.$in).toEqual(['org-1', 'org-2'])
    })
    it('keeps the aliases given at construction', () => {
      const aliases = { update: ['patch'] }
      const authorization = new Authorization({ aliases, cache: { key } })
      authorization.registerHook('items', (actor, { can }) => can('update', 'items'))
      aliases.update.push('replace')
      expect(authorization.defineAbility(user).can('replace', 'items')).toBe(false)
      expect(authorization.getAbility(user).can('replace', 'items')).toBe(false)
      expect(authorization.getAbility(user).can('patch', 'items')).toBe(true)
    })
    it('validates the context even when the rules are cached', () => {
      const { authorization } = createAuthorization({ cache: { key } })
      authorization.getAbility(user)
      expect(() => authorization.getAbility(user, 'org-1')).toThrow('context must be an object')
      expect(() => authorization.invalidateAbility(user, 'org-1')).toThrow('context must be an object')
    })
    it('keeps values such as ObjectId comparable', () => {
      const authorization = new Authorization({ cache: { key } })
      const id = new ObjectId()
      authorization.registerHook('users', (actor, { can }) => can('update', 'users', { _id: id }))
      const ability = authorization.getAbility(user)
      expect(permissions.can(ability, 'update', 'users', { _id: new ObjectId(id.toHexString()) })).toBe(true)
      expect(permissions.can(ability, 'update', 'users', { _id: new ObjectId() })).toBe(false)
    })
    it('recomputes the rules once roles change', () => {
      const { authorization, hook } = createAuthorization({ cache: { key } })
      authorization.getAbility(user)
      authorization.roles.register('owner', { inherits: ['manager'] })
      authorization.getAbility(user)
      expect(hook).toHaveBeenCalledTimes(2)
    })
    it('recomputes the rules once hooks change', () => {
      const { authorization, hook } = createAuthorization({ cache: { key } })
      authorization.getAbility(user)
      authorization.registerHook('public', (actor, { can }) => can('read', 'publications'))
      const ability = authorization.getAbility(user)
      expect(hook).toHaveBeenCalledTimes(2)
      expect(ability.can('read', 'publications')).toBe(true)
    })
    it('recomputes the rules of an invalidated actor only', () => {
      const { authorization, hook } = createAuthorization({ cache: { key } })
      authorization.getAbility(user)
      authorization.getAbility(otherUser)
      expect(authorization.invalidateAbility(user)).toBe(true)
      expect(authorization.invalidateAbility(user)).toBe(false)
      authorization.getAbility(user)
      authorization.getAbility(otherUser)
      expect(hook).toHaveBeenCalledTimes(3)
    })
    it('recomputes every rules once cleared', () => {
      const { authorization, hook } = createAuthorization({ cache: { key } })
      authorization.getAbility(user)
      authorization.getAbility(otherUser)
      authorization.clearAbilities()
      authorization.getAbility(user)
      authorization.getAbility(otherUser)
      expect(hook).toHaveBeenCalledTimes(4)
    })
    it('does not cache a failure', () => {
      const { authorization, hook } = createAuthorization({ cache: { key } })
      hook.mockImplementationOnce(() => { throw new Error('hook failure') })
      expect(() => authorization.getAbility(user)).toThrow('hook failure')
      expect(authorization.getAbility(user)).toBeInstanceOf(Ability)
      expect(hook).toHaveBeenCalledTimes(2)
    })
    it('expires the rules after 60 seconds by default', () => {
      vi.useFakeTimers({ toFake: ['Date'] })
      const { authorization, hook } = createAuthorization({ cache: { key } })
      authorization.getAbility(user)
      vi.setSystemTime(Date.now() + 59999)
      authorization.getAbility(user)
      vi.setSystemTime(Date.now() + 2)
      authorization.getAbility(user)
      expect(hook).toHaveBeenCalledTimes(2)
    })
    it('never expires the rules with a ttl of 0', () => {
      vi.useFakeTimers({ toFake: ['Date'] })
      const { authorization, hook } = createAuthorization({ cache: { key, ttl: 0 } })
      authorization.getAbility(user)
      vi.setSystemTime(Date.now() + 24 * 3600 * 1000)
      authorization.getAbility(user)
      expect(hook).toHaveBeenCalledTimes(1)
    })
    it('expires the rules after the ttl', () => {
      vi.useFakeTimers({ toFake: ['Date'] })
      const { authorization, hook } = createAuthorization({ cache: { key, ttl: 1000 } })
      authorization.getAbility(user)
      vi.setSystemTime(Date.now() + 999)
      authorization.getAbility(user)
      vi.setSystemTime(Date.now() + 2)
      authorization.getAbility(user)
      expect(hook).toHaveBeenCalledTimes(2)
    })
    it('evicts the least recently used rules', () => {
      const { authorization, hook } = createAuthorization({ cache: { key, max: 1 } })
      authorization.getAbility(user)
      authorization.getAbility(otherUser)
      authorization.getAbility(user)
      expect(hook).toHaveBeenCalledTimes(3)
    })
    it('isolates cached rules by context when the key includes it', () => {
      const authorization = new Authorization({
        cache: { key: (actor, context) => JSON.stringify([actor._id, context.organizationId]) }
      })
      const hook = vi.fn((actor, { can }, context) => {
        can('read', 'items', { context: context.organizationId })
      })
      authorization.registerHook('items', hook)
      const firstContext = { organizationId: 'org-1' }
      const secondContext = { organizationId: 'org-2' }
      const first = authorization.getAbility(user, firstContext)
      const second = authorization.getAbility(user, secondContext)
      expect(permissions.can(first, 'read', 'items', { context: 'org-1' })).toBe(true)
      expect(permissions.can(first, 'read', 'items', { context: 'org-2' })).toBe(false)
      expect(permissions.can(second, 'read', 'items', { context: 'org-2' })).toBe(true)
      expect(permissions.can(second, 'read', 'items', { context: 'org-1' })).toBe(false)
      expect(authorization.invalidateAbility(user, firstContext)).toBe(true)
      authorization.getAbility(user, secondContext)
      expect(hook).toHaveBeenCalledTimes(2)
      authorization.getAbility(user, firstContext)
      expect(hook).toHaveBeenCalledTimes(3)
    })
    it('recomputes permissions after a role inheritance changes', () => {
      const { authorization, hook } = createAuthorization({ cache: { key } })
      const before = authorization.getAbility(user)
      expect(permissions.can(before, 'find', 'items', { context: 'org-1' })).toBe(true)
      authorization.roles.replace('manager', { inherits: [] })
      const after = authorization.getAbility(user)
      expect(permissions.can(after, 'find', 'items', { context: 'org-1' })).toBe(false)
      expect(permissions.can(after, 'patch', 'items', { context: 'org-1' })).toBe(true)
      expect(permissions.can(after, 'find', 'items', { context: 'org-2' })).toBe(true)
      expect(hook).toHaveBeenCalledTimes(2)
    })
    it('recomputes permissions after a hook is removed', () => {
      const { authorization, hook } = createAuthorization({ cache: { key } })
      expect(authorization.getAbility(user).can('find', 'items')).toBe(true)
      expect(authorization.unregisterHook('organizations')).toBe(true)
      expect(authorization.getAbility(user).can('find', 'items')).toBe(false)
      expect(hook).toHaveBeenCalledTimes(1)
    })
    it('preserves dates and regular expressions when cloning rules', () => {
      const authorization = new Authorization({ cache: { key } })
      const date = new Date('2026-11-20T10:00:00Z')
      const pattern = /^public-/i
      authorization.registerHook('items', (actor, { can }) => {
        can('read', 'items', { createdAt: { $gte: date }, name: { $regex: pattern } })
      })
      const first = authorization.getAbility(user)
      const second = authorization.getAbility(user)
      const conditions = first.rules[0].conditions
      expect(conditions.createdAt.$gte).toBeInstanceOf(Date)
      expect(conditions.name.$regex).toBeInstanceOf(RegExp)
      expect(conditions.createdAt.$gte).not.toBe(date)
      expect(conditions.createdAt.$gte).not.toBe(second.rules[0].conditions.createdAt.$gte)
      expect(conditions.name.$regex).not.toBe(second.rules[0].conditions.name.$regex)
      expect(conditions.name.$regex.flags).toBe('i')
      conditions.createdAt.$gte.setUTCFullYear(2030)
      const third = authorization.getAbility(user)
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
    it('isolates ObjectId values across cached abilities', () => {
      const authorization = new Authorization({ cache: { key } })
      const id = new ObjectId()
      authorization.registerHook('users', (actor, { can }) => can('read', 'users', { _id: id }))
      const first = authorization.getAbility(user)
      const second = authorization.getAbility(user)
      const firstId = first.rules[0].conditions._id
      const secondId = second.rules[0].conditions._id
      expect(firstId).toBeInstanceOf(ObjectId)
      expect(firstId).not.toBe(id)
      expect(firstId).not.toBe(secondId)
      expect(firstId.toHexString()).toBe(id.toHexString())
      firstId.id[0] ^= 255
      expect(secondId.toHexString()).toBe(id.toHexString())
      expect(authorization.getAbility(user).rules[0].conditions._id.toHexString()).toBe(id.toHexString())
    })
    it('refreshes the recency of a cached entry when accessed', () => {
      const { authorization, hook } = createAuthorization({ cache: { key, max: 2 } })
      const thirdUser = { _id: 'user-3', organizations: [] }
      authorization.getAbility(user)
      authorization.getAbility(otherUser)
      authorization.getAbility(user)
      authorization.getAbility(thirdUser)
      authorization.getAbility(user)
      expect(hook).toHaveBeenCalledTimes(3)
      authorization.getAbility(otherUser)
      expect(hook).toHaveBeenCalledTimes(4)
    })
    it('rejects a key that is not a string', () => {
      const authorization = new Authorization({ cache: { key: actor => actor._id } })
      expect(() => authorization.getAbility({ _id: new ObjectId() }))
        .toThrow('cache key must be a non-empty string')
      expect(() => authorization.invalidateAbility({ _id: new ObjectId() })).toThrow('cache key must be a non-empty string')
    })
  })

  describe('in production', () => {
    afterEach(() => {
      vi.unstubAllEnvs()
      vi.resetModules()
    })
    it('still rejects an asynchronous hook, while assertions are disabled', async () => {
      vi.stubEnv('NODE_ENV', 'production')
      vi.resetModules()
      const { Authorization } = await import('../../src/runtime/authorization.js')
      const authorization = new Authorization()
      // Control: this assertion is skipped, so the production code path is really exercised
      expect(() => authorization.defineAbility(user, 'org-1')).not.toThrow()
      authorization.registerHook('async', async (actor, { can }) => can('read', 'items'))
      expect(() => authorization.defineAbility(user)).toThrow(new TypeError('hook async must be synchronous'))
    })
  })
})
