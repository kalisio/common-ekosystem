import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { logger } from '../src/utils/logger'

describe('Logger', () => {
  let mockLogger
  const originalLevel = logger.getLevel()
  const originalLogger = logger.logger

  beforeEach(() => {
    mockLogger = {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn()
    }
    vi.restoreAllMocks()
  })

  afterEach(() => {
    logger.setLevel(originalLevel)
    logger.setLogger(originalLogger)
  })

  describe('setLogger', () => {
    it('should set custom logger', () => {
      logger.setLogger(mockLogger)
      expect(logger.logger).toBe(mockLogger)
    })
  })

  describe('setLevel and getLevel', () => {
    it('should set and get valid level', () => {
      logger.setLevel('debug')
      expect(logger.getLevel()).toBe('debug')
    })

    it('should ignore invalid level', () => {
      logger.setLevel('warn')
      const currentLevel = logger.getLevel()
      logger.setLevel('invalid')
      expect(logger.getLevel()).toBe(currentLevel)
    })
  })

  describe('log', () => {
    it('should not log if level is too low', () => {
      logger.setLevel('error')
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      logger.log('warn', 'test')
      expect(consoleSpy).not.toHaveBeenCalled()
    })

    it('should log if level is sufficient', () => {
      logger.setLevel('warn')
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      logger.log('warn', 'test')
      expect(consoleSpy).toHaveBeenCalledWith('test')
    })

    it('should use custom logger if defined', () => {
      logger.setLogger(mockLogger)
      logger.setLevel('debug')

      logger.log('debug', 'test')
      expect(mockLogger.debug).toHaveBeenCalledWith('test')
    })
  })

  describe('Level methods', () => {
    beforeEach(() => {
      logger.setLevel('debug')
    })

    it('should call debug with prefix', () => {
      const spy = vi.spyOn(console, 'debug').mockImplementation(() => {})
      logger.debug('test')
      expect(spy).toHaveBeenCalledWith('[graphiks]', 'test')
    })

    it('should call info with prefix', () => {
      const spy = vi.spyOn(console, 'info').mockImplementation(() => {})
      logger.info('test')
      expect(spy).toHaveBeenCalledWith('[graphiks]', 'test')
    })

    it('should call warn with prefix', () => {
      const spy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      logger.warn('test')
      expect(spy).toHaveBeenCalledWith('[graphiks]', 'test')
    })

    it('should call error with prefix', () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
      logger.error('test')
      expect(spy).toHaveBeenCalledWith('[graphiks]', 'test')
    })
  })
})
