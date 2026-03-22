import { DD } from './dd.js'
import { DDM } from './ddm.js'
import { DDMAero } from './ddm-aero.js'
import { DMS } from './dms.js'
export * from './converter.js'

export const COORDINATE_FORMATS = {
  DD: 'DD',
  DDM: 'DDM',
  DDM_AERO: 'DDM_AERO',
  DMS: 'DMS'
}

export const COORDINATE_MODELS = {
  DD,
  DDM,
  DDM_AERO: DDMAero,
  DMS
}
