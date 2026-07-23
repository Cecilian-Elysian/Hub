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

function seed() {
  const now = Date.now()
  ns.storage.addBookmarks([
    { title: 'GitHub', url: 'https://github.com', folder: 'Dev', folderPath: 'Dev', addDate: now },
    { title: 'Stack Overflow', url: 'https://stackoverflow.com', folder: 'Dev', folderPath: 'Dev', addDate: now + 1 },
    { title: 'Hacker News', url: 'https://news.ycombinator.com', folder: 'News', folderPath: 'News', addDate: now + 2 },
  ])
}

describe('formatTime', () => {
  it('returns empty for falsy', () => {
    assert.strictEqual(ns.format.formatTime(0), '')
    assert.strictEqual(ns.format.formatTime(null), '')
  })
  it('returns 刚刚 for < 1 minute', () => {
    assert.strictEqual(ns.format.formatTime(Date.now() - 30000), '刚刚')
  })
  it('returns minutes', () => {
    assert.strictEqual(ns.format.formatTime(Date.now() - 120000), '2 分钟前')
  })
})

describe('formatDate', () => {
  it('formats date correctly', () => {
    const d = new Date('2026-07-15T14:30:00')
    assert.strictEqual(ns.format.formatDate(d.getTime()), '2026-07-15 14:30')
  })
})

describe('escapeHtml', () => {
  it('escapes special chars', () => {
    assert.strictEqual(ns.format.escapeHtml('<a href="x">&\'</a>'), '&lt;a href=&quot;x&quot;&gt;&amp;&#39;&lt;/a&gt;')
  })
  it('returns empty for null/undefined', () => {
    assert.strictEqual(ns.format.escapeHtml(null), '')
    assert.strictEqual(ns.format.escapeHtml(undefined), '')
  })
  it('returns empty for empty string', () => {
    assert.strictEqual(ns.format.escapeHtml(''), '')
  })
})

describe('generateMarkdown', () => {
  it('groups by folder by default', () => {
    seed()
    const { bookmarks } = ns.storage.getBookmarks()
    const md = ns.format.generateMarkdown(bookmarks, { groupBy: 'folder' })
    assert.ok(md.includes('# 网址收藏'))
    assert.ok(md.includes('**3**'))
    assert.ok(md.includes('## Dev (2)'))
    assert.ok(md.includes('## News (1)'))
    assert.ok(md.includes('[GitHub](https://github.com)'))
  })

  it('respects groupBy=time', () => {
    seed()
    const { bookmarks } = ns.storage.getBookmarks()
    const md = ns.format.generateMarkdown(bookmarks, { groupBy: 'time' })
    const d = new Date()
    const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    assert.ok(md.includes('## ' + month))
  })

  it('includes export header timestamp when enabled', () => {
    seed()
    const { bookmarks } = ns.storage.getBookmarks()
    const md = ns.format.generateMarkdown(bookmarks, { groupBy: 'folder', includeTimestamp: true })
    assert.ok(md.includes('导出时间'))
  })

  it('omits export header timestamp when disabled', () => {
    seed()
    const { bookmarks } = ns.storage.getBookmarks()
    const md = ns.format.generateMarkdown(bookmarks, { groupBy: 'folder', includeTimestamp: false })
    assert.ok(!md.includes('导出时间'))
  })

  it('handles empty list', () => {
    const md = ns.format.generateMarkdown([])
    assert.ok(md.includes('**0**'))
  })

  it('uses custom title', () => {
    seed()
    const { bookmarks } = ns.storage.getBookmarks()
    const md = ns.format.generateMarkdown(bookmarks, { title: '我的书签' })
    assert.ok(md.startsWith('# 我的书签'))
  })
})

describe('generateJSON', () => {
  it('produces valid JSON with metadata', () => {
    seed()
    const { bookmarks, total } = ns.storage.getBookmarks()
    assert.strictEqual(total, 3)
    const json = ns.format.generateJSON(bookmarks)
    const parsed = JSON.parse(json)
    assert.strictEqual(parsed.count, 3)
    assert.strictEqual(parsed.bookmarks.length, 3)
    assert.ok(parsed.exportedAt)
    assert.ok(parsed.bookmarks[0].title)
    assert.ok(parsed.bookmarks[0].url)
  })
})

describe('generateNetscapeHtml', () => {
  it('produces parseable Netscape bookmark HTML', () => {
    seed()
    const { bookmarks } = ns.storage.getBookmarks()
    const html = ns.format.generateNetscapeHtml(bookmarks)
    assert.ok(html.startsWith('<!DOCTYPE NETSCAPE-Bookmark-file-1>'))
    assert.ok(html.includes('<H1>Bookmarks</H1>'))
    assert.ok(html.includes('<DT><H3>Dev</H3>'))
    assert.ok(html.includes('<DT><H3>News</H3>'))
    assert.ok(html.includes('HREF="https://github.com"'))

    const reparsed = ns.parser.parseBookmarksHtml(html)
    assert.strictEqual(reparsed.length, 3)
    assert.strictEqual(reparsed.find(b => b.url === 'https://github.com').folderPath, 'Dev')
  })

  it('escapes special chars in title and URL', () => {
    ns.storage.addBookmarks([
      { title: 'A & B <test>', url: 'https://example.com/?q="x"', folder: 'X', folderPath: 'X' },
    ])
    const { bookmarks } = ns.storage.getBookmarks()
    const html = ns.format.generateNetscapeHtml(bookmarks)
    assert.ok(html.includes('A &amp; B &lt;test&gt;'))
    assert.ok(html.includes('https://example.com/?q=&quot;x&quot;'))
  })
})