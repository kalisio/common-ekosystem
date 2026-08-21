import { describe, it, expect, vi, afterEach } from 'vitest'
import { readFile, mkdtemp, writeFile, rm } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { tmpdir } from 'node:os'
import { source } from '../../src/io/source.js'

const dataDir = join(dirname(fileURLToPath(import.meta.url)), 'data')

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('source.readAsText', () => {
  it('reads a fixture file from a string path', async () => {
    const path = join(dataDir, 'object.json')
    const text = await source.readAsText(path)
    expect(text).toContain('"name": "station-01"')
    expect(text).toBe(await readFile(path, 'utf-8'))
  })
  it('reads a Blob', async () => {
    expect(await source.readAsText(new Blob(['blob content']))).toBe('blob content')
  })
  it('fetches a URL instance', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, text: () => Promise.resolve('fetched') })
    vi.stubGlobal('fetch', fetchMock)
    const input = new URL('https://example.test/data')
    expect(await source.readAsText(input)).toBe('fetched')
    expect(fetchMock).toHaveBeenCalledOnce()
    expect(fetchMock).toHaveBeenCalledWith(input)
  })
  it('fetches a URL string', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, text: () => Promise.resolve('fetched') })
    vi.stubGlobal('fetch', fetchMock)
    const input = 'https://example.test/data'
    expect(await source.readAsText(input)).toBe('fetched')
    expect(fetchMock).toHaveBeenCalledOnce()
    expect(fetchMock).toHaveBeenCalledWith(input)
  })
  it('honors the encoding option when reading a file', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'io-enc-'))
    const path = join(dir, 'latin1.txt')
    try {
      await writeFile(path, Buffer.from([0xe9]))
      expect(await source.readAsText(path, { encoding: 'latin1' })).toBe('é')
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })
  it('throws READ_FAILED with the original cause on a missing file', async () => {
    await expect(source.readAsText(join(dataDir, 'does-not-exist.json'))).rejects.toMatchObject({
      code: source.ERROR_CODES.READ_FAILED,
      cause: expect.any(Error)
    })
  })
  it('throws READ_FAILED with an HTTP_ERROR cause on a non-ok response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 404, statusText: 'Not Found' }))
    await expect(source.readAsText(new URL('https://example.test/x'))).rejects.toMatchObject({
      code: source.ERROR_CODES.READ_FAILED,
      cause: { code: source.ERROR_CODES.HTTP_ERROR, status: 404, statusText: 'Not Found' }
    })
  })
  it('wraps a fetch failure as READ_FAILED', async () => {
    const cause = new TypeError('fetch failed')
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(cause))
    await expect(source.readAsText(new URL('https://example.test/x'))).rejects.toMatchObject({
      code: source.ERROR_CODES.READ_FAILED,
      cause
    })
  })
  it('throws UNSUPPORTED_SOURCE for an unsupported source type', async () => {
    await expect(source.readAsText(42)).rejects.toMatchObject({ code: source.ERROR_CODES.UNSUPPORTED_SOURCE })
  })
  it('rejects an undefined source', async () => {
    await expect(source.readAsText()).rejects.toThrowError()
  })
  it('rejects invalid options', async () => {
    await expect(source.readAsText('x', { encoding: 123 })).rejects.toThrowError()
  })
})
