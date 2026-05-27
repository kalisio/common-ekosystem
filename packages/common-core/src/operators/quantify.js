import { assert, is } from '../predicates'
import { math } from '../utilities'

const EMPTY_PREFIX = ['', { value: 1, scientific: true, symbol: '' }]

const METRIC_PREFIXES = [
  ['deca', 'da', 1, false],
  ['hecto', 'h', 2, false],
  ['kilo', 'k', 3, true],
  ['mega', 'M', 6, true],
  ['giga', 'G', 9, true],
  ['tera', 'T', 12, true],
  ['peta', 'P', 15, true],
  ['exa', 'E', 18, true],
  ['zetta', 'Z', 21, true],
  ['yotta', 'Y', 24, true],
  ['ronna', 'R', 27, true],
  ['quetta', 'Q', 30, true],

  ['deci', 'd', -1, false],
  ['centi', 'c', -2, false],
  ['milli', 'm', -3, true],
  ['micro', 'u', -6, true],
  ['nano', 'n', -9, true],
  ['pico', 'p', -12, true],
  ['femto', 'f', -15, true],
  ['atto', 'a', -18, true],
  ['zepto', 'z', -21, true],
  ['yocto', 'y', -24, true],
  ['ronto', 'r', -27, true],
  ['quecto', 'q', -30, true]
]

function powerSymbol (power) {
  if (power === 2) return '²'
  if (power === 3) return '³'
  return ''
}

function createMetricPrefixes ({ long = false, power = 1 } = {}) {
  return new Map([
    EMPTY_PREFIX,
    ...METRIC_PREFIXES.map(([longName, shortName, exponent, scientific]) => {
      const key = long ? longName : shortName
      return [
        key,
        {
          value: 10 ** (exponent * power),
          scientific,
          symbol: `${shortName}${powerSymbol(power)}`
        }
      ]
    })
  ])
}

const BINARY_PREFIXES = [
  ['kilo', 'k', 'kibi', 'Ki', 1],
  ['mega', 'M', 'mebi', 'Mi', 2],
  ['giga', 'G', 'gibi', 'Gi', 3],
  ['tera', 'T', 'tebi', 'Ti', 4],
  ['peta', 'P', 'pebi', 'Pi', 5],
  ['exa', 'E', 'exbi', 'Ei', 6],
  ['zetta', 'Z', 'zebi', 'Zi', 7],
  ['yotta', 'Y', 'yobi', 'Yi', 8]
]

function createBinaryPrefixes ({ long = false, iec = false } = {}) {
  return new Map([
    EMPTY_PREFIX,
    ...BINARY_PREFIXES.map(([siLong, siShort, iecLong, iecShort, exponent]) => {
      const key = long
        ? (iec ? iecLong : siLong)
        : (iec ? iecShort : siShort)

      const symbol = iec ? iecShort : siShort
      return [
        key,
        {
          value: (iec ? 1024 : 1000) ** exponent,
          scientific: true,
          symbol
        }
      ]
    })
  ])
}

const PREFIXES = {
  NONE: new Map([EMPTY_PREFIX]),

  SHORT: createMetricPrefixes(),
  LONG: createMetricPrefixes({ long: true }),

  SQUARED: createMetricPrefixes({ power: 2 }),
  CUBIC: createMetricPrefixes({ power: 3 }),

  BINARY_SHORT_SI: createBinaryPrefixes(),
  BINARY_SHORT_IEC: createBinaryPrefixes({ iec: true }),

  BINARY_LONG_SI: createBinaryPrefixes({ long: true }),
  BINARY_LONG_IEC: createBinaryPrefixes({ long: true, iec: true }),

  BTU: new Map([
    EMPTY_PREFIX,
    ['MM', { value: 1e6, scientific: true, symbol: 'MM' }]
  ])
}

function resolveUnit (unitCode, unitSystem) {
  if (unitSystem.has(unitCode)) {
    const unit = unitSystem.get(unitCode)
    const group = unit.prefixes ? PREFIXES[unit.prefixes] : null
    const scientific = group ? group.get('').scientific : true
    return { ...unit, scientific }
  }
  for (const [baseCode, baseUnit] of unitSystem) {
    if (!baseUnit.prefixes) continue
    const group = PREFIXES[baseUnit.prefixes]
    if (!group) continue
    for (const [prefixCode, prefix] of group) {
      if (prefixCode && unitCode === prefixCode + baseCode) {
        return {
          ...baseUnit,
          factor: prefix.value * baseUnit.factor,
          scientific: prefix.scientific,
          symbol: prefix.symbol + baseUnit.symbol
        }
      }
    }
  }
}

export function quantify (value, unitCode, unitSystem) {
  assert.all([
    { value, validator: is.number, message: 'value must be a number' },
    { value: unitCode, validator: is.nonEmptyString, message: 'unitCode must be a non empty string' },
    { value: unitSystem, validator: is.nonEmptyMap, message: 'unitSystem must be a non empty map' }
  ])
  const unit = resolveUnit(unitCode, unitSystem)
  assert.that(unit, is.defined, `Unknown unit: ${unitCode}`)
  return {
    value,
    unit,

    to (dstUnitCode) {
      assert.that(dstUnitCode, is.nonEmptyString, 'dstUnitCode must be a non empty string')
      const dstUnit = resolveUnit(dstUnitCode, unitSystem)
      assert.that(dstUnit, is.defined, `Unknown unit: ${dstUnitCode}`)
      assert.that(
        unit.type === dstUnit.type,
        is.booleanTrue,
        `Incompatible unit types: "${unit.type}" → "${dstUnit.type}"`
      )
      const base = value * unit.factor
      return quantify(base / dstUnit.factor, dstUnitCode, unitSystem)
    },

    toString (decimals = 2) {
      const symbol = unit.symbol ?? unitCode
      if (unit.scientific) {
        return `${math.exponential(value, decimals)} ${symbol}`
      }
      return `${math.round(value, decimals)} ${symbol}`
    }
  }
}
