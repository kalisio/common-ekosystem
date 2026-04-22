import { assert } from '@kalisio/kore'
import { DDM } from './ddm.js'
import { DDMAero } from './ddm-aero.js'
import { DMS } from './dms.js'

function decimalToDDM (dd) {
  const degrees = Math.floor(dd.degrees)
  const minutes = (dd.degrees - degrees) * 60
  return { degrees, minutes, direction: dd.direction }
}

function decimalToDMS (dd) {
  const degrees = Math.floor(dd.degrees)
  const minutesDecimal = (dd.degrees - degrees) * 60
  const minutes = Math.floor(minutesDecimal)
  const seconds = (minutesDecimal - minutes) * 60
  return { degrees, minutes, seconds, direction: dd.direction }
}

export const converter = {
  DD: (dd) => {
    assert.that(dd, (v) => v.isValid(), 'dd must be a valid coordinate')
    return dd
  },

  DDM: (dd) => {
    assert.that(dd, (v) => v.isValid(), 'dd must be a valid coordinate')
    const { degrees, minutes, direction } = decimalToDDM(dd)
    return DDM(direction ? { degrees, minutes, direction } : { degrees, minutes })
  },

  DMS: (dd) => {
    assert.that(dd, (v) => v.isValid(), 'dd must be a valid coordinate')
    const { degrees, minutes, seconds, direction } = decimalToDMS(dd)
    return DMS(direction ? { degrees, minutes, seconds, direction } : { degrees, minutes, seconds })
  },

  DDM_AERO: (dd) => {
    assert.that(dd, (v) => v.isValid(), 'dd must be a valid coordinate')
    const { degrees, minutes, direction } = decimalToDDM(dd)
    return DDMAero({ degrees, minutes, direction })
  }
}
