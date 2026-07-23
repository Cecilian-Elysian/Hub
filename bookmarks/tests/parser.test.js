import { describe, it, before } from 'node:test'
import assert from 'node:assert/strict'
import { mockGM, loadBuilt } from './setup.js'

let ns

before(() => {
  mockGM()
  loadBuilt()
  ns = globalThis.BookmarkLogger
})

describe('simpleHash', () => {
  it('produces consistent hash for same input', () => {
    const h1 = ns.dedup.simpleHash('hello')
    const h2 = ns.dedup.simpleHash('hello')
    assert.strictEqual(h1, h2)
  })

  it('handles empty string', () => {
    assert.strictEqual(ns.dedup.simpleHash(''), 0)
  })

  it('handles unicode', () => {
    const h = ns.dedup.simpleHash('中文测试')
    assert.strictEqual(typeof h, 'number')
  })
})

describe('urlDedupKey', () => {
  it('normalizes http and https', () => {
    const a = ns.dedup.urlDedupKey('http://example.com/page')
    const b = ns.dedup.urlDedupKey('https://example.com/page')
    assert.strictEqual(a, b)
  })

  it('is case insensitive', () => {
    const a = ns.dedup.urlDedupKey('https://EXAMPLE.com/Path')
    const b = ns.dedup.urlDedupKey('https://example.com/path')
    assert.strictEqual(a, b)
  })

  it('strips trailing slashes', () => {
    const a = ns.dedup.urlDedupKey('https://example.com/x/')
    const b = ns.dedup.urlDedupKey('https://example.com/x')
    assert.strictEqual(a, b)
  })

  it('strips utm tracking params', () => {
    const a = ns.dedup.urlDedupKey('https://example.com/page?utm_source=test')
    const b = ns.dedup.urlDedupKey('https://example.com/page')
    assert.strictEqual(a, b)
  })

  it('returns same key for empty input', () => {
    assert.strictEqual(ns.dedup.urlDedupKey(''), ns.dedup.urlDedupKey(null))
  })
})

