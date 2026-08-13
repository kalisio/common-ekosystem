import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { locale } from '../../src/utilities/index.js'

describe('locale.get', () => {
  it('returns a valid BCP 47 locale string', () => {
    expect(locale.get()).toMatch(/^[a-z]{2,3}(-[A-Z][a-z]{3})?(-[A-Z]{2})?$/)
  })

  describe('in a browser environment', () => {
    beforeEach(() => {
      vi.stubGlobal('navigator', { languages: ['fr-FR', 'fr'], language: 'fr-FR' })
    })

    afterEach(() => {
      vi.unstubAllGlobals()
    })

    it('returns the first entry of navigator.languages', () => {
      expect(locale.get()).toBe('fr-FR')
    })

    it('falls back to navigator.language if languages is empty', () => {
      vi.stubGlobal('navigator', { languages: [], language: 'fr-FR' })
      expect(locale.get()).toBe('fr-FR')
    })

    it('falls back to navigator.language if languages is undefined', () => {
      vi.stubGlobal('navigator', { language: 'fr-FR' })
      expect(locale.get()).toBe('fr-FR')
    })
  })

  describe('in a node environment', () => {
    beforeEach(() => {
      vi.stubGlobal('navigator', undefined)
    })

    afterEach(() => {
      vi.unstubAllGlobals()
    })

    it('returns a locale from Intl', () => {
      expect(locale.get()).toBe(Intl.DateTimeFormat().resolvedOptions().locale)
    })
  })
})

describe('locale.getCodes', () => {
  it('returns language and region for a language-region locale', () => {
    vi.stubGlobal('navigator', { languages: ['fr-FR'], language: 'fr-FR' })
    expect(locale.getCodes()).toEqual({ language: 'fr', script: undefined, region: 'FR' })
    vi.unstubAllGlobals()
  })

  it('returns language only for a language-only locale', () => {
    vi.stubGlobal('navigator', { languages: ['fr'], language: 'fr' })
    expect(locale.getCodes()).toEqual({ language: 'fr', script: undefined, region: undefined })
    vi.unstubAllGlobals()
  })

  it('returns language, script and region for a full locale', () => {
    vi.stubGlobal('navigator', { languages: ['zh-Hant-TW'], language: 'zh-Hant-TW' })
    expect(locale.getCodes()).toEqual({ language: 'zh', script: 'Hant', region: 'TW' })
    vi.unstubAllGlobals()
  })
})
