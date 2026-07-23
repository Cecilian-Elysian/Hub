import { test, describe, beforeEach } from 'node:test'
import assert from 'node:assert/strict'

import './setup.js'
import { loadHub } from './helper.js'

describe('storage', () => {
  beforeEach(() => {
    if (typeof globalThis._resetMock === 'function') globalThis._resetMock()
  })

  test('set and get roundtrip', () => {
    const hub = loadHub(['namespace.js', 'constants.js', 'config.js', 'core/storage.js'])
    hub.storage.set('foo', { a: 1 })
    assert.deepEqual(hub.storage.get('foo'), { a: 1 })
  })

  test('get returns default when missing', () => {
    const hub = loadHub(['namespace.js', 'constants.js', 'config.js', 'core/storage.js'])
    assert.equal(hub.storage.get('missing', 'fallback'), 'fallback')
  })

  test('has reports existence', () => {
    const hub = loadHub(['namespace.js', 'constants.js', 'config.js', 'core/storage.js'])
    hub.storage.set('present', 1)
    assert.equal(hub.storage.has('present'), true)
    assert.equal(hub.storage.has('absent'), false)
  })

  test('remove deletes key', () => {
    const hub = loadHub(['namespace.js', 'constants.js', 'config.js', 'core/storage.js'])
    hub.storage.set('temp', 'x')
    assert.equal(hub.storage.remove('temp'), true)
    assert.equal(hub.storage.has('temp'), false)
    assert.equal(hub.storage.remove('temp'), false)
  })

  test('keys lists all stored keys', () => {
    const hub = loadHub(['namespace.js', 'constants.js', 'config.js', 'core/storage.js'])
    hub.storage.set('a', 1)
    hub.storage.set('b', 2)
    assert.deepEqual(hub.storage.keys().sort(), ['a', 'b'])
  })

  test('size counts all keys', () => {
    const hub = loadHub(['namespace.js', 'constants.js', 'config.js', 'core/storage.js'])
    hub.storage.set('a', 1)
    hub.storage.set('b', 2)
    assert.equal(hub.storage.size(), 2)
  })

  test('clear removes all keys', () => {
    const hub = loadHub(['namespace.js', 'constants.js', 'config.js', 'core/storage.js'])
    hub.storage.set('a', 1)
    hub.storage.set('b', 2)
    hub.storage.clear()
    assert.equal(hub.storage.size(), 0)
  })

  test('clear with prefix only removes prefixed keys', () => {
    const hub = loadHub(['namespace.js', 'constants.js', 'config.js', 'core/storage.js'])
    hub.storage.set('keep', 1)
    hub.storage.set('drop:x', 2)
    hub.storage.clear('drop:')
    assert.equal(hub.storage.has('keep'), true)
    assert.equal(hub.storage.has('drop:x'), false)
  })
})