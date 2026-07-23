import { describe, it, before, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { mockGM, loadBuiltCore } from './setup.js'

let ns

before(() => {
  mockGM()
  loadBuiltCore()
  ns = globalThis.NewsAggregator
  // Reset storage with default config
  globalThis.GM_setValue('config', {
    fetchInterval: 30,
    maxArticlesPerSource: 100,
    maxTotalArticles: 2000,
    retentionDays: 30,
    sources: {
      zhihu: { enabled: true, order: 0 },
      weibo: { enabled: true, order: 1 },
      rss: { enabled: false, order: 10, urls: [] },
    },
    ui: { position: 'bottom-right', maxDisplay: 50, theme: 'auto' },
  })
})

beforeEach(() => {
  globalThis.GM_deleteValue('articles')
})

function makeArticle(overrides = {}) {
  return {
    id: overrides.id || 'test_1',
    title: overrides.title || 'Test Article',
    url: overrides.url || 'https://example.com/1',
    source: overrides.source || 'zhihu',
    publishTime: overrides.publishTime || Date.now(),
    fetchTime: Date.now(),
    read: false,
    starred: false,
    ...overrides,
  }
}

describe('addArticles', () => {
  it('adds new articles', () => {
    const articles = [makeArticle({ id: 'test_1' }), makeArticle({ id: 'test_2' })]
    ns.storage.addArticles(articles)
    const { articles: stored, total } = ns.storage.getArticles()
    assert.strictEqual(total, 2)
  })

  it('rejects duplicate ids', () => {
    ns.storage.addArticles([makeArticle({ id: 'dup_1' })])
    ns.storage.addArticles([makeArticle({ id: 'dup_1', title: 'Different' })])
    const { total } = ns.storage.getArticles()
    assert.strictEqual(total, 1)
  })
})

describe('getArticles', () => {
  it('filters by source', () => {
    ns.storage.addArticles([
      makeArticle({ id: 'f1', source: 'zhihu' }),
      makeArticle({ id: 'f2', source: 'weibo' }),
    ])
    const { articles, total } = ns.storage.getArticles({ source: 'zhihu' })
    assert.strictEqual(total, 1)
    assert.strictEqual(articles[0].source, 'zhihu')
  })

  it('filters by read status', () => {
    ns.storage.addArticles([
      makeArticle({ id: 'r1' }),
      makeArticle({ id: 'r2' }),
    ])
    ns.storage.markRead('r2')
    const { articles: unread } = ns.storage.getArticles({ read: false })
    assert.strictEqual(unread.length, 1)
    const { articles: read } = ns.storage.getArticles({ read: true })
    assert.strictEqual(read.length, 1)
  })

  it('filters by keyword', () => {
    ns.storage.addArticles([
      makeArticle({ id: 'k1', title: 'Hello World' }),
      makeArticle({ id: 'k2', title: 'Foo Bar' }),
    ])
    const { articles } = ns.storage.getArticles({ keyword: 'hello' })
    assert.strictEqual(articles.length, 1)
  })

  it('sorts by publishTime descending', () => {
    const now = Date.now()
    ns.storage.addArticles([
      makeArticle({ id: 's1', publishTime: now - 10000 }),
      makeArticle({ id: 's2', publishTime: now }),
      makeArticle({ id: 's3', publishTime: now - 5000 }),
    ])
    const { articles } = ns.storage.getArticles()
    assert.strictEqual(articles[0].publishTime, now)
    assert.strictEqual(articles[1].publishTime, now - 5000)
    assert.strictEqual(articles[2].publishTime, now - 10000)
  })

  it('paginates with limit', () => {
    const now = Date.now()
    const articles = Array.from({ length: 10 }, (_, i) => makeArticle({ id: `p${i}`, publishTime: now - i }))
    ns.storage.addArticles(articles)
    const { articles: page } = ns.storage.getArticles({ limit: 3 })
    assert.strictEqual(page.length, 3)
  })
})

describe('markRead / markStarred', () => {
  it('marks article as read', () => {
    ns.storage.addArticles([makeArticle({ id: 'mr1' })])
    ns.storage.markRead('mr1')
    const article = ns.storage.getArticleById('mr1')
    assert.strictEqual(article.read, true)
  })

  it('marks article as starred', () => {
    ns.storage.addArticles([makeArticle({ id: 'ms1' })])
    ns.storage.markStarred('ms1')
    const article = ns.storage.getArticleById('ms1')
    assert.strictEqual(article.starred, true)
  })
})

describe('getUnreadCount', () => {
  it('returns correct count', () => {
    ns.storage.addArticles([
      makeArticle({ id: 'uc1' }),
      makeArticle({ id: 'uc2' }),
      makeArticle({ id: 'uc3' }),
    ])
    ns.storage.markRead('uc2')
    assert.strictEqual(ns.storage.getUnreadCount(), 2)
  })
})

describe('clearAll / removeArticles', () => {
  it('clears all articles', () => {
    ns.storage.addArticles([makeArticle({ id: 'ca1' })])
    ns.storage.clearAll()
    const { total } = ns.storage.getArticles()
    assert.strictEqual(total, 0)
  })

  it('removes specific articles', () => {
    ns.storage.addArticles([makeArticle({ id: 'ra1' }), makeArticle({ id: 'ra2' })])
    ns.storage.removeArticles(['ra1'])
    const { articles } = ns.storage.getArticles()
    assert.strictEqual(articles.length, 1)
    assert.strictEqual(articles[0].id, 'ra2')
  })
})
