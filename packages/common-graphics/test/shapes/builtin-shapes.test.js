import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import { PNG } from 'pngjs'
import pixelmatch from 'pixelmatch'
import { describe, expect, it } from 'vitest'
import { string } from '@kalisio/common-core/utilities'
import { image } from '#utilities'
import * as BUILTIN_SHAPES from '../../src/shapes/builtin-shapes/index.js'
import { ShapeFactory } from '../../src/shapes/shape-factory.js'

const factory = new ShapeFactory()
const UPDATE_FIXTURES = process.env.UPDATE_FIXTURES === 'true'

const PARAMS = {
  donut: {
    slices: [
      { value: 30, color: 'red' },
      { value: 70, color: 'blue' }
    ]
  },
  pie: {
    slices: [
      { value: 30, color: 'red' },
      { value: 70, color: 'blue' }
    ]
  },
  windBarb: {
    speed: 25
  }
}

async function compareWithFixture (shape, name) {
  const actualBuffer = await image.resolve(await shape.toPNG())
  const fixtureUrl = new URL(`./fixtures/${name}.png`, import.meta.url)
  if (UPDATE_FIXTURES) {
    await mkdir(dirname(fixtureUrl.pathname), { recursive: true })
    await writeFile(fixtureUrl, actualBuffer)
    return
  }
  const expectedBuffer = await readFile(fixtureUrl)
  const actual = PNG.sync.read(actualBuffer)
  const expected = PNG.sync.read(expectedBuffer)
  expect(actual.width).toBe(expected.width)
  expect(actual.height).toBe(expected.height)
  const diff = pixelmatch(
    actual.data,
    expected.data,
    null,
    actual.width,
    actual.height,
    {
      threshold: 0.1
    }
  )
  expect(diff).toBe(0)
}

describe('built-in shapes', () => {
  for (const name of Object.keys(BUILTIN_SHAPES)) {
    it(`renders ${name}`, async () => {
      const shape = factory.build({
        shape: string.kebabCase(name),
        color: 'red',
        stroke: {
          color: 'green',
          width: 2
        },
        ...PARAMS[name]
      })
      expect(shape).toBeDefined()
      await compareWithFixture(shape, name)
    })
  }
  describe('windBarb', () => {
    const render = speed => BUILTIN_SHAPES.windBarb({
      speed,
      color: 'red',
      stroke: {
        color: 'black',
        width: 1
      }
    })
    it('renders calm wind', () => {
      expect(render(0).shape).toContain('<circle')
    })
    it('rounds speed to the nearest 5 knots', () => {
      expect(render(24).shape).toBe(render(25).shape)
      expect(render(26).shape).toBe(render(25).shape)
    })
    it('renders 5 knots', () => {
      expect(render(5).shape).toContain('<path')
    })
    it('renders 10 knots', () => {
      expect(render(10).shape).toContain('<path')
    })
    it('renders 15 knots', () => {
      expect(render(15).shape).toContain('<path')
    })
    it('renders 50 knots', () => {
      expect(render(50).shape).toContain('Z')
    })
    it('renders 65 knots', () => {
      expect(render(65).shape).toContain('Z')
    })
    it('renders 100 knots', () => {
      expect((render(100).shape.match(/Z/g) || []).length).toBe(2)
    })
    it('renders 145 knots', () => {
      expect(render(145).shape).toContain('</g>')
    })
    it('clamps negative speeds to calm wind', () => {
      expect(render(-10).shape).toContain('<circle')
    })
    it('supports transforms', () => {
      const result = BUILTIN_SHAPES.windBarb({
        speed: 25,
        transform: {
          rotate: [90, 50, 50]
        }
      })
      expect(result.shape).toContain('rotate')
    })
  })
})
