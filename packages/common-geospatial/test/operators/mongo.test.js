import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { MongoClient } from 'mongodb'
import { truncateGeoJson, validateGeoJson, fixGeoJson } from '../../src/index.js'
import { isClosedRing, sphericalRingArea } from '../../src/foundation/index.js'

// Integration test: runs ONLY when MONGO_TEST_URL is set, so it never breaks the
// unit suite in CI. Locally:
//   export MONGO_TEST_URL=mongodb://localhost:27017
//
// Goal: prove that our own validate -> fix pipeline produces a geometry that
// MongoDB's 2dsphere index accepts (no "Can't extract geo keys"). Findings on
// this fixture: raw and truncate-alone are rejected; validate+fix is accepted,
// area-preserving (the degenerate hole becomes the gap between two polygons).

const MONGO_URL = process.env.MONGO_TEST_URL
const describeMongo = MONGO_URL ? describe : describe.skip

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const FIXTURE = path.join(__dirname, 'data', 'hole-intersects-shell.geojson')

// Net area of a (Multi)Polygon: sum of exteriors minus their holes, built on the
// foundation's spherical ring area (signed, hence Math.abs). Robust to fix
// turning a Polygon-with-hole into a MultiPolygon.
function geometryArea (geometry) {
  const polygons = geometry.type === 'MultiPolygon' ? geometry.coordinates : [geometry.coordinates]
  return polygons.reduce((sum, poly) => {
    const exterior = Math.abs(sphericalRingArea(poly[0]))
    const holes = poly.slice(1).reduce((h, ring) => h + Math.abs(sphericalRingArea(ring)), 0)
    return sum + exterior - holes
  }, 0)
}

describeMongo('geometry repair against MongoDB 2dsphere', () => {
  let client
  let col
  let rawFeature

  beforeAll(async () => {
    rawFeature = JSON.parse(fs.readFileSync(FIXTURE, 'utf8'))
    if (rawFeature.type === 'FeatureCollection') rawFeature = rawFeature.features[0]

    client = new MongoClient(MONGO_URL)
    await client.connect()
    col = client.db('geodebug').collection('geo_debug')
    await col.createIndex({ geometry: '2dsphere' })
  })

  afterAll(async () => {
    if (client) {
      await client.db('geodebug').dropDatabase()
      await client.close()
    }
  })

  // Try to insert a geometry, resolve to 'accepted' | 'geokeys' | 'other'.
  async function tryInsert (geometry) {
    try {
      const res = await col.insertOne({ geometry })
      await col.deleteOne({ _id: res.insertedId })
      return 'accepted'
    } catch (err) {
      return /can't extract geo keys/i.test(err.message) ? 'geokeys' : 'other'
    }
  }

  const clone = (o) => JSON.parse(JSON.stringify(o))

  // Run the actual validate -> fix pipeline and return the repaired geometry.
  function repair (geometry) {
    const feature = { type: 'Feature', geometry: clone(geometry), properties: {} }
    const validation = validateGeoJson(feature)
    const { fixed } = fixGeoJson(feature, { validation })
    return fixed.geometry
  }

  it('is rejected by the 2dsphere index on the raw geometry', async () => {
    // Confirms the fixture is genuinely problematic; if this fails, the fixture
    // is fine and there is nothing to repair.
    expect(await tryInsert(clone(rawFeature.geometry))).toBe('geokeys')
  })

  it('is still rejected after truncate alone -- truncate is not enough', async () => {
    const wrapped = { type: 'Feature', geometry: clone(rawFeature.geometry), properties: {} }
    const truncated = truncateGeoJson(wrapped, { precision: 6 })
    expect(await tryInsert(truncated.geometry)).toBe('geokeys')
  })

  it('is accepted after the validate -> fix pipeline', async () => {
    expect(await tryInsert(repair(rawFeature.geometry))).toBe('accepted')
  })

  it('preserves the net area through the validate -> fix pipeline', () => {
    const ratio = geometryArea(repair(rawFeature.geometry)) / geometryArea(rawFeature.geometry)
    // On this fixture the "hole" becomes the gap between two polygons, so the
    // net area is preserved even though the topology changes.
    expect(ratio).toBeCloseTo(1, 3)
  })

  it('produces a well-formed ring geometry (closed rings, ring-based type)', () => {
    const g = repair(rawFeature.geometry)
    // Do not freeze MultiPolygon: it is specific to this degenerate fixture.
    expect(['Polygon', 'MultiPolygon']).toContain(g.type)
    const polygons = g.type === 'MultiPolygon' ? g.coordinates : [g.coordinates]
    for (const poly of polygons) {
      for (const ring of poly) {
        expect(ring.length).toBeGreaterThanOrEqual(4)
        expect(isClosedRing(ring)).toBe(true)
      }
    }
  })
})
