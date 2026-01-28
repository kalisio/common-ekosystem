const LEVELS = ['debug', 'info', 'warn', 'error']

class Logger {
  constructor (options = {}) {
    this.level = options.level || 'warn'
    this.logger = options.logger || null
    this.prefix = '[graphiks]'
  }

  setLogger (logger) {
    this.logger = logger
  }

  setLevel (level) {
    if (LEVELS.includes(level)) {
      this.level = level
    }
  }

  getLevel () {
    return this.level
  }

  log (level, ...args) {
    if (LEVELS.indexOf(level) < LEVELS.indexOf(this.level)) return
    if (this.logger && typeof this.logger[level] === 'function') {
      this.logger[level](...args)
    } else if (console) {
      console[level](...args) // eslint-disable-line no-console
    }
  }

  debug (...args) {
    this.log('debug', this.prefix, ...args)
  }

  info (...args) {
    this.log('info', this.prefix, ...args)
  }

  warn (...args) {
    this.log('warn', this.prefix, ...args)
  }

  error (...args) {
    this.log('error', this.prefix, ...args)
  }
}

// logger instance
export const logger = new Logger()
