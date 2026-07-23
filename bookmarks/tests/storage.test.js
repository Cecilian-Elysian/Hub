import { describe, it, before, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { mockGM, loadBuilt } from './setup.js'

let ns

before(() => {
  mockGM()
  loadBuilt()
  ns = globalThis.BookmarkLogger
})

beforeEach(() => {
  globalThis.GM_deleteValue('bookmarks')
  globalThis.GM_deleteValue('config')
})

function makeBookmark(overrides = {}) {
  return {
    title: overrides.title || 'Test',
    url: overrides.url || 'https://example.com/1',
    folder: overrides.folder || 'Tools',
    folderPath: overrides.folderPath || 'Tools',
    addDate: overrides.addDate != null ? overrides.addDate : Date.now(),
    icon: overrides.icon || '',
    tags: overrides.tags || [],
    description: overrides.description || '',
    ...overrides,
  }
}

describe('addBookmarks', () => {
  it('adds new bookmarks', () => {
    const r = ns.storage.addBookmarks([makeBookmark({ url: 'https://a.com' })])
    assert.strictEqual(r.added, 1)
    assert.strictEqual(r.updated, 0)
    assert.strictEqual(r.total, 1)
  })

  it('updates existing bookmark with same URL', () => {
    ns.storage.addBookmarks([makeBookmark({ url: 'https://a.com', title: 'Original' })])
    const r = ns.storage.addBookmarks([makeBookmark({ url: 'https://a.com', title: 'Updated' })])
    assert.strictEqual(r.added, 0)
    assert.strictEqual(r.updated, 1)
    const { bookmarks } = ns.storage.getBookmarks()
    assert.strictEqual(bookmarks.length, 1)
    assert.strictEqual(bookmarks[0].title, 'Updated')
  })

  it('treats http/https with same path as duplicates', () => {
    ns.storage.addBookmarks([makeBookmark({ url: 'https://example.com/page' })])
    const r = ns.storage.addBookmarks([makeBookmark({ url: 'http://example.com/page/' })])
    assert.strictEqual(r.updated, 1)
    assert.strictEqual(r.added, 0)
  })

  it('skips items without URL', () => {
    const r = ns.storage.addBookmarks([makeBookmark({ url: '' })])
    assert.strictEqual(r.skipped, 1)
    assert.strictEqual(r.added, 0)
  })

  it('applies maxTotalBookmarks limit', () => {
    globalThis.GM_setValue('config', {
      maxTotalBookmarks: 3,
      retentionDays: 365,
    })
    ns.storage.addBookmarks([
      makeBookmark({ url: 'https://a.com' }),
      makeBookmark({ url: 'https://b.com' }),
      makeBookmark({ url: 'https://c.com' }),
      makeBookmark({ url: 'https://d.com' }),
      makeBookmark({ url: 'https://e.com' }),
    ])
    const { bookmarks } = ns.storage.getBookmarks()
    assert.strictEqual(bookmarks.length, 3)
  })

  it('respects retentionDays filter on addDate', () => {
    globalThis.GM_setValue('config', {
      maxTotalBookmarks: 100,
      retentionDays: 30,
    })
    const now = Date.now()
    const old = now - 100 * 86400000
    const recent = now - 5 * 86400000
    ns.storage.addBookmarks([
      makeBookmark({ url: 'https://old.com', addDate: old }),
      makeBookmark({ url: 'https://recent.com', addDate: recent }),
    ])
    const { bookmarks } = ns.storage.getBookmarks()
    assert.strictEqual(bookmarks.length, 1)
    assert.strictEqual(bookmarks[0].url, 'https://recent.com')
  })
})

describe('getBookmarks', () => {
  beforeEach(() => {
    ns.storage.addBookmarks([
      makeBookmark({ url: 'https://github.com/a', folder: 'Dev', folderPath: 'Dev', title: 'GH' }),
      makeBookmark({ url: 'https://stackoverflow.com', folder: 'Dev', folderPath: 'Dev', title: 'SO' }),
      makeBookmark({ url: 'https://news.com', folder: 'News', folderPath: 'News', title: 'News' }),
    ])
  })

  it('filters by folder', () => {
    const { bookmarks, total } = ns.storage.getBookmarks({ folder: 'Dev' })
    assert.strictEqual(total, 2)
    assert.ok(bookmarks.every(b => b.folder === 'Dev'))
  })

  it('filters by folderPath prefix', () => {
    ns.storage.addBookmarks([makeBookmark({ url: 'https://x.com', folderPath: 'Dev/JS', folder: 'JS' })])
    const { total } = ns.storage.getBookmarks({ folderPath: 'Dev' })
    assert.strictEqual(total, 3)
  })

  it('filters by keyword across title/url/folder', () => {
    const { bookmarks } = ns.storage.getBookmarks({ keyword: 'github' })
    assert.strictEqual(bookmarks.length, 1)
    assert.strictEqual(bookmarks[0].title, 'GH')
  })

  it('filters by tag', () => {
    ns.storage.addBookmarks([makeBookmark({ url: 'https://tagged.com', tags: ['important'] })])
    const { bookmarks } = ns.storage.getBookmarks({ tag: 'important' })
    assert.strictEqual(bookmarks.length, 1)
  })

  it('sorts by addDate descending', () => {
    const { bookmarks } = ns.storage.getBookmarks()
    for (let i = 1; i < bookmarks.length; i++) {
      assert.ok(bookmarks[i - 1].addDate >= bookmarks[i].addDate)
    }
  })

  it('paginates with limit', () => {
    const { bookmarks, total } = ns.storage.getBookmarks({ limit: 2 })
    assert.strictEqual(total, 3)
    assert.strictEqual(bookmarks.length, 2)
  })
})

describe('getBookmarkById / getBookmarkByUrl', () => {
  it('finds by id', () => {
    const r = ns.storage.addBookmarks([makeBookmark({ url: 'https://a.com' })])
    const id = ns.storage.getBookmarks().bookmarks[0].id
    const bm = ns.storage.getBookmarkById(id)
    assert.ok(bm)
    assert.strictEqual(bm.url, 'https://a.com')
  })

  it('returns null for missing id', () => {
    assert.strictEqual(ns.storage.getBookmarkById('nonexistent'), null)
  })

  it('finds by url with normalization', () => {
    ns.storage.addBookmarks([makeBookmark({ url: 'https://example.com/page' })])
    const bm = ns.storage.getBookmarkByUrl('http://example.com/page/')
    assert.ok(bm)
  })
})

describe('removeBookmarks / updateBookmark', () => {
  it('removes by id', () => {
    ns.storage.addBookmarks([
      makeBookmark({ url: 'https://a.com' }),
      makeBookmark({ url: 'https://b.com' }),
    ])
    const id = ns.storage.getBookmarks().bookmarks.find(b => b.url === 'https://a.com').id
    ns.storage.removeBookmarks([id])
    const { bookmarks } = ns.storage.getBookmarks()
    assert.strictEqual(bookmarks.length, 1)
    assert.strictEqual(bookmarks[0].url, 'https://b.com')
  })

  it('updates bookmark fields', () => {
    ns.storage.addBookmarks([makeBookmark({ url: 'https://a.com', title: 'Old' })])
    const id = ns.storage.getBookmarks().bookmarks[0].id
    ns.storage.updateBookmark(id, { title: 'New' })
    const bm = ns.storage.getBookmarkById(id)
    assert.strictEqual(bm.title, 'New')
  })
})

describe('clearAll / getFolders / getStats', () => {
  it('clears all', () => {
    ns.storage.addBookmarks([makeBookmark({ url: 'https://a.com' })])
    ns.storage.clearAll()
    assert.strictEqual(ns.storage.getBookmarks().total, 0)
  })

  it('returns sorted folders', () => {
    ns.storage.addBookmarks([
      makeBookmark({ url: 'https://a.com', folderPath: 'Z' }),
      makeBookmark({ url: 'https://b.com', folderPath: 'A' }),
      makeBookmark({ url: 'https://c.com', folderPath: 'M' }),
    ])
    const folders = ns.storage.getFolders()
    assert.deepStrictEqual(folders, ['A', 'M', 'Z'])
  })

  it('returns stats', () => {
    ns.storage.addBookmarks([
      makeBookmark({ url: 'https://a.com', folderPath: 'X' }),
      makeBookmark({ url: 'https://b.com', folderPath: 'X' }),
    ])
    const stats = ns.storage.getStats()
    assert.strictEqual(stats.total, 2)
    assert.strictEqual(stats.folders, 1)
  })
})