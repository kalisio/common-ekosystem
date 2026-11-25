describe('setup', () => {
  let Authorization
  let getGlobalAuthorization
  let setup

  beforeEach(async () => {
    vi.resetModules()
    const runtime = await import('../src/runtime/index.js')
    Authorization = runtime.Authorization
    getGlobalAuthorization = runtime.getGlobalAuthorization
    setup = (await import('../src/setup.js')).setup
  })

  it('sets the global authorization', () => {
    const authorization = new Authorization()
    setup({ authorization })
    expect(getGlobalAuthorization()).toBe(authorization)
  })
  it('replaces the global authorization', () => {
    const first = new Authorization()
    const second = new Authorization()
    setup({ authorization: first })
    setup({ authorization: second })
    expect(getGlobalAuthorization()).toBe(second)
  })
  it('preserves the state of the provided authorization', () => {
    const authorization = new Authorization()
    authorization.roles.register('member', {})
    setup({ authorization })
    expect(getGlobalAuthorization().roles.has('member')).toBe(true)
  })
  it('does not create a default authorization', () => {
    setup()
    expect(() => getGlobalAuthorization())
      .toThrow('authorization must be configured')
  })
  it('preserves the global authorization when called without options', () => {
    const authorization = new Authorization()
    setup({ authorization })
    setup()
    expect(getGlobalAuthorization()).toBe(authorization)
  })
  it('preserves the global authorization when called with empty options', () => {
    const authorization = new Authorization()
    setup({ authorization })
    setup({})
    expect(getGlobalAuthorization()).toBe(authorization)
  })
  it.each([
    ['null', null],
    ['an array', []],
    ['a string', 'invalid'],
    ['a number', 1],
    ['a boolean', true]
  ])('rejects %s as options', (name, options) => {
    expect(() => setup(options)).toThrow('invalid setup options')
  })
  it.each([
    ['an object', {}],
    ['an array', []],
    ['a string', 'invalid'],
    ['a number', 1],
    ['a boolean', true]
  ])('rejects %s as authorization', (name, authorization) => {
    expect(() => setup({ authorization })).toThrow('invalid setup options')
  })
  it('preserves the global authorization when setup fails', () => {
    const authorization = new Authorization()
    setup({ authorization })
    expect(() => setup({ authorization: {} }))
      .toThrow('invalid setup options')
    expect(getGlobalAuthorization()).toBe(authorization)
  })
})
