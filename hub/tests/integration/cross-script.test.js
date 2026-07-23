import { test, describe, beforeEach } from 'node:test'
import assert from 'node:assert/strict'

import '../setup.js'
import { runWithSandbox } from '../helper.js'

const HUB_SOURCES = [
  'namespace.js', 'constants.js', 'config.js', 'registry.js',
  'utils/log.js', 'utils/format.js', 'utils/notify.js',
  'core/storage.js', 'core/takeover.js', 'core/detector.js',
  'core/badge.js', 'core/listener.js',
]

const BOOKMARK_META = {
  id: 'bookmarks',
  name: '网址收藏',
  icon: 'bookmark',
  description: '导入/导出浏览器书签',
  version: '0.2.0',
  author: 'Cecilian-Elysian',
}

const NEWS_META = {
  id: 'news',
  name: '新闻聚合',
  icon: 'newspaper',
  description: '多源新闻抓取与聚合',
  version: '0.2.0',
  author: 'Cecilian-Elysian',
}

describe('integration: cross-script discovery', () => {
  beforeEach(() => {
    if (typeof globalThis._resetMock === 'function') globalThis._resetMock()
  })

  test('Hub detects both bookmarks and news via window scan', () => {
    const sandbox = runWithSandbox(HUB_SOURCES, `
      window.BookmarkLogger = {
        meta: ${JSON.stringify(BOOKMARK_META)},
        ui: { panel: { openPanel: function() { return 'bm-opened' } } },
        storage: { getStats: function() { return { primary: { count: 50, label: '条' } } } },
      }
      window.NewsAggregator = {
        meta: ${JSON.stringify(NEWS_META)},
        ui: { panel: { openPanel: function() { return 'news-opened' } } },
        storage: { getStats: function() { return { primary: { count: 12, label: '未读' } } } },
      }
      var installed = CatHub.detector.scanWindow()
      var bmReady = CatHub.detector.isReady('bookmarks')
      var newsReady = CatHub.detector.isReady('news')
      return { installed: installed, bmReady: bmReady, newsReady: newsReady }
    `)
    assert.equal(sandbox._result.installed.length, 2)
    const ids = sandbox._result.installed.map(i => i.id)
    assert.ok(ids.includes('bookmarks'))
    assert.ok(ids.includes('news'))
    assert.equal(sandbox._result.bmReady, true)
    assert.equal(sandbox._result.newsReady, true)
  })

  test('Hub opens target script panel', () => {
    const sandbox = runWithSandbox(HUB_SOURCES, `
      window.BookmarkLogger = {
        meta: ${JSON.stringify(BOOKMARK_META)},
        ui: { panel: { openPanel: function() { return 'bm-opened' } } },
        storage: {},
      }
      return {
        bmResult: CatHub.detector.openScript('bookmarks'),
        badResult: CatHub.detector.openScript('nonexistent'),
      }
    `)
    assert.equal(sandbox._result.bmResult, true)
    assert.equal(sandbox._result.badResult, false)
  })

  test('Hub aggregates badges from both scripts', () => {
    const sandbox = runWithSandbox(HUB_SOURCES, `
      window.BookmarkLogger = {
        meta: ${JSON.stringify(BOOKMARK_META)},
        ui: { panel: { openPanel: function() {} } },
        storage: { getStats: function() { return { primary: { count: 100, label: '条' } } } },
      }
      window.NewsAggregator = {
        meta: ${JSON.stringify(NEWS_META)},
        ui: { panel: { openPanel: function() {} } },
        storage: { getStats: function() { return { primary: { count: 42, label: '未读' } } } },
      }
      var all = CatHub.badge.refresh(true)
      var total = CatHub.badge.totalUnread()
      var bmStats = CatHub.badge.get('bookmarks')
      var newsStats = CatHub.badge.get('news')
      return { total: total, bmCount: bmStats.primary.count, newsCount: newsStats.primary.count }
    `)
    assert.equal(sandbox._result.total, 142)
    assert.equal(sandbox._result.bmCount, 100)
    assert.equal(sandbox._result.newsCount, 42)
  })

  test('Hub detects new scripts via loaded event during runtime', () => {
    const sandbox = runWithSandbox(HUB_SOURCES, `
      CatHub.listener.start()
      var events = []
      CatHub.listener.onDiscover(function(id, src) { events.push({ id: id, src: src }) })
      window.NewsAggregator = {
        meta: ${JSON.stringify(NEWS_META)},
        ui: { panel: { openPanel: function() {} } },
        storage: { getStats: function() { return { primary: { count: 5, label: '未读' } } } },
      }
      var evt = new CustomEvent(CatHub.constants.EVENTS.SCRIPT_LOADED, { detail: { id: 'news', version: '0.2.0' } })
      window.dispatchEvent(evt)
      return { events: events, installed: CatHub.listener.getInstalled() }
    `)
    assert.equal(sandbox._result.events.length, 1)
    assert.equal(sandbox._result.events[0].id, 'news')
    assert.ok(sandbox._result.installed.includes('news'))
  })
})

