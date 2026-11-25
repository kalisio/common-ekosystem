import { randomUUID } from 'node:crypto'
import { MongoClient, ObjectId } from 'mongodb'
import { abilities, permissions } from '../../src/utilities/index.js'

const MONGO_URL = process.env.MONGO_URL || 'mongodb://127.0.0.1:27017'
const DATABASE = `common-authorization-test-${randomUUID()}`

const id = new ObjectId('64b7f0c2a1b2c3d4e5f60718')
const day = new Date('2026-01-01T00:00:00Z')

const documents = [
  { _id: 1, ownerId: id, tags: ['a', 'b'], count: 1, name: 'abc', nullField: null, date: day, published: true, locked: false, nested: { value: 1, other: 2 }, items: [{ value: 1, kind: 'x' }, { value: 2, kind: 'y' }] },
  { _id: 2, ownerId: new ObjectId(), tags: [], count: 5, name: 'ABD', nullField: 1, date: new Date('2025-01-01T00:00:00Z'), published: false, locked: true, nested: { value: 2 }, items: [{ value: 2, kind: 'x' }] },
  { _id: 3, ownerId: id.toHexString(), tags: ['c'], count: '5', name: 'xyz', published: true, locked: true, nested: { other: 2, value: 1 }, items: [] },
  { _id: 4, tags: 'a', count: null, published: false },
  { _id: 5 },
  { _id: 6, tags: [['a']], count: [1, 7], name: ['abx', 'zzz'], published: true },
  { _id: 7, count: 5n, name: '\u{1F600}' },
  { _id: 8, count: NaN, name: '\uFF61' }
]

const conditions = {
  'an equality on an array field': { tags: 'a' },
  'an equality to an array': { tags: ['a'] },
  'an equality to a subdocument': { nested: { value: 1, other: 2 } },
  'a dotted path': { 'nested.value': 1 },
  'a dotted path through an array': { 'items.value': 1 },
  'equalities on two paths through an array': { 'items.kind': 'x', 'items.value': 2 },
  'a missing field equal to null': { missing: null },
  'a null field': { nullField: null },
  'an equality to a number, a bigint included': { count: 5 },
  '$eq on an array': { tags: { $eq: ['a', 'b'] } },
  '$eq on a subdocument': { nested: { $eq: { value: 1, other: 2 } } },
  '$exists false': { missing: { $exists: false } },
  '$exists true on a null field': { nullField: { $exists: true } },
  '$ne null': { nullField: { $ne: null } },
  '$ne on an array field': { tags: { $ne: 'a' } },
  '$gt on mixed types': { count: { $gt: 1 } },
  '$gte on mixed types': { count: { $gte: 5 } },
  '$lt on missing and null values': { count: { $lt: 5 } },
  '$lte on mixed types': { count: { $lte: 5 } },
  '$gte on strings': { name: { $gte: 'a' } },
  '$gt on strings beyond the basic plane': { name: { $gt: '\uFF61' } },
  '$lt on dates': { date: { $lt: day } },
  '$gte on dates': { date: { $gte: new Date('2025-06-01T00:00:00Z') } },
  '$in on a value': { count: { $in: [5] } },
  '$in with null': { count: { $in: [null] } },
  '$in with an array': { tags: { $in: [['a', 'b']] } },
  '$in with a subdocument': { items: { $in: [{ value: 2, kind: 'x' }] } },
  '$in with a regular expression': { name: { $in: [/^ab/] } },
  '$in empty': { tags: { $in: [] } },
  '$nin on a value': { count: { $nin: [1] } },
  '$nin with null': { count: { $nin: [null] } },
  '$nin empty': { tags: { $nin: [] } },
  '$all, a scalar field included': { tags: { $all: ['a'] } },
  '$all with multiple values': { tags: { $all: ['a', 'b'] } },
  '$all empty': { tags: { $all: [] } },
  '$all with an array': { tags: { $all: [['a']] } },
  '$all with a regular expression': { tags: { $all: [/^a/] } },
  '$size 0': { tags: { $size: 0 } },
  '$size 2': { tags: { $size: 2 } },
  '$elemMatch on subdocuments': { items: { $elemMatch: { value: 1, kind: 'x' } } },
  '$elemMatch on scalar values': { count: { $elemMatch: { $gt: 1, $lt: 8 } } },
  '$elemMatch on nested arrays': { tags: { $elemMatch: { $eq: 'a' } } },
  '$elemMatch with $in on nested arrays': { tags: { $elemMatch: { $in: ['a'] } } },
  'a regular expression': { name: /^ab/ },
  '$regex with options': { name: { $regex: '^ab', $options: 'i' } },
  'an ObjectId': { ownerId: id },
  'an ObjectId in $in': { ownerId: { $in: [id] } },
  'an ObjectId in $nin': { ownerId: { $nin: [id] } },
  'the string of an ObjectId': { ownerId: id.toHexString() },
  'a date': { date: day },
  'a $and': { $and: [{ published: true }, { locked: false }] },
  'a $or': { $or: [{ count: 1 }, { published: false }] },
  'a $nor': { $nor: [{ count: 1 }, { published: false }] },
  'nested logical operators': {
    $and: [
      { $or: [{ 'nested.value': 1 }, { tags: { $size: 0 } }] },
      { $nor: [{ locked: true }] }
    ]
  }
}

