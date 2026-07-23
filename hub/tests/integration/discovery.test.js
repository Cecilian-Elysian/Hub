import { test, describe, beforeEach } from 'node:test'
import assert from 'node:assert/strict'

import '../setup.js'
import { runWithSandbox } from '../helper.js'

const SOURCES = [
  'namespace.js', 'constants.js', 'config.js', 'registry.js',
  'utils/log.js', 'utils/format.js', 'utils/notify.js',
  'core/storage.js', 'core/takeover.js', 'core/detector.js',
  'core/badge.js', 'core/listener.js',
]

describe('integration: discovery', () => {
  beforeEach(() => {
    if (typeof globalThis._resetMock === 'function') globalThis._resetMock()
  })

  test('listener detects script via loaded event', () => {
    const sandbox = runWithSandbox(SOURCES, `
      var listener = CatHub.listener
      listener.start()
      var events = []
      listener.onDiscover(function(id, src) { events.push({ id: id, src: src }) })
      var evt = new CustomEvent(CatHub.constants.EVENTS.SCRIPT_LOADED, { detail: { id: 'bookmarks' } })
      window.dispatchEvent(evt)
      return { events: events, installed: listener.getInstalled() }
    `)
    assert.equal(sandbox._result.events.length, 1)
    assert.equal(sandbox._result.events[0].id, 'bookmarks')
    assert.equal(sandbox._result.events[0].src, 'event')
    assert.ok(sandbox._result.installed.includes('bookmarks'))
  })

  test('listener ignores unknown script ids', () => {
    const sandbox = runWithSandbox(SOURCES, `
      var listener = CatHub.listener
      listener.start()
      var events = []
      listener.onDiscover(function(id) { events.push(id) })
      var evt = new CustomEvent(CatHub.constants.EVENTS.SCRIPT_LOADED, { detail: { id: 'unknown-script' } })
      window.dispatchEvent(evt)
      return events
    `)
    assert.equal(sandbox._result.length, 0)
  })

  test('detector + badge integration', () => {
    const sandbox = runWithSandbox(SOURCES, `
      window.BookmarkLogger = {
        meta: { id: 'bookmarks', name: '网址收藏' },
        ui: { panel: { openPanel: function() {} } },
        storage: { getStats: function() { return { primary: { count: 10, label: '条' } } } },
      }
      window.NewsAggregator = {
        meta: { id: 'news', name: '新闻聚合' },
        ui: { panel: { openPanel: function() {} } },
        storage: { getStats: function() { return { primary: { count: 5, label: '未读' } } } },
      }
      var installed = CatHub.detector.scanWindow()
      var all = CatHub.badge.refresh(true)
      var total = CatHub.badge.totalUnread()
      return { installed: installed, total: total, keys: Array.from(all.keys()) }
    `)
    assert.equal(sandbox._result.installed.length, 2)
    assert.equal(sandbox._result.total, 15)
    assert.ok(sandbox._result.keys.includes('bookmarks'))
    assert.ok(sandbox._result.keys.includes('news'))
  })
})

describe('integration: takeover', () => {
  beforeEach(() => {
    if (typeof globalThis._resetMock === 'function') globalThis._resetMock()
  })

  test('full takeover flow', () => {
    const sandbox = runWithSandbox(SOURCES, `
      var tk = CatHub.takeover
      tk.markActive()
      tk.takeOverAll()
      var list = tk.getHidden()
      var bmHidden = tk.isHidden('bookmarks')
      tk.setHidden('bookmarks', false)
      var afterRestore = tk.isHidden('bookmarks')
      return { list: list, bmHidden: bmHidden, afterRestore: afterRestore }
    `)
    assert.ok(sandbox._result.list.length >= 2)
    assert.equal(sandbox._result.bmHidden, true)
    assert.equal(sandbox._result.afterRestore, false)
  })

  test('Hub expiry clears stale hidden list', () => {
    globalThis._setMock('active-ts', Date.now() - 8 * 86400000)
    const sandbox = runWithSandbox(SOURCES, `
      var tk = CatHub.takeover
      var purged = tk.purgeExpired()
      var list = tk.getHidden()
      return { purged: purged, list: list }
    `)
    assert.equal(sandbox._result.purged, true)
    assert.equal(sandbox._result.list.length, 0)
  })
})