describe('integration: hub + bookmarks/news takeover', () => {
  beforeEach(() => {
    if (typeof globalThis._resetMock === 'function') globalThis._resetMock()
  })

  test('Hidden list reflects both scripts when Hub takes over all', () => {
    const sandbox = runWithSandbox(HUB_SOURCES, `
      CatHub.takeover.markActive()
      var all = CatHub.takeover.takeOverAll()
      return {
        hidden: CatHub.takeover.getHidden(),
        bmHidden: CatHub.takeover.isHidden('bookmarks'),
        newsHidden: CatHub.takeover.isHidden('news'),
        active: CatHub.takeover.isHubActive(),
      }
    `)
    assert.ok(sandbox._result.hidden.length >= 2)
    assert.equal(sandbox._result.bmHidden, true)
    assert.equal(sandbox._result.newsHidden, true)
    assert.equal(sandbox._result.active, true)
  })

  test('Restore all clears hidden list', () => {
    const sandbox = runWithSandbox(HUB_SOURCES, `
      CatHub.takeover.markActive()
      CatHub.takeover.takeOverAll()
      var allIds = CatHub.takeover.getHidden()
      CatHub.takeover.restoreAll()
      return {
        beforeRestore: allIds.length,
        afterRestore: CatHub.takeover.getHidden().length,
      }
    `)
    assert.ok(sandbox._result.beforeRestore >= 2)
    assert.equal(sandbox._result.afterRestore, 0)
  })

  test('Sub-scripts check Hub active timestamp', () => {
    const sandbox = runWithSandbox(HUB_SOURCES, `
      CatHub.takeover.markActive()
      var activeNow = CatHub.takeover.isHubActive()
      CatHub.takeover.setHidden('bookmarks', true)
      var bmHidden = CatHub.takeover.isHidden('bookmarks')
      CatHub.takeover.setHidden('bookmarks', false)
      var bmRestored = CatHub.takeover.isHidden('bookmarks')
      return { activeNow: activeNow, bmHidden: bmHidden, bmRestored: bmRestored }
    `)
    assert.equal(sandbox._result.activeNow, true)
    assert.equal(sandbox._result.bmHidden, true)
    assert.equal(sandbox._result.bmRestored, false)
  })

  test('Hub expiry purges stale takeover state', () => {
    globalThis._setMock('active-ts', Date.now() - 8 * 86400000)
    globalThis._setMock('hidden', ['bookmarks', 'news'])
    const sandbox = runWithSandbox(HUB_SOURCES, `
      var activeBefore = CatHub.takeover.isHubActive()
      var purged = CatHub.takeover.purgeExpired()
      var activeAfter = CatHub.takeover.isHubActive()
      return { activeBefore: activeBefore, purged: purged, activeAfter: activeAfter }
    `)
    assert.equal(sandbox._result.activeBefore, false)
    assert.equal(sandbox._result.purged, true)
    assert.equal(sandbox._result.activeAfter, false)
  })
})

describe('integration: registry cross-checks', () => {
  beforeEach(() => {
    if (typeof globalThis._resetMock === 'function') globalThis._resetMock()
  })

  test('Registry entries match window namespace conventions', () => {
    const sandbox = runWithSandbox(HUB_SOURCES, `
      window.BookmarkLogger = {
        meta: { id: 'bookmarks', name: '网址收藏', version: '0.2.0' },
        ui: { panel: { openPanel: function() {} } },
        storage: { getStats: function() { return { primary: { count: 1, label: '条' } } } },
      }
      window.NewsAggregator = {
        meta: { id: 'news', name: '新闻聚合', version: '0.2.0' },
        ui: { panel: { openPanel: function() {} } },
        storage: { getStats: function() { return { primary: { count: 1, label: '未读' } } } },
      }
      var mismatches = []
      var allMeta = CatHub.registry.getAll()
      for (var i = 0; i < allMeta.length; i++) {
        var meta = allMeta[i]
        var obj = window[meta.namespace]
        if (obj && obj.meta) {
          if (obj.meta.id !== meta.id) {
            mismatches.push({ expected: meta.id, got: obj.meta.id, ns: meta.namespace })
          }
        }
      }
      return { mismatches: mismatches, count: allMeta.length }
    `)
    assert.equal(sandbox._result.mismatches.length, 0)
    assert.ok(sandbox._result.count >= 2)
  })

  test('All registry entries have installUrl for missing-script flow', () => {
    const sandbox = runWithSandbox(HUB_SOURCES, `
      var missing = []
      var all = CatHub.registry.getAll()
      for (var i = 0; i < all.length; i++) {
        var m = all[i]
        if (!m.installUrl || !m.icon || !m.color) missing.push(m.id)
      }
      return { missing: missing, total: all.length }
    `)
    assert.equal(sandbox._result.missing.length, 0)
    assert.ok(sandbox._result.total >= 2)
  })
})