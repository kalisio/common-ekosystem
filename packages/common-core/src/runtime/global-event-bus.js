import { assert, is } from '../predicates/index.js'
import { EventBus } from './event-bus.js'

let globalEventBus = null

export function setGlobalEventBus (bus) {
  assert.that(bus, value => is.instanceOf(value, EventBus), 'bus must be an instance of EventBus')
  globalEventBus = bus
}

export function getGlobalEventBus () {
  return globalEventBus
}
