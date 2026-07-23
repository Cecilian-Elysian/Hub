import { describe, it, before } from 'node:test'
import assert from 'node:assert/strict'
import { mockGM, loadBuiltCore } from './setup.js'

before(() => {
  mockGM()
  loadBuiltCore()
})

describe('formatTime', () => {
  it('returns empty for falsy input', () => {
    assert.strictEqual(NewsAggregator.format.formatTime(0), '')
    assert.strictEqual(NewsAggregator.format.formatTime(null), '')
    assert.strictEqual(NewsAggregator.format.formatTime(undefined), '')
  })

  it('returns 刚刚 for < 1 minute', () => {
    assert.strictEqual(NewsAggregator.format.formatTime(Date.now() - 30000), '刚刚')
  })

  it('returns minutes for < 1 hour', () => {
    assert.strictEqual(NewsAggregator.format.formatTime(Date.now() - 120000), '2 分钟前')
  })

  it('returns hours for < 1 day', () => {
    assert.strictEqual(NewsAggregator.format.formatTime(Date.now() - 7200000), '2 小时前')
  })

  it('returns days for < 7 days', () => {
    assert.strictEqual(NewsAggregator.format.formatTime(Date.now() - 172800000), '2 天前')
  })
})

describe('formatDate', () => {
  it('returns empty for falsy input', () => {
    assert.strictEqual(NewsAggregator.format.formatDate(0), '')
    assert.strictEqual(NewsAggregator.format.formatDate(null), '')
  })

  it('formats date correctly', () => {
    const d = new Date('2026-07-15T14:30:00')
    assert.strictEqual(NewsAggregator.format.formatDate(d.getTime()), '2026-07-15 14:30')
  })
})

describe('escapeHtml', () => {
  it('returns empty for falsy input', () => {
    assert.strictEqual(NewsAggregator.format.escapeHtml(''), '')
    assert.strictEqual(NewsAggregator.format.escapeHtml(null), '')
  })

  it('escapes & < > "', () => {
    const result = NewsAggregator.format.escapeHtml('<script>"hello" & world')
    assert.strictEqual(result, '&lt;script&gt;&quot;hello&quot; &amp; world')
  })

  it('escapes single quote', () => {
    const result = NewsAggregator.format.escapeHtml("it's")
    assert.strictEqual(result, 'it&#39;s')
  })

  it('passes through safe text', () => {
    assert.strictEqual(NewsAggregator.format.escapeHtml('hello world'), 'hello world')
  })
})

describe('extractKeywords', () => {
  it('returns empty for empty title', () => {
    assert.deepStrictEqual(NewsAggregator.format.extractKeywords(''), [])
    assert.deepStrictEqual(NewsAggregator.format.extractKeywords(null), [])
  })

  it('extracts Chinese keywords', () => {
    const result = NewsAggregator.format.extractKeywords('美国总统拜登访问日本')
    assert.ok(result.includes('总统'))
    assert.ok(result.includes('拜登'))
    assert.ok(result.includes('访问'))
    assert.ok(result.includes('日本'))
  })

  it('extracts English keywords', () => {
    const result = NewsAggregator.format.extractKeywords('OpenAI releases GPT-5 model')
    assert.ok(result.includes('openai'))
    assert.ok(result.includes('releases'))
    assert.ok(result.includes('model'))
  })

  it('filters stop words', () => {
    const result = NewsAggregator.format.extractKeywords('这是一个测试')
    assert.ok(!result.includes('这'))
    assert.ok(result.includes('测试'))
  })

  it('deduplicates', () => {
    const result = NewsAggregator.format.extractKeywords('test test test')
    assert.strictEqual(result.filter(k => k === 'test').length, 1)
  })
})

describe('generateDigestMarkdown', () => {
  it('groups articles by source', () => {
    const articles = [
      { source: 'zhihu', title: '安全出口', url: 'https://zhihu.com/1' },
      { source: 'weibo', title: '天气', url: 'https://weibo.com/2', summary: '今天天气不错' },
    ]
    const result = NewsAggregator.format.generateDigestMarkdown(articles, Date.now() - 86400000, Date.now())
    assert.ok(result.includes('新闻周报'))
    assert.ok(result.includes('知乎'))
    assert.ok(result.includes('微博'))
    assert.ok(result.includes('安全出口'))
    assert.ok(result.includes('天气'))
    assert.ok(result.includes('今天天气不错'))
  })

  it('handles empty list', () => {
    const result = NewsAggregator.format.generateDigestMarkdown([], Date.now(), Date.now())
    assert.ok(result.includes('**0** 条'))
  })
})
