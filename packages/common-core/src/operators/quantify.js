import { assert, is } from '../predicates'
import { math } from '../utilities'

const PREFIXES = {
  NONE: new Map([
    ['', { value: 1, scientific: true, symbol: '' }]
  ]),

  SHORT: new Map([
    ['', { value: 1, scientific: true, symbol: '' }],
    ['da', { value: 1e1, scientific: false, symbol: 'da' }],
    ['h', { value: 1e2, scientific: false, symbol: 'h' }],
    ['k', { value: 1e3, scientific: true, symbol: 'k' }],
    ['M', { value: 1e6, scientific: true, symbol: 'M' }],
    ['G', { value: 1e9, scientific: true, symbol: 'G' }],
    ['T', { value: 1e12, scientific: true, symbol: 'T' }],
    ['P', { value: 1e15, scientific: true, symbol: 'P' }],
    ['E', { value: 1e18, scientific: true, symbol: 'E' }],
    ['Z', { value: 1e21, scientific: true, symbol: 'Z' }],
    ['Y', { value: 1e24, scientific: true, symbol: 'Y' }],
    ['R', { value: 1e27, scientific: true, symbol: 'R' }],
    ['Q', { value: 1e30, scientific: true, symbol: 'Q' }],
    ['d', { value: 1e-1, scientific: false, symbol: 'd' }],
    ['c', { value: 1e-2, scientific: false, symbol: 'c' }],
    ['m', { value: 1e-3, scientific: true, symbol: 'm' }],
    ['u', { value: 1e-6, scientific: true, symbol: 'u' }],
    ['n', { value: 1e-9, scientific: true, symbol: 'n' }],
    ['p', { value: 1e-12, scientific: true, symbol: 'p' }],
    ['f', { value: 1e-15, scientific: true, symbol: 'f' }],
    ['a', { value: 1e-18, scientific: true, symbol: 'a' }],
    ['z', { value: 1e-21, scientific: true, symbol: 'z' }],
    ['y', { value: 1e-24, scientific: true, symbol: 'y' }],
    ['r', { value: 1e-27, scientific: true, symbol: 'r' }],
    ['q', { value: 1e-30, scientific: true, symbol: 'q' }]
  ]),

  LONG: new Map([
    ['', { value: 1, scientific: true, symbol: '' }],
    ['deca', { value: 1e1, scientific: false, symbol: 'da' }],
    ['hecto', { value: 1e2, scientific: false, symbol: 'h' }],
    ['kilo', { value: 1e3, scientific: true, symbol: 'k' }],
    ['mega', { value: 1e6, scientific: true, symbol: 'M' }],
    ['giga', { value: 1e9, scientific: true, symbol: 'G' }],
    ['tera', { value: 1e12, scientific: true, symbol: 'T' }],
    ['peta', { value: 1e15, scientific: true, symbol: 'P' }],
    ['exa', { value: 1e18, scientific: true, symbol: 'E' }],
    ['zetta', { value: 1e21, scientific: true, symbol: 'Z' }],
    ['yotta', { value: 1e24, scientific: true, symbol: 'Y' }],
    ['ronna', { value: 1e27, scientific: true, symbol: 'R' }],
    ['quetta', { value: 1e30, scientific: true, symbol: 'Q' }],
    ['deci', { value: 1e-1, scientific: false, symbol: 'd' }],
    ['centi', { value: 1e-2, scientific: false, symbol: 'c' }],
    ['milli', { value: 1e-3, scientific: true, symbol: 'm' }],
    ['micro', { value: 1e-6, scientific: true, symbol: 'u' }],
    ['nano', { value: 1e-9, scientific: true, symbol: 'n' }],
    ['pico', { value: 1e-12, scientific: true, symbol: 'p' }],
    ['femto', { value: 1e-15, scientific: true, symbol: 'f' }],
    ['atto', { value: 1e-18, scientific: true, symbol: 'a' }],
    ['zepto', { value: 1e-21, scientific: true, symbol: 'z' }],
    ['yocto', { value: 1e-24, scientific: true, symbol: 'y' }],
    ['ronto', { value: 1e-27, scientific: true, symbol: 'r' }],
    ['quecto', { value: 1e-30, scientific: true, symbol: 'q' }]
  ]),

  SQUARED: new Map([
    ['', { value: 1, scientific: true, symbol: '' }],
    ['da', { value: 1e2, scientific: false, symbol: 'da²' }],
    ['h', { value: 1e4, scientific: false, symbol: 'h²' }],
    ['k', { value: 1e6, scientific: true, symbol: 'k²' }],
    ['M', { value: 1e12, scientific: true, symbol: 'M²' }],
    ['G', { value: 1e18, scientific: true, symbol: 'G²' }],
    ['T', { value: 1e24, scientific: true, symbol: 'T²' }],
    ['P', { value: 1e30, scientific: true, symbol: 'P²' }],
    ['E', { value: 1e36, scientific: true, symbol: 'E²' }],
    ['Z', { value: 1e42, scientific: true, symbol: 'Z²' }],
    ['Y', { value: 1e48, scientific: true, symbol: 'Y²' }],
    ['R', { value: 1e54, scientific: true, symbol: 'R²' }],
    ['Q', { value: 1e60, scientific: true, symbol: 'Q²' }],
    ['d', { value: 1e-2, scientific: false, symbol: 'd²' }],
    ['c', { value: 1e-4, scientific: false, symbol: 'c²' }],
    ['m', { value: 1e-6, scientific: true, symbol: 'm²' }],
    ['u', { value: 1e-12, scientific: true, symbol: 'u²' }],
    ['n', { value: 1e-18, scientific: true, symbol: 'n²' }],
    ['p', { value: 1e-24, scientific: true, symbol: 'p²' }],
    ['f', { value: 1e-30, scientific: true, symbol: 'f²' }],
    ['a', { value: 1e-36, scientific: true, symbol: 'a²' }],
    ['z', { value: 1e-42, scientific: true, symbol: 'z²' }],
    ['y', { value: 1e-48, scientific: true, symbol: 'y²' }],
    ['r', { value: 1e-54, scientific: true, symbol: 'r²' }],
    ['q', { value: 1e-60, scientific: true, symbol: 'q²' }]
  ]),

  CUBIC: new Map([
    ['', { value: 1, scientific: true, symbol: '' }],
    ['da', { value: 1e3, scientific: false, symbol: 'da³' }],
    ['h', { value: 1e6, scientific: false, symbol: 'h³' }],
    ['k', { value: 1e9, scientific: true, symbol: 'k³' }],
    ['M', { value: 1e18, scientific: true, symbol: 'M³' }],
    ['G', { value: 1e27, scientific: true, symbol: 'G³' }],
    ['T', { value: 1e36, scientific: true, symbol: 'T³' }],
    ['P', { value: 1e45, scientific: true, symbol: 'P³' }],
    ['E', { value: 1e54, scientific: true, symbol: 'E³' }],
    ['Z', { value: 1e63, scientific: true, symbol: 'Z³' }],
    ['Y', { value: 1e72, scientific: true, symbol: 'Y³' }],
    ['R', { value: 1e81, scientific: true, symbol: 'R³' }],
    ['Q', { value: 1e90, scientific: true, symbol: 'Q³' }],
    ['d', { value: 1e-3, scientific: false, symbol: 'd³' }],
    ['c', { value: 1e-6, scientific: false, symbol: 'c³' }],
    ['m', { value: 1e-9, scientific: true, symbol: 'm³' }],
    ['u', { value: 1e-18, scientific: true, symbol: 'u³' }],
    ['n', { value: 1e-27, scientific: true, symbol: 'n³' }],
    ['p', { value: 1e-36, scientific: true, symbol: 'p³' }],
    ['f', { value: 1e-45, scientific: true, symbol: 'f³' }],
    ['a', { value: 1e-54, scientific: true, symbol: 'a³' }],
    ['z', { value: 1e-63, scientific: true, symbol: 'z³' }],
    ['y', { value: 1e-72, scientific: true, symbol: 'y³' }],
    ['r', { value: 1e-81, scientific: true, symbol: 'r³' }],
    ['q', { value: 1e-90, scientific: true, symbol: 'q³' }]
  ]),

  BINARY_SHORT_SI: new Map([
    ['', { value: 1, scientific: true, symbol: '' }],
    ['k', { value: 1e3, scientific: true, symbol: 'k' }],
    ['M', { value: 1e6, scientific: true, symbol: 'M' }],
    ['G', { value: 1e9, scientific: true, symbol: 'G' }],
    ['T', { value: 1e12, scientific: true, symbol: 'T' }],
    ['P', { value: 1e15, scientific: true, symbol: 'P' }],
    ['E', { value: 1e18, scientific: true, symbol: 'E' }],
    ['Z', { value: 1e21, scientific: true, symbol: 'Z' }],
    ['Y', { value: 1e24, scientific: true, symbol: 'Y' }]
  ]),

  BINARY_SHORT_IEC: new Map([
    ['', { value: 1, scientific: true, symbol: '' }],
    ['Ki', { value: 1024, scientific: true, symbol: 'Ki' }],
    ['Mi', { value: 1024 ** 2, scientific: true, symbol: 'Mi' }],
    ['Gi', { value: 1024 ** 3, scientific: true, symbol: 'Gi' }],
    ['Ti', { value: 1024 ** 4, scientific: true, symbol: 'Ti' }],
    ['Pi', { value: 1024 ** 5, scientific: true, symbol: 'Pi' }],
    ['Ei', { value: 1024 ** 6, scientific: true, symbol: 'Ei' }],
    ['Zi', { value: 1024 ** 7, scientific: true, symbol: 'Zi' }],
    ['Yi', { value: 1024 ** 8, scientific: true, symbol: 'Yi' }]
  ]),

  BINARY_LONG_SI: new Map([
    ['', { value: 1, scientific: true, symbol: '' }],
    ['kilo', { value: 1e3, scientific: true, symbol: 'k' }],
    ['mega', { value: 1e6, scientific: true, symbol: 'M' }],
    ['giga', { value: 1e9, scientific: true, symbol: 'G' }],
    ['tera', { value: 1e12, scientific: true, symbol: 'T' }],
    ['peta', { value: 1e15, scientific: true, symbol: 'P' }],
    ['exa', { value: 1e18, scientific: true, symbol: 'E' }],
    ['zetta', { value: 1e21, scientific: true, symbol: 'Z' }],
    ['yotta', { value: 1e24, scientific: true, symbol: 'Y' }]
  ]),

  BINARY_LONG_IEC: new Map([
    ['', { value: 1, scientific: true, symbol: '' }],
    ['kibi', { value: 1024, scientific: true, symbol: 'Ki' }],
    ['mebi', { value: 1024 ** 2, scientific: true, symbol: 'Mi' }],
    ['gibi', { value: 1024 ** 3, scientific: true, symbol: 'Gi' }],
    ['tebi', { value: 1024 ** 4, scientific: true, symbol: 'Ti' }],
    ['pebi', { value: 1024 ** 5, scientific: true, symbol: 'Pi' }],
    ['exbi', { value: 1024 ** 6, scientific: true, symbol: 'Ei' }],
    ['zebi', { value: 1024 ** 7, scientific: true, symbol: 'Zi' }],
    ['yobi', { value: 1024 ** 8, scientific: true, symbol: 'Yi' }]
  ]),

  BTU: new Map([
    ['', { value: 1, scientific: true, symbol: '' }],
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
      assert.that(unit.type === dstUnit.type, is.booleanTrue, `Incompatible unit types: "${unit.type}" → "${dstUnit.type}"`)
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
