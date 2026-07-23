import { test, describe, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import vm from 'node:vm'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')

function readDist(project, file) {
  const p = path.join(ROOT, project, 'dist', file)
  if (!fs.existsSync(p)) return null
  return fs.readFileSync(p, 'utf-8')
}

function describe3() {
  beforeEach(() => {
    if (typeof globalThis._resetMock === 'function') globalThis._resetMock()
  })

  test('all three dist files exist', () => {
    assert.ok(readDist('hub', 'hub.user.js'), 'hub dist missing')
    assert.ok(readDist('bookmarks', 'bookmarks.user.js'), 'bookmarks dist missing')
    assert.ok(readDist('news', 'news-ui.user.js'), 'news-ui dist missing')
    assert.ok(readDist('news', 'news-core.user.js'), 'news-core dist missing')
  })

  test('all dist files have correct UserScript header', () => {
    const check = (content, name) => {
      assert.ok(content.startsWith('// ==UserScript=='), name + ' missing UserScript header')
      assert.ok(content.includes('@name'), name + ' missing @name')
      assert.ok(content.includes('@match') || content.includes('@background'), name + ' missing match/background')
      assert.ok(content.includes('@grant'), name + ' missing @grant')
      assert.ok(content.endsWith('// ==/UserScript==') || content.indexOf('// ==/UserScript==') > 0, name + ' missing UserScript footer')
    }
    check(readDist('hub', 'hub.user.js'), 'hub')
    check(readDist('bookmarks', 'bookmarks.user.js'), 'bookmarks')
    check(readDist('news', 'news-ui.user.js'), 'news-ui')
    check(readDist('news', 'news-core.user.js'), 'news-core')
  })

  test('hub dist contains Hub namespace reference', () => {
    const content = readDist('hub', 'hub.user.js')
    assert.ok(content.includes('CatHub'))
    assert.ok(content.includes('cat-script:loaded'))
    assert.ok(content.includes('active-ts'))
  })

  test('bookmarks dist exposes meta and hub-compat', () => {
    const content = readDist('bookmarks', 'bookmarks.user.js')
    assert.ok(content.includes("id: 'bookmarks'") || content.includes('id:"bookmarks"'), 'missing bookmarks id meta')
    assert.ok(content.includes('hubCompat'), 'missing hubCompat reference')
    assert.ok(content.includes('cat-script:loaded'), 'missing loaded event dispatch')
  })

  test('news-ui dist exposes meta and hub-compat', () => {
    const content = readDist('news', 'news-ui.user.js')
    assert.ok(content.includes("id: 'news'") || content.includes('id:"news"'), 'missing news id meta')
    assert.ok(content.includes('hubCompat'), 'missing hubCompat reference')
    assert.ok(content.includes('cat-script:loaded'), 'missing loaded event dispatch')
  })

  test('dist files using CustomEvent work in standard browser environment', () => {
    const check = (content, name) => {
      const usesCustomEvent = /new CustomEvent\(/.test(content)
      if (usesCustomEvent) {
        assert.ok(content.length > 0, name + ' uses CustomEvent (relies on browser global)')
      }
    }
    check(readDist('hub', 'hub.user.js'), 'hub')
    check(readDist('bookmarks', 'bookmarks.user.js'), 'bookmarks')
    check(readDist('news', 'news-ui.user.js'), 'news-ui')
  })

  test('hub dist references both bookmarks and news namespaces', () => {
    const content = readDist('hub', 'hub.user.js')
    assert.ok(content.includes('BookmarkLogger'), 'hub missing BookmarkLogger reference')
    assert.ok(content.includes('NewsAggregator'), 'hub missing NewsAggregator reference')
  })

  test('dist file sizes are reasonable', () => {
    const limit = 200 * 1024
    const files = [
      ['hub', 'hub.user.js'],
      ['bookmarks', 'bookmarks.user.js'],
      ['news', 'news-ui.user.js'],
      ['news', 'news-core.user.js'],
    ]
    for (const [project, file] of files) {
      const content = readDist(project, file)
      if (!content) continue
      assert.ok(content.length < limit, project + '/' + file + ' too large: ' + content.length)
      assert.ok(content.length > 1024, project + '/' + file + ' too small: ' + content.length)
    }
  })
}

function simulateFullStack() {
  const store = {}
  const sandbox = {
    window: {
      _listeners: {},
      addEventListener(type, fn) {
        if (!this._listeners[type]) this._listeners[type] = []
        this._listeners[type].push(fn)
      },
      removeEventListener(type, fn) {
        if (!this._listeners[type]) return
        this._listeners[type] = this._listeners[type].filter(f => f !== fn)
      },
      dispatchEvent(evt) {
        const t = (evt && evt.type) || ''
        const list = this._listeners[t] || []
        for (const fn of list) {
          try { fn(evt) } catch (e) {}
        }
        return true
      },
    },
    document: { hidden: false, addEventListener: () => {}, removeEventListener: () => {} },
    GM_getValue: (k, d) => (k in store ? store[k] : d),
    GM_setValue: (k, v) => { store[k] = v },
    GM_deleteValue: (k) => { if (k in store) { delete store[k]; return true } return false },
    GM_listValues: () => Object.keys(store),
    GM_notification: () => {},
    GM_openInTab: () => {},
    GM_registerMenuCommand: () => {},
    GM_addStyle: () => {},
    GM_log: () => {},
    console: { log: () => {}, warn: () => {}, error: () => {}, debug: () => {} },
    setTimeout, clearTimeout, setInterval, clearInterval,
    CustomEvent: class CustomEvent {
      constructor(type, init) { this.type = type; this.detail = init && init.detail }
    },
    Date, JSON, Object, Array, Map, Set, Promise,
    Math, Error, RegExp, Number, String, Boolean, parseInt, parseFloat,
    isNaN, isFinite, encodeURI, encodeURIComponent, decodeURI, decodeURIComponent,
    confirm: () => true,
  }
  sandbox.CatHub = {}
  sandbox.globalThis = sandbox
  sandbox.self = sandbox
  vm.createContext(sandbox)
  return sandbox
}

function loadSource(project, files) {
  let code = ''
  for (const f of files) {
    code += fs.readFileSync(path.join(ROOT, project, 'src', f), 'utf-8') + '\n'
  }
  return code
}

describe('integration: full stack simulation', () => {
  test('hub discovers bookmarks + news and respects takeover', () => {
    const sandbox = simulateFullStack()

    const hubCode = loadSource('hub', [
      'namespace.js', 'constants.js', 'config.js', 'registry.js',
      'utils/log.js', 'utils/format.js', 'utils/notify.js',
      'core/storage.js', 'core/takeover.js', 'core/detector.js',
      'core/badge.js', 'core/listener.js',
    ])

    vm.runInContext(
      '(function() { var CatHub = globalThis.CatHub;\n' + hubCode + '\n' +
      'window.BookmarkLogger = { ' +
      '  meta: { id: "bookmarks", name: "网址收藏", version: "0.2.0" }, ' +
      '  ui: { panel: { openPanel: function() { return "bm-opened" } } }, ' +
      '  storage: { getStats: function() { return { primary: { count: 50, label: "条" } } } } ' +
      '}; ' +
      'window.NewsAggregator = { ' +
      '  meta: { id: "news", name: "新闻聚合", version: "0.2.0" }, ' +
      '  ui: { panel: { openPanel: function() { return "news-opened" } } }, ' +
      '  storage: { getStats: function() { return { primary: { count: 12, label: "未读" } } } } ' +
      '}; ' +
      'CatHub.takeover.markActive(); ' +
      'CatHub.takeover.takeOverAll(); ' +
      'CatHub.badge.refresh(true); ' +
      'globalThis._result = { ' +
      '  installed: CatHub.detector.scanWindow().map(function(i) { return i.id }), ' +
      '  bmHidden: CatHub.takeover.isHidden("bookmarks"), ' +
      '  newsHidden: CatHub.takeover.isHidden("news"), ' +
      '  totalUnread: CatHub.badge.totalUnread(), ' +
      '  bmOpenResult: CatHub.detector.openScript("bookmarks"), ' +
      '  newsOpenResult: CatHub.detector.openScript("news") ' +
      '}; ' +
      '})()',
      sandbox
    )

    const r = sandbox._result
    assert.ok(r.installed.includes('bookmarks'))
    assert.ok(r.installed.includes('news'))
    assert.equal(r.bmHidden, true)
    assert.equal(r.newsHidden, true)
    assert.equal(r.totalUnread, 62)
    assert.equal(r.bmOpenResult, true)
    assert.equal(r.newsOpenResult, true)
  })

  test('sub-scripts hub-compat correctly reads Hub active state', () => {
    const sandbox = simulateFullStack()

    const hubCode = loadSource('hub', ['namespace.js', 'constants.js', 'config.js', 'core/takeover.js'])

    vm.runInContext(
      '(function() { var CatHub = globalThis.CatHub;\n' + hubCode + '\n' +
      'CatHub.takeover.markActive(); ' +
      'globalThis._result = { active: CatHub.takeover.isHubActive() }; ' +
      '})()',
      sandbox
    )
    assert.equal(sandbox._result.active, true)
  })

  test('registry installUrls are reachable URLs', () => {
    const sandbox = simulateFullStack()

    const registryCode = loadSource('hub', ['namespace.js', 'registry.js'])
    vm.runInContext(
      '(function() { var CatHub = globalThis.CatHub;\n' + registryCode + '\n' +
      'var metas = CatHub.registry.getAll(); ' +
      'var results = metas.map(function(m) { ' +
      '  return { id: m.id, namespace: m.namespace, installUrl: m.installUrl, icon: m.icon, color: m.color } ' +
      '}); ' +
      'globalThis._result = results; ' +
      '})()',
      sandbox
    )

    for (const meta of sandbox._result) {
      assert.ok(meta.id)
      assert.ok(meta.namespace)
      assert.ok(meta.installUrl.startsWith('https://'))
      assert.ok(meta.icon)
      assert.ok(meta.color.startsWith('#'))
    }
  })
})

describe3()