import { describe, it, expect } from 'vitest'
import { env } from '../../src/utilities/index.js'

describe('env (node)', () => {
  it('exports all expected properties', () => {
    expect(env).toHaveProperty('browser')
    expect(env).toHaveProperty('node')
    expect(env).toHaveProperty('worker')
    expect(env).toHaveProperty('serviceWorker')
    expect(env).toHaveProperty('dev')
    expect(env).toHaveProperty('prod')
    expect(env).toHaveProperty('test')
  })

  it('does not detect worker', () => {
    expect(env.worker).toBe(false)
  })

  it('does not detect service worker', () => {
    expect(env.serviceWorker).toBe(false)
  })

  it('has consistent mode flags', () => {
    const modeFlags = [env.dev, env.prod, env.test].filter(Boolean)
    expect(modeFlags.length).toBeLessThanOrEqual(1)
  })
})
