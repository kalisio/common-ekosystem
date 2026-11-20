import { is } from '@kalisio/common-core/predicates'
import { Clock } from './clock.js'

let fallback = null
let current = null

// Created on first use and recreated if disposed
function getFallback () {
  if (!fallback || fallback.disposed) {
    fallback = new Clock()
  }
  return fallback
}

export function setCurrentClock (clock) {
  const next = clock ?? null
  if (next !== null && !is.instanceOf(next, Clock)) {
    throw new TypeError('setCurrentClock expects a Clock instance')
  }
  if (next?.disposed) {
    throw new Error('setCurrentClock expects a Clock that has not been disposed')
  }
  current = next
}

export function getCurrentClock () {
  if (current?.disposed) {
    throw new Error('Current Clock has been disposed')
  }
  return current ?? getFallback()
}
