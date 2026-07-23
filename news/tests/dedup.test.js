import { describe, it, before } from 'node:test'
import assert from 'node:assert/strict'
import { mockGM, loadBuiltCore } from './setup.js'

before(() => {
  mockGM()
  loadBuiltCore()
})

describe('simpleHash', () => {
  it('produces consistent hash for same input', () => {
    const h1 = NewsAggregator.dedup.simpleHash('hello')
    const h2 = NewsAggregator.dedup.simpleHash('hello')
    assert.strictEqual(h1, h2)
  })

  it('handles empty string', () => {
    assert.strictEqual(NewsAggregator.dedup.simpleHash(''), 0)
  })

  it('handles unicode', () => {
    const h = NewsAggregator.dedup.simpleHash('中文测试')
    assert.strictEqual(typeof h, 'number')
  })
})

describe('urlDedupKey', () => {
  it('normalizes http and https', () => {
    const a = NewsAggregator.dedup.urlDedupKey('http://example.com/page')
    const b = NewsAggregator.dedup.urlDedupKey('https://example.com/page')
    assert.strictEqual(a, b)
  })

  it('is case insensitive', () => {
    const a = NewsAggregator.dedup.urlDedupKey('https://EXAMPLE.com/Path')
    const b = NewsAggregator.dedup.urlDedupKey('https://example.com/path')
    assert.strictEqual(a, b)
  })
})

describe('titleSimilarity', () => {
  it('identical strings return 1', () => {
    assert.strictEqual(NewsAggregator.dedup.titleSimilarity('abc', 'abc'), 1)
  })

  it('empty strings return 0', () => {
    assert.strictEqual(NewsAggregator.dedup.titleSimilarity('', ''), 0)
    assert.strictEqual(NewsAggregator.dedup.titleSimilarity('abc', ''), 0)
  })
})

describe('isDuplicate', () => {
  const existing = [
    { id: 'src_1_123', title: 'Breaking News', url: 'https://example.com/1' },
    { id: 'src_2_456', title: 'Another Story', url: 'https://example.com/2' },
  ]

  it('detects duplicate by id', () => {
    const dup = { id: 'src_1_123', title: 'Different', url: 'https://example.com/other' }
    assert.strictEqual(NewsAggregator.dedup.isDuplicate(dup, existing), true)
  })

  it('detects duplicate by url', () => {
    const dup = { id: 'src_3_789', title: 'Different', url: 'https://example.com/1' }
    assert.strictEqual(NewsAggregator.dedup.isDuplicate(dup, existing), true)
  })

  it('detects duplicate by title similarity', () => {
    const dup = { id: 'src_3_789', title: 'Breaking News!', url: 'https://example.com/3' }
    assert.strictEqual(NewsAggregator.dedup.isDuplicate(dup, existing), true)
  })

  it('allows unique articles', () => {
    const dup = { id: 'src_3_789', title: 'Unique Article', url: 'https://example.com/3' }
    assert.strictEqual(NewsAggregator.dedup.isDuplicate(dup, existing), false)
  })
})
