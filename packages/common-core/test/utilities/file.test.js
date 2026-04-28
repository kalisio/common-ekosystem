import { describe, it, expect } from 'vitest'
import { file } from '../../src/utilities'

describe('file.parse', () => {
  it('returns the components of a Unix path', () => {
    expect(file.parse('/foo/bar/baz.txt')).toEqual({
      fileName: 'baz.txt',
      extension: '.txt',
      baseName: 'baz',
      dir: '/foo/bar'
    })
  })

  it('returns the components of a Windows path', () => {
    expect(file.parse('C:\\foo\\bar\\baz.txt')).toEqual({
      fileName: 'baz.txt',
      extension: '.txt',
      baseName: 'baz',
      dir: 'C:/foo/bar'
    })
  })

  it('handles a file with no extension', () => {
    expect(file.parse('/foo/bar/baz')).toEqual({
      fileName: 'baz',
      extension: '',
      baseName: 'baz',
      dir: '/foo/bar'
    })
  })

  it('handles a dotfile', () => {
    expect(file.parse('/foo/.bashrc')).toEqual({
      fileName: '.bashrc',
      extension: '',
      baseName: '.bashrc',
      dir: '/foo'
    })
  })

  it('handles a file at the root', () => {
    expect(file.parse('/baz.txt')).toEqual({
      fileName: 'baz.txt',
      extension: '.txt',
      baseName: 'baz',
      dir: ''
    })
  })

  it('handles a file with no directory', () => {
    expect(file.parse('baz.txt')).toEqual({
      fileName: 'baz.txt',
      extension: '.txt',
      baseName: 'baz',
      dir: '.'
    })
  })

  it('returns the full extension for a .tar.gz file', () => {
    expect(file.parse('/foo/bar/archive.tar.gz')).toEqual({
      fileName: 'archive.tar.gz',
      extension: '.tar.gz',
      baseName: 'archive',
      dir: '/foo/bar'
    })
  })

  it('returns the full extension for a .d.ts file', () => {
    expect(file.parse('/foo/bar/types.d.ts')).toEqual({
      fileName: 'types.d.ts',
      extension: '.d.ts',
      baseName: 'types',
      dir: '/foo/bar'
    })
  })

  it('returns the full extension for a .min.js file', () => {
    expect(file.parse('/foo/bar/bundle.min.js')).toEqual({
      fileName: 'bundle.min.js',
      extension: '.min.js',
      baseName: 'bundle',
      dir: '/foo/bar'
    })
  })

  it('throws if filePath is not a string', () => {
    expect(() => file.parse(123)).toThrow(TypeError)
    expect(() => file.parse(null)).toThrow(TypeError)
    expect(() => file.parse(undefined)).toThrow(TypeError)
  })
})

describe('file.formatSize', () => {
  it('returns bytes', () => {
    expect(file.formatSize(512)).toEqual({ value: 512, unit: 'B' })
  })

  it('returns kilobytes', () => {
    expect(file.formatSize(1024)).toEqual({ value: 1, unit: 'KB' })
  })

  it('returns megabytes', () => {
    expect(file.formatSize(1024 ** 2)).toEqual({ value: 1, unit: 'MB' })
  })

  it('returns gigabytes', () => {
    expect(file.formatSize(1024 ** 3)).toEqual({ value: 1, unit: 'GB' })
  })

  it('rounds to 2 decimal places', () => {
    expect(file.formatSize(1500)).toEqual({ value: 1.46, unit: 'KB' })
  })

  it('returns an integer without decimals', () => {
    expect(file.formatSize(2048)).toEqual({ value: 2, unit: 'KB' })
  })

  it('throws if bytes is not a number', () => {
    expect(() => file.formatSize('1024')).toThrow(TypeError)
    expect(() => file.formatSize(null)).toThrow(TypeError)
  })
})