describe('parseBookmarksHtml - basics', () => {
  it('parses single bookmark', () => {
    const html = `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>Bookmarks</TITLE>
<H1>Bookmarks</H1>
<DL><p>
    <DT><A HREF="https://example.com" ADD_DATE="1700000000">Example</A>
</DL><p>`
    const items = ns.parser.parseBookmarksHtml(html)
    assert.strictEqual(items.length, 1)
    assert.strictEqual(items[0].title, 'Example')
    assert.strictEqual(items[0].url, 'https://example.com')
    assert.strictEqual(items[0].addDate, 1700000000000)
  })

  it('parses nested folders', () => {
    const html = `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<DL><p>
    <DT><H3>Work</H3>
    <DL><p>
        <DT><H3>Projects</H3>
        <DL><p>
            <DT><A HREF="https://a.com" ADD_DATE="1700000000">A</A>
            <DT><A HREF="https://b.com" ADD_DATE="1700000001">B</A>
        </DL><p>
        <DT><A HREF="https://c.com" ADD_DATE="1700000002">C</A>
    </DL><p>
    <DT><A HREF="https://d.com" ADD_DATE="1700000003">D</A>
</DL><p>`
    const items = ns.parser.parseBookmarksHtml(html)
    assert.strictEqual(items.length, 4)
    const a = items.find(i => i.url === 'https://a.com')
    assert.strictEqual(a.folderPath, 'Work/Projects')
    const c = items.find(i => i.url === 'https://c.com')
    assert.strictEqual(c.folderPath, 'Work')
    const d = items.find(i => i.url === 'https://d.com')
    assert.strictEqual(d.folderPath, '')
  })

  it('decodes HTML entities in title and URL', () => {
    const html = `<DL><p>
        <DT><A HREF="https://example.com/?q=a&amp;b" ADD_DATE="1700000000">A &amp; B &lt;tag&gt;</A>
</DL><p>`
    const items = ns.parser.parseBookmarksHtml(html)
    assert.strictEqual(items.length, 1)
    assert.strictEqual(items[0].title, 'A & B <tag>')
    assert.strictEqual(items[0].url, 'https://example.com/?q=a&b')
  })

  it('decodes numeric HTML entities', () => {
    const html = `<DL><p>
        <DT><A HREF="https://example.com/?&#65;&#66;" ADD_DATE="1700000000">&#65;&#66;&#67;</A>
</DL><p>`
    const items = ns.parser.parseBookmarksHtml(html)
    assert.strictEqual(items[0].title, 'ABC')
    assert.strictEqual(items[0].url, 'https://example.com/?AB')
  })

  it('handles ADD_DATE in seconds (auto-converts to ms)', () => {
    const html = `<DL><p>
        <DT><A HREF="https://a.com" ADD_DATE="1700000000">A</A>
</DL><p>`
    const items = ns.parser.parseBookmarksHtml(html)
    assert.strictEqual(items[0].addDate, 1700000000000)
  })

  it('handles ADD_DATE in milliseconds', () => {
    const html = `<DL><p>
        <DT><A HREF="https://a.com" ADD_DATE="1700000000000">A</A>
</DL><p>`
    const items = ns.parser.parseBookmarksHtml(html)
    assert.strictEqual(items[0].addDate, 1700000000000)
  })

  it('skips empty href', () => {
    const html = `<DL><p>
        <DT><A ADD_DATE="1700000000">NoHref</A>
        <DT><A HREF="https://x.com" ADD_DATE="1700000000">Real</A>
</DL><p>`
    const items = ns.parser.parseBookmarksHtml(html)
    assert.strictEqual(items.length, 1)
    assert.strictEqual(items[0].url, 'https://x.com')
  })

  it('extracts TAGS attribute', () => {
    const html = `<DL><p>
        <DT><A HREF="https://a.com" ADD_DATE="1700000000" TAGS="work,important">A</A>
</DL><p>`
    const items = ns.parser.parseBookmarksHtml(html)
    assert.deepStrictEqual(items[0].tags, ['work', 'important'])
  })

  it('handles empty input', () => {
    assert.deepStrictEqual(ns.parser.parseBookmarksHtml(''), [])
    assert.deepStrictEqual(ns.parser.parseBookmarksHtml(null), [])
    assert.deepStrictEqual(ns.parser.parseBookmarksHtml(undefined), [])
  })

  it('handles malformed input gracefully', () => {
    const items = ns.parser.parseBookmarksHtml('<<>>random stuff')
    assert.strictEqual(items.length, 0)
  })
})

describe('parseBookmarksHtml - real-world sample', () => {
  it('parses Chrome-style export', () => {
    const html = `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<!-- This is an automatically generated file.
     It will be read and overwritten.
     DO NOT EDIT! -->
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>Bookmarks</TITLE>
<H1>Bookmarks</H1>
<DL><p>
    <DT><H3 ADD_DATE="1700000000" LAST_MODIFIED="1700000000">书签栏</H3>
    <DL><p>
        <DT><H3 ADD_DATE="1700000000" LAST_MODIFIED="1700000000">工具</H3>
        <DL><p>
            <DT><A HREF="https://github.com" ADD_DATE="1700000000" ICON="data:,">GitHub</A>
            <DT><A HREF="https://stackoverflow.com" ADD_DATE="1700000001">Stack Overflow</A>
        </DL><p>
        <DT><A HREF="https://news.ycombinator.com" ADD_DATE="1700000002">Hacker News</A>
    </DL><p>
    <DT><H3 ADD_DATE="1700000000">其他收藏</H3>
    <DL><p>
        <DT><A HREF="https://example.com" ADD_DATE="1700000003">Example</A>
    </DL><p>
</DL><p>`
    const items = ns.parser.parseBookmarksHtml(html)
    assert.strictEqual(items.length, 4)
    const gh = items.find(i => i.url === 'https://github.com')
    assert.strictEqual(gh.title, 'GitHub')
    assert.strictEqual(gh.folderPath, '书签栏/工具')
    assert.strictEqual(gh.icon, 'data:,')
    const hn = items.find(i => i.url === 'https://news.ycombinator.com')
    assert.strictEqual(hn.folderPath, '书签栏')
    const ex = items.find(i => i.url === 'https://example.com')
    assert.strictEqual(ex.folderPath, '其他收藏')
  })
})