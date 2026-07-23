import { test, describe, beforeEach } from 'node:test'
import assert from 'node:assert/strict'

import './setup.js'
import { runWithSandbox } from './helper.js'

const SOURCES = ['namespace.js', 'constants.js', 'config.js', 'registry.js', 'utils/log.js', 'utils/format.js', 'core/takeover.js', 'core/detector.js']

describe('detector', () => {
  beforeEach(() => {
    if (typeof globalThis._resetMock === 'function') globalThis._resetMock()
  })

  test('isInstalled returns false when namespace missing', () => {
    const sandbox = runWithSandbox(SOURCES, `return CatHub.detector.isInstalled('bookmarks')`)
    assert.equal(sandbox._result, false)
  })

  test('isReady returns false when openPanel missing', () => {
    const sandbox = runWithSandbox(SOURCES, `
      window.BookmarkLogger = { meta: { id: 'bookmarks', name: '网址收藏' }, ui: {}, storage: {} }
      return CatHub.detector.isReady('bookmarks')
    `)
    assert.equal(sandbox._result, false)
  })

  test('isReady returns true when full signature present', () => {
    const sandbox = runWithSandbox(SOURCES, `
      window.BookmarkLogger = {
        meta: { id: 'bookmarks', name: '网址收藏' },
        ui: { panel: { openPanel: function() { return 'opened' } } },
        storage: { getStats: function() { return { primary: { count: 5, label: '条' } } } },
      }
      return {
        ready: CatHub.detector.isReady('bookmarks'),
        stats: CatHub.detector.getStats('bookmarks'),
        opened: CatHub.detector.openScript('bookmarks'),
      }
    `)
    assert.equal(sandbox._result.ready, true)
    assert.equal(sandbox._result.stats.primary.count, 5)
    assert.equal(sandbox._result.stats.primary.label, '条')
    assert.equal(sandbox._result.opened, true)
  })

  test('scanWindow finds registered scripts', () => {
    const sandbox = runWithSandbox(SOURCES, `
      window.BookmarkLogger = {
        meta: { id: 'bookmarks', name: '网址收藏' },
        ui: { panel: { openPanel: function() {} } },
        storage: {},
      }
      return CatHub.detector.scanWindow()
    `)
    assert.equal(sandbox._result.length, 1)
    assert.equal(sandbox._result[0].id, 'bookmarks')
    assert.equal(sandbox._result[0].source, 'window')
  })
})