const rules = {
  'no rules': [],
  'an unrelated action': [
    { action: 'create', subject: 'items' }
  ],
  'an unrelated subject': [
    { action: 'read', subject: 'users' }
  ],
  'an unconditional can rule': [
    { action: 'read', subject: 'items' }
  ],
  'a can rule with empty conditions': [
    { action: 'read', subject: 'items', conditions: {} }
  ],
  'an unconditional cannot rule': [
    { action: 'read', subject: 'items', conditions: { published: true } },
    { action: 'read', subject: 'items', inverted: true }
  ],
  'a cannot rule with empty conditions': [
    { action: 'read', subject: 'items' },
    { action: 'read', subject: 'items', inverted: true, conditions: {} }
  ],
  'a conditional cannot rule alone': [
    { action: 'read', subject: 'items', inverted: true, conditions: { locked: true } }
  ],
  'a conditional can rule overriding an unconditional cannot rule': [
    { action: 'read', subject: 'items', inverted: true },
    { action: 'read', subject: 'items', conditions: { published: true } }
  ],
  'an unconditional can rule overriding a conditional cannot rule': [
    { action: 'read', subject: 'items', inverted: true, conditions: { locked: true } },
    { action: 'read', subject: 'items' }
  ],
  'a cannot rule between can rules': [
    { action: 'read', subject: 'items', conditions: { ownerId: id } },
    { action: 'read', subject: 'items', inverted: true, conditions: { locked: true } },
    { action: 'read', subject: 'items', conditions: { published: true } }
  ],
  'a can rule overriding a cannot rule': [
    { action: 'read', subject: 'items', inverted: true, conditions: { locked: true } },
    { action: 'read', subject: 'items', conditions: { published: true } }
  ],
  'rules restricted to fields': [
    { action: 'read', subject: 'items', fields: ['title'], conditions: { published: true } },
    { action: 'read', subject: 'items', conditions: { ownerId: id } },
    { action: 'read', subject: 'items', inverted: true, fields: ['title'], conditions: { locked: true } }
  ],
  'rules with wildcard fields': [
    { action: 'read', subject: 'items', fields: ['nested.*'], conditions: { published: true } },
    { action: 'read', subject: 'items', inverted: true, fields: ['nested.other'] }
  ],
  'a manage rule on all subjects': [
    { action: 'manage', subject: 'all' }
  ]
}

