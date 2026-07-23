import { test, describe, beforeEach } from 'node:test'
import assert from 'node:assert/strict'

import './setup.js'
import { loadHub } from './helper.js'

const SOURCES = [
  'namespace.js', 'constants.js', 'config.js', 'registry.js',
  'utils/log.js', 'core/storage.js', 'core/takeover.js',
]

describe('takeover', () => {
  let tk
  beforeEach(() => {
    if (typeof globalThis._resetMock === 'function') globalThis._resetMock()
    const hub = loadHub(SOURCES)
    tk = hub.takeover
  })

  test('markActive writes timestamp', () => {
    tk.markActive()
    const ts = globalThis._getMock('active-ts')
    assert.ok(ts > 0)
    assert.ok(Date.now() - ts < 1000)
  })

  test('isHubActive respects TTL', () => {
    globalThis._setMock('active-ts', Date.now())
    assert.equal(tk.isHubActive(), true)
    globalThis._setMock('active-ts', Date.now() - 8 * 86400000)
    assert.equal(tk.isHubActive(), false)
  })

  test('isHidden returns false when Hub inactive', () => {
    globalThis._setMock('hidden', ['bookmarks'])
    globalThis._setMock('active-ts', Date.now() - 8 * 86400000)
    assert.equal(tk.isHidden('bookmarks'), false)
  })

  test('isHidden reflects active hidden list', () => {
    globalThis._setMock('active-ts', Date.now())
    globalThis._setMock('hidden', ['bookmarks'])
    assert.equal(tk.isHidden('bookmarks'), true)
    assert.equal(tk.isHidden('news'), false)
  })

  test('setHidden toggles membership', () => {
    globalThis._setMock('active-ts', Date.now())
    tk.setHidden('bookmarks', true)
    assert.deepEqual(globalThis._getMock('hidden'), ['bookmarks'])
    tk.setHidden('bookmarks', false)
    assert.deepEqual(globalThis._getMock('hidden'), [])
  })

  test('takeOverAll and restoreAll work', () => {
    globalThis._setMock('active-ts', Date.now())
    const all = tk.takeOverAll()
    assert.ok(all.length >= 2)
    tk.restoreAll()
    assert.equal(globalThis._getMock('hidden'), undefined)
  })

  test('purgeExpired clears stale state', () => {
    globalThis._setMock('active-ts', Date.now() - 8 * 86400000)
    globalThis._setMock('hidden', ['bookmarks'])
    assert.equal(tk.purgeExpired(), true)
    assert.equal(globalThis._getMock('hidden'), undefined)
    assert.equal(globalThis._getMock('active-ts'), undefined)
  })
})