describe('global authorization', () => {
  let Authorization
  let getGlobalAuthorization
  let setGlobalAuthorization

  beforeEach(async () => {
    vi.resetModules()
    ;({ Authorization, getGlobalAuthorization, setGlobalAuthorization } = await import('../../src/runtime/index.js'))
  })

  describe('setGlobalAuthorization', () => {
    it('sets the global authorization', () => {
      const authorization = new Authorization()
      setGlobalAuthorization(authorization)
      expect(getGlobalAuthorization()).toBe(authorization)
    })
    it('replaces the global authorization', () => {
      const first = new Authorization()
      const second = new Authorization()
      setGlobalAuthorization(first)
      setGlobalAuthorization(second)
      expect(getGlobalAuthorization()).toBe(second)
    })
    it.each([
      ['null', null],
      ['undefined', undefined],
      ['an object', {}],
      ['a string', 'authorization'],
      ['a number', 1]
    ])('rejects %s', (name, value) => {
      expect(() => setGlobalAuthorization(value))
        .toThrow('authorization must be an instance of Authorization')
    })
    it('preserves the global authorization when a replacement is rejected', () => {
      const authorization = new Authorization()
      setGlobalAuthorization(authorization)
      expect(() => setGlobalAuthorization(null)).toThrow()
      expect(getGlobalAuthorization()).toBe(authorization)
    })
  })

  describe('getGlobalAuthorization', () => {
    it('rejects access before initialization', () => {
      expect(() => getGlobalAuthorization())
        .toThrow('authorization must be configured')
    })
    it('returns the same instance on every call', () => {
      const authorization = new Authorization()
      setGlobalAuthorization(authorization)
      expect(getGlobalAuthorization()).toBe(authorization)
      expect(getGlobalAuthorization()).toBe(getGlobalAuthorization())
    })
    it('preserves the state of the installed instance', () => {
      const authorization = new Authorization()
      setGlobalAuthorization(authorization)
      authorization.roles.register('member', {})
      expect(getGlobalAuthorization().roles.has('member')).toBe(true)
    })
  })
})
