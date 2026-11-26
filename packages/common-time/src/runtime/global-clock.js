import { assert, is } from '@kalisio/common-core/predicates'
import { Clock } from './clock.js'

let globalClock

export function setGlobalClock (clock) {
  assert.that(clock, v => is.instanceOf(v, Clock), 'clock must be a Clock instance')
  globalClock = clock
}

export function getGlobalClock () {
  assert.that(globalClock, is.defined, 'global clock must be configured')
  return globalClock
}
