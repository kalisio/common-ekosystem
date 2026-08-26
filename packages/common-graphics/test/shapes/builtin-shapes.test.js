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
    describe('windBarb', () => {
      for (let speed = 0; speed <= 150; speed += 5) {
        it(`renders ${speed} knots`, async () => {
          const shape = factory.build({
            shape: 'wind-barb',
            speed,
            color: 'red',
            stroke: {
              color: 'red'
            }
          })
          expect(shape).toBeDefined()
          await compareWithFixture(shape, `wind-barb-${speed}`)
        })
      }
    })
  })
})
