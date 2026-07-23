import { test, describe } from 'node:test'
import assert from 'node:assert/strict'

import './setup.js'
import { loadHub } from './helper.js'

describe('registry', () => {
  test('contains expected scripts', () => {
    const hub = loadHub(['namespace.js', 'constants.js', 'config.js', 'registry.js'])
    const ids = hub.registry.getIds()
    assert.ok(ids.includes('bookmarks'))
    assert.ok(ids.includes('news'))
  })

  test('getById returns correct meta', () => {
    const hub = loadHub(['namespace.js', 'constants.js', 'config.js', 'registry.js'])
    const bm = hub.registry.getById('bookmarks')
    assert.equal(bm.namespace, 'BookmarkLogger')
    assert.equal(bm.name, '网址收藏')
    assert.ok(bm.installUrl)
  })

  test('getByNamespace reverse lookup works', () => {
    const hub = loadHub(['namespace.js', 'constants.js', 'config.js', 'registry.js'])
    const entry = hub.registry.getByNamespace('NewsAggregator')
    assert.equal(entry.id, 'news')
  })

  test('getById returns null for unknown id', () => {
    const hub = loadHub(['namespace.js', 'constants.js', 'config.js', 'registry.js'])
    assert.equal(hub.registry.getById('nope'), null)
  })

  test('getEnabled returns all by default', () => {
    const hub = loadHub(['namespace.js', 'constants.js', 'config.js', 'registry.js'])
    const enabled = hub.registry.getEnabled()
    assert.equal(enabled.length, hub.registry.getAll().length)
  })

  test('each entry has required fields', () => {
    const hub = loadHub(['namespace.js', 'constants.js', 'config.js', 'registry.js'])
    for (const meta of hub.registry.getAll()) {
      assert.ok(meta.id, 'missing id')
      assert.ok(meta.namespace, 'missing namespace for ' + meta.id)
      assert.ok(meta.name, 'missing name for ' + meta.id)
      assert.ok(meta.icon, 'missing icon for ' + meta.id)
      assert.ok(meta.installUrl, 'missing installUrl for ' + meta.id)
    }
  })
})