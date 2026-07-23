import { test, describe, beforeEach } from 'node:test'
import assert from 'node:assert/strict'

import './setup.js'
import { loadHub } from './helper.js'

describe('format', () => {
  let format
  beforeEach(() => {
    const hub = loadHub(['namespace.js', 'utils/log.js', 'utils/format.js'])
    format = hub.format
  })

  test('formatTime handles zero', () => {
    assert.equal(format.formatTime(0), '—')
  })

  test('formatTime returns relative for recent', () => {
    const now = Date.now()
    assert.equal(format.formatTime(now - 30000), '30 秒前')
    assert.equal(format.formatTime(now - 120000), '2 分钟前')
    assert.equal(format.formatTime(now - 3600000), '1 小时前')
    assert.equal(format.formatTime(now - 86400000), '1 天前')
  })

  test('formatCount handles large numbers', () => {
    assert.equal(format.formatCount(999), '999')
    assert.equal(format.formatCount(1500), '1.5k')
    assert.equal(format.formatCount(12000), '1.2w')
  })

  test('escapeHtml escapes special chars', () => {
    assert.equal(format.escapeHtml('<script>'), '&lt;script&gt;')
    assert.equal(format.escapeHtml('a & b'), 'a &amp; b')
    assert.equal(format.escapeHtml('"x"'), '&quot;x&quot;')
    assert.equal(format.escapeHtml(null), '')
  })

  test('truncate cuts long strings', () => {
    assert.equal(format.truncate('hello', 10), 'hello')
    assert.equal(format.truncate('hello world', 5), 'hell…')
  })

  test('bytes formats sizes', () => {
    assert.equal(format.bytes(0), '0 B')
    assert.equal(format.bytes(1023), '1023 B')
    assert.equal(format.bytes(2048), '2.0 KB')
    assert.equal(format.bytes(2 * 1024 * 1024), '2.00 MB')
  })
})