describe('permissions.toMongoQuery against MongoDB', () => {
  let client
  let collection
  let storedDocuments

  beforeAll(async () => {
    client = new MongoClient(MONGO_URL)
    await client.connect()
    collection = client.db(DATABASE).collection('items')
    await collection.insertMany(documents)
    storedDocuments = await collection.find({}).sort({ _id: 1 }).toArray()
  })

  afterAll(async () => {
    if (client) {
      try {
        if (collection) await client.db(DATABASE).dropDatabase()
      } finally {
        await client.close()
      }
    }
  })

  async function findIds (ability, options = {}, action = 'read') {
    const query = permissions.toMongoQuery(ability, action, 'items', options)
    if (query === null) return []
    const found = await collection.find(query).sort({ _id: 1 }).toArray()
    return found.map(({ _id }) => _id)
  }

  function allowedIds (source, ability, options = {}, action = 'read') {
    return source
      .filter(document => permissions.can(ability, action, 'items', document, options))
      .map(({ _id }) => _id)
  }

  async function expectSameDocuments (ability, options = {}, action = 'read') {
    const ids = await findIds(ability, options, action)
    expect(ids, 'original documents').toEqual(allowedIds(documents, ability, options, action))
    expect(ids, 'stored documents').toEqual(allowedIds(storedDocuments, ability, options, action))
    return ids
  }

  describe('evaluates conditions as MongoDB does', () => {
    it.each(Object.entries(conditions))('allows documents with %s', async (name, condition) => {
      const ability = abilities.create([
        { action: 'read', subject: 'items', conditions: condition }
      ])
      await expectSameDocuments(ability)
    })
    it.each(Object.entries(conditions))('denies documents with %s', async (name, condition) => {
      const ability = abilities.create([
        { action: 'read', subject: 'items' },
        { action: 'read', subject: 'items', inverted: true, conditions: condition }
      ])
      await expectSameDocuments(ability)
    })
  })

  describe('applies the rules as permissions do', () => {
    it('denies all documents without an ability', async () => {
      expect(permissions.toMongoQuery(undefined, 'read', 'items')).toBeNull()
      expect(await expectSameDocuments(undefined)).toEqual([])
    })
    it.each(Object.entries(rules))('with %s', async (name, rules) => {
      const ability = abilities.create(rules)
      await expectSameDocuments(ability)
      for (const field of ['title', 'body', 'nested.value', 'nested.other']) {
        await expectSameDocuments(ability, { field })
      }
    })
    it('resolves action aliases', async () => {
      const ability = abilities.create([
        { action: 'read', subject: 'items', conditions: { published: true } }
      ], {
        aliases: { read: ['get', 'find'] }
      })
      for (const action of ['read', 'get', 'find']) {
        expect(await expectSameDocuments(ability, {}, action)).toEqual([1, 3, 6])
      }
    })
  })

  describe('resolves attributes as permissions do', () => {
    const ability = abilities.create([
      { action: 'read', subject: 'items', conditions: { context: 'org-1', published: true } },
      { action: 'read', subject: 'items', conditions: { context: { $in: ['org-2', 'org-3'] }, ownerId: id } },
      { action: 'read', subject: 'items', inverted: true, conditions: { context: 'org-3', locked: true } },
      {
        action: 'read',
        subject: 'items',
        conditions: abilities.mergeConditions(
          { $or: [{ tags: 'c' }, { count: 1 }] },
          { $or: [{ context: 'org-4' }, { context: 'org-5' }] }
        )
      }
    ])

    it.each(['org-1', 'org-2', 'org-3', 'org-4', 'org-5', 'org-6'])('in %s', async context => {
      await expectSameDocuments(ability, { attributes: { context } })
    })
    it('matches no document when a required attribute is missing', async () => {
      const scoped = abilities.create([
        { action: 'read', subject: 'items', conditions: { context: 'org-1' } }
      ])
      expect(await expectSameDocuments(scoped)).toEqual([])
    })
    it('excludes no document when a required attribute of a cannot rule is missing', async () => {
      const scoped = abilities.create([
        { action: 'read', subject: 'items', conditions: { published: true } },
        { action: 'read', subject: 'items', inverted: true, conditions: { context: 'org-1' } }
      ])
      expect(await expectSameDocuments(scoped)).toEqual([1, 3, 6])
    })
    it('allows all documents when an attribute-only can rule matches', async () => {
      const scoped = abilities.create([
        { action: 'read', subject: 'items', conditions: { context: 'org-1' } }
      ])
      const options = { attributes: { context: 'org-1' } }
      expect(permissions.toMongoQuery(scoped, 'read', 'items', options)).toEqual({})
      expect(await expectSameDocuments(scoped, options)).toEqual(documents.map(({ _id }) => _id))
    })
    it('denies all documents when an attribute-only can rule does not match', async () => {
      const scoped = abilities.create([
        { action: 'read', subject: 'items', conditions: { context: 'org-1' } }
      ])
      const options = { attributes: { context: 'org-2' } }
      expect(permissions.toMongoQuery(scoped, 'read', 'items', options)).toBeNull()
      expect(await expectSameDocuments(scoped, options)).toEqual([])
    })
    it('denies all documents when an attribute-only cannot rule matches', async () => {
      const scoped = abilities.create([
        { action: 'read', subject: 'items' },
        { action: 'read', subject: 'items', inverted: true, conditions: { context: 'org-1' } }
      ])
      const options = { attributes: { context: 'org-1' } }
      expect(permissions.toMongoQuery(scoped, 'read', 'items', options)).toBeNull()
      expect(await expectSameDocuments(scoped, options)).toEqual([])
    })
    it('allows all documents when an attribute-only cannot rule does not match', async () => {
      const scoped = abilities.create([
        { action: 'read', subject: 'items' },
        { action: 'read', subject: 'items', inverted: true, conditions: { context: 'org-1' } }
      ])
      const options = { attributes: { context: 'org-2' } }
      expect(permissions.toMongoQuery(scoped, 'read', 'items', options)).toEqual({})
      expect(await expectSameDocuments(scoped, options)).toEqual(documents.map(({ _id }) => _id))
    })
    it('combines attributes and field restrictions', async () => {
      const scoped = abilities.create([
        { action: 'read', subject: 'items', fields: ['title'], conditions: { context: 'org-1', published: true } }
      ])
      const attributes = { context: 'org-1' }
      expect(await expectSameDocuments(scoped, { attributes, field: 'title' })).toEqual([1, 3, 6])
      expect(await expectSameDocuments(scoped, { attributes, field: 'body' })).toEqual([])
    })
    it('resolves nested attribute paths', async () => {
      const scoped = abilities.create([
        { action: 'read', subject: 'items', conditions: { 'context.id': 'org-1', published: true } }
      ])
      const attributes = { context: { id: 'org-1' } }
      expect(await expectSameDocuments(scoped, { attributes })).toEqual([1, 3, 6])
    })
    it('rejects mixed attribute and document conditions under $or', () => {
      const scoped = abilities.create([
        {
          action: 'read',
          subject: 'items',
          conditions: {
            $or: [{ context: 'org-1' }, { published: true }]
          }
        }
      ])
      expect(() => permissions.toMongoQuery(scoped, 'read', 'items', {
        attributes: { context: 'org-1' }
      })).toThrow('rule mixes attributes and stored fields under $or')
    })
    it('rejects mixed attribute and document conditions under $nor', () => {
      const scoped = abilities.create([
        {
          action: 'read',
          subject: 'items',
          conditions: {
            $nor: [{ context: 'org-1' }, { published: true }]
          }
        }
      ])
      expect(() => permissions.toMongoQuery(scoped, 'read', 'items', {
        attributes: { context: 'org-1' }
      })).toThrow('rule mixes attributes and stored fields under $nor')
    })
  })
})
