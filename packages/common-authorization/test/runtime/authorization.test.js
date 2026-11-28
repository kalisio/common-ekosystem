import { Ability } from '@casl/ability'
import { ObjectId } from 'mongodb'
import { Authorization, RoleRegistry } from '../../src/runtime/index.js'
import { permissions } from '../../src/utilities/index.js'

const aliases = { update: ['patch'], read: ['get', 'find'] }
const key = actor => actor == null ? ['anonymous'] : ['actor', actor._id]

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
  const hook = vi.fn(async (actor, { defineRoleAbilities }) => {
    for (const organization of actor?.organizations ?? []) {
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
      ['an unknown authorization option', { alias: aliases }, 'invalid authorization options'],
      ['an unknown cache option', { cache: { key, maxSize: 10 } }, 'invalid authorization options'],
      ['invalid aliases', { aliases: { update: 'patch' } }, 'invalid ability options'],
      ['an invalid cache size', { cache: { key, max: 0 } }, 'max must be a positive integer or Infinity']
    ])('rejects %s', (name, options, message) => {
      expect(() => new Authorization(options)).toThrow(message)
    })
  })

  describe('hooks', () => {
    it('rejects late writes while a subsequent hook is pending', async () => {
      const authorization = new Authorization()
      authorization.roles.register('member', {})
      const secondStarted = Promise.withResolvers()
      const lateFinished = Promise.withResolvers()
      let lateWrites
      authorization.registerHook('first', (actor, { can, cannot, defineRoleAbilities }) => {
        lateWrites = secondStarted.promise.then(() => {
          expect(() => can('remove', 'items')).toThrow('hook API used after the hook settled')
          expect(() => cannot('remove', 'items')).toThrow('hook API used after the hook settled')
          expect(() => defineRoleAbilities('member', { member: ({ can }) => can('remove', 'items') }))
            .toThrow('hook API used after the hook settled')
        }).finally(lateFinished.resolve)
      })
      authorization.registerHook('second', async (actor, { cannot }) => {
        cannot('remove', 'items')
        secondStarted.resolve()
        await lateFinished.promise
      })
      const pending = authorization.defineAbility(user)
      await lateWrites
      const ability = await pending
      expect(ability.can('remove', 'items')).toBe(false)
      expect(ability.rules).toHaveLength(1)
    })
    it('receive the actor, the functions to define rules and the context', async () => {
      const authorization = new Authorization()
      const hook = vi.fn()
      authorization.registerHook('test', hook)
      await authorization.defineAbility(user, { organizationId: 'org-1' })
      const [actor, definitions, context] = hook.mock.calls[0]
      expect(actor).toBe(user)
      expect(Object.keys(definitions)).toEqual(['can', 'cannot', 'defineRoleAbilities'])
      expect(context).toEqual({ organizationId: 'org-1' })
    })
    it('run in registration order', async () => {
      const authorization = new Authorization()
      const calls = []
      authorization.registerHook('first', () => { calls.push('first') })
      authorization.registerHook('second', () => { calls.push('second') })
      await authorization.defineAbility(user)
      expect(calls).toEqual(['first', 'second'])
    })
    it.each([
      ['an asynchronous hook', async (actor, { can }) => {
        await Promise.resolve()
        can('read', 'items')
      }],
      ['a hook returning a thenable', (actor, { can }) => ({
        then (resolve) { resolve(can('read', 'items')) }
      })]
    ])('await %s', async (name, hook) => {
      const authorization = new Authorization({ cache: { key } })
      authorization.registerHook('async', hook)
      expect((await authorization.defineAbility(user)).can('read', 'items')).toBe(true)
      expect((await authorization.getAbility(user)).can('read', 'items')).toBe(true)
    })
    it('propagates the original asynchronous hook error', async () => {
      const error = new Error('hook failure')
      const authorization = new Authorization()
      authorization.registerHook('async', async () => { throw error })
      await expect(authorization.defineAbility(user)).rejects.toBe(error)
    })
    it('take precedence over the hooks registered before them', async () => {
      const authorization = new Authorization()
      authorization.registerHook('grant', async (actor, { can }) => {
        await Promise.resolve()
        can('read', 'items')
      })
      authorization.registerHook('deny', (actor, { cannot }) => cannot('read', 'items'))
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
      authorization.registerHook('items', (actor, { defineRoleAbilities }) => defineRoleAbilities('manager', {
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
    it('defines the abilities of an anonymous actor', async () => {
      const { authorization } = createAuthorization()
      authorization.registerHook('public', (actor, { can }) => can('read', 'publications'))
      const ability = await authorization.defineAbility(null)
      expect(ability.can('read', 'publications')).toBe(true)
      expect(ability.can('read', 'items')).toBe(false)
    })
    it('fails when a hook does', async () => {
      const { authorization } = createAuthorization()
      authorization.registerHook('failing', () => { throw new Error('hook failure') })
      await expect(authorization.defineAbility(user)).rejects.toThrow('hook failure')
    })
    it('drains unawaited role calls before the next hook', async () => {
      const authorization = new Authorization()
      authorization.roles.register('member', {})
      authorization.registerHook('roles', (actor, { defineRoleAbilities }) => {
        defineRoleAbilities('member', {
          member: async ({ can }) => {
            await Promise.resolve()
            can('read', 'items')
          }
        }, async () => ({ organizationId: 'org-1' }))
        defineRoleAbilities('member', {
          member: ({ can }) => can('read', 'items')
        }, { organizationId: 'org-2' })
      })
      authorization.registerHook('restriction', (actor, { cannot }) => {
        cannot('read', 'items', { locked: true })
      })
      const ability = await authorization.defineAbility(user)
      expect(ability.rules.map(rule => rule.conditions)).toEqual([
        { organizationId: 'org-1' }, { organizationId: 'org-2' }, { locked: true }
      ])
      expect(permissions.can(ability, 'read', 'items', { organizationId: 'org-1', locked: true })).toBe(false)
      expect(permissions.can(ability, 'read', 'items', { organizationId: 'org-2' })).toBe(true)
    })
    it('propagates a role rejection even if its hook does not await it', async () => {
      const authorization = new Authorization()
      const error = new Error('scope failure')
      authorization.roles.register('member', {})
      authorization.registerHook('roles', async (actor, { defineRoleAbilities }) => {
        defineRoleAbilities('member', { member: ({ can }) => can('read', 'items') }, async () => { throw error })
        await new Promise(resolve => setImmediate(resolve))
      })
      await expect(authorization.defineAbility(user)).rejects.toBe(error)
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
      const actor = { _id: 'user-1', organizationIds: ['org-1', 'org-2'] }
      authorization.registerHook('items', ({ organizationIds }, { can }) => {
        can('read', 'items', { context: { $in: organizationIds } })
      })
      const first = await authorization.getAbility(actor)
      expect(Object.isFrozen(first.rules)).toBe(false)
      first.rules[0].conditions.context.$in.push('org-3')
      actor.organizationIds.push('org-4')
      const second = await authorization.getAbility(actor)
      expect(second.rules[0].conditions.context.$in).toEqual(['org-1', 'org-2'])
    })
    it('keeps the aliases given at construction', async () => {
      const aliases = { update: ['patch'] }
      const authorization = new Authorization({ aliases, cache: { key } })
      authorization.registerHook('items', (actor, { can }) => can('update', 'items'))
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
      authorization.registerHook('users', (actor, { can }) => can('update', 'users', { _id: id }))
      const ability = await authorization.getAbility(user)
      expect(permissions.can(ability, 'update', 'users', { _id: new ObjectId(id.toHexString()) })).toBe(true)
      expect(permissions.can(ability, 'update', 'users', { _id: new ObjectId() })).toBe(false)
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
      authorization.registerHook('public', (actor, { can }) => can('read', 'publications'))
      const ability = await authorization.getAbility(user)
      expect(hook).toHaveBeenCalledTimes(2)
      expect(ability.can('read', 'publications')).toBe(true)
    })
    it('recomputes the rules of an invalidated actor only', async () => {
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
      const error = new Error('hook failure')
      hook.mockRejectedValueOnce(error)
      const first = authorization.getAbility(user)
      const second = authorization.getAbility(user)
      await expect(Promise.allSettled([first, second])).resolves.toEqual([
        { status: 'rejected', reason: error }, { status: 'rejected', reason: error }
      ])
      expect(await authorization.getAbility(user)).toBeInstanceOf(Ability)
      expect(hook).toHaveBeenCalledTimes(2)
    })
    it('shares pending rules while returning independent abilities', async () => {
      const { authorization, hook } = createAuthorization({ cache: { key } })
      const [first, second] = await Promise.all([authorization.getAbility(user), authorization.getAbility(user)])
      expect(hook).toHaveBeenCalledTimes(1)
      expect(first).not.toBe(second)
      expect(first.rules).not.toBe(second.rules)
      expect(first.rules[0].conditions).not.toBe(second.rules[0].conditions)
    })
    it.each([
      ['invalidating the key', authorization => authorization.invalidateAbility(user), false],
      ['clearing the cache', authorization => authorization.clearAbilities(), false],
      ['invalidating a computation that later rejects', authorization => authorization.invalidateAbility(user), true],
      ['changing the hooks', authorization => authorization.registerHook('new', (actor, { can }) => can('read', 'added')), false],
      ['expiration', () => vi.setSystemTime(Date.now() + 1000), false]
    ])('preserves the replacement entry after %s', async (name, invalidate, rejects) => {
      vi.useFakeTimers({ toFake: ['Date'] })
      let finish
      const pending = new Promise(resolve => { finish = resolve })
      const authorization = new Authorization({ cache: { key, ttl: 1000 } })
      const error = new Error('old computation failed')
      const hook = vi.fn((actor, { can }) => can('read', 'new'))
        .mockImplementationOnce(async (actor, { can }) => {
          await pending
          if (rejects) throw error
          can('read', 'old')
        })
      authorization.registerHook('rules', hook)
      const first = authorization.getAbility(user)
      invalidate(authorization)
      const replacement = await authorization.getAbility(user)
      expect(replacement.can('read', 'new')).toBe(true)
      finish()
      if (rejects) await expect(first).rejects.toBe(error)
      else {
        const original = await first
        expect(original.can('read', 'old')).toBe(true)
        expect(original.can('read', 'added')).toBe(false)
      }
      expect((await authorization.getAbility(user)).can('read', 'new')).toBe(true)
      expect(hook).toHaveBeenCalledTimes(2)
    })
    it('expires the rules after 60 seconds by default', async () => {
      vi.useFakeTimers({ toFake: ['Date'] })
      const { authorization, hook } = createAuthorization({ cache: { key } })
      await authorization.getAbility(user)
      vi.setSystemTime(Date.now() + 59999)
      await authorization.getAbility(user)
      vi.setSystemTime(Date.now() + 2)
      await authorization.getAbility(user)
      expect(hook).toHaveBeenCalledTimes(2)
    })
    it('never expires the rules with a ttl of 0', async () => {
      vi.useFakeTimers({ toFake: ['Date'] })
      const { authorization, hook } = createAuthorization({ cache: { key, ttl: 0 } })
      await authorization.getAbility(user)
      vi.setSystemTime(Date.now() + 24 * 3600 * 1000)
      await authorization.getAbility(user)
      expect(hook).toHaveBeenCalledTimes(1)
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
        cache: { key: (actor, context) => [actor._id, context.organizationId] }
      })
      const hook = vi.fn((actor, { can }, context) => {
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
      authorization.registerHook('items', (actor, { can }) => {
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
      authorization.registerHook('users', (actor, { can }) => can('read', 'users', { _id: id }))
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
    it.each([
      ['scalar', 'user-1'], ['empty array', []], ['missing part', [undefined]],
      ['sparse array', Array(1)], ['non-finite number', [Infinity]], ['empty string', ['']], ['boolean', [true]]
    ])('rejects a %s key during lookup and invalidation', async (name, parts) => {
      const authorization = new Authorization({ cache: { key: () => parts } })
      await expect(authorization.getAbility(user)).rejects.toThrow('cache key must be a non-empty array')
      expect(() => authorization.invalidateAbility(user)).toThrow('cache key must be a non-empty array')
    })
    it('invalidates cached permissions using the serialized ObjectId', async () => {
      const authorization = new Authorization({ cache: { key } })
      const hook = vi.fn((actor, { can }) => {
        if (actor.admin) can('remove', 'items')
      })
      authorization.registerHook('admin', hook)
      const id = new ObjectId()
      const hex = id.toHexString()
      expect((await authorization.getAbility({ _id: id, admin: true })).can('remove', 'items')).toBe(true)
      expect((await authorization.getAbility({ _id: hex })).can('remove', 'items')).toBe(true)
      expect(hook).toHaveBeenCalledTimes(1)
      expect(authorization.invalidateAbility({ _id: hex })).toBe(true)
      expect((await authorization.getAbility({ _id: id })).can('remove', 'items')).toBe(false)
      expect(hook).toHaveBeenCalledTimes(2)
    })
    it('shares keys between numbers and their string representations', async () => {
      const { authorization, hook } = createAuthorization({ cache: { key } })
      for (const _id of [-0, 0, '0', 42, '42']) {
        await authorization.getAbility({ _id })
      }
      expect(hook).toHaveBeenCalledTimes(2)
      expect(authorization.invalidateAbility({ _id: '0' })).toBe(true)
      expect(authorization.invalidateAbility({ _id: '42' })).toBe(true)
      await authorization.getAbility({ _id: -0 })
      await authorization.getAbility({ _id: 42 })
      expect(hook).toHaveBeenCalledTimes(4)
    })
  })

  describe('in production', () => {
    afterEach(() => {
      vi.unstubAllEnvs()
      vi.resetModules()
    })
    it('rejects a missing key part before another actor can reuse cached rules', async () => {
      vi.stubEnv('NODE_ENV', 'production')
      vi.resetModules()
      const { Authorization } = await import('../../src/runtime/authorization.js')
      const authorization = new Authorization({ cache: { key: actor => [actor.id] } })
      authorization.registerHook('admin', (actor, { can }) => {
        if (actor.admin) can('remove', 'items')
      })
      expect((await authorization.getAbility({ id: 'admin', admin: true })).can('remove', 'items')).toBe(true)
      await expect(authorization.getAbility({ _id: 'admin', admin: true })).rejects.toThrow('cache key must be a non-empty array')
      await expect(authorization.getAbility({ _id: 'guest' })).rejects.toThrow('cache key must be a non-empty array')
    })
    it('supports asynchronous hooks, while assertions are disabled', async () => {
      vi.stubEnv('NODE_ENV', 'production')
      vi.resetModules()
      const { Authorization } = await import('../../src/runtime/authorization.js')
      const authorization = new Authorization()
      // Control: this assertion is skipped, so the production code path is really exercised
      await authorization.defineAbility(user, 'org-1')
      authorization.registerHook('async', async (actor, { can }) => can('read', 'items'))
      expect((await authorization.defineAbility(user)).can('read', 'items')).toBe(true)
    })
  })
})
