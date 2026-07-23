;(function(ns) {

const STORAGE = {
  ARTICLES: 'articles',
  CONFIG: 'config',
  DIGEST: 'digest',
  FETCH_LOG: 'fetch_log',
}

function _allArticles() {
  return GM_getValue(STORAGE.ARTICLES, [])
}

function _saveArticles(articles) {
  GM_setValue(STORAGE.ARTICLES, articles)
}

function addArticles(newArticles) {
  const existing = _allArticles()
  const existingIds = new Set(existing.map(a => a.id))
  const added = []
  for (const article of newArticles) {
    if (!existingIds.has(article.id)) {
      existingIds.add(article.id)
      article.fetchTime = Date.now()
      article.read = false
      article.starred = false
      existing.unshift(article)
      added.push(article)
    }
  }
  const config = ns.config.getConfig()
  const maxTotal = (config && config.maxTotalArticles) || 2000
  const maxPerSource = (config && config.maxArticlesPerSource) || 100
  const retentionDays = (config && config.retentionDays) || 30
  const cutoff = Date.now() - retentionDays * 86400000
  if (existing.length > maxTotal) {
    existing.length = maxTotal
  }
  const sourceCount = {}
  for (let i = existing.length - 1; i >= 0; i--) {
    const a = existing[i]
    if (a.publishTime && a.publishTime < cutoff) {
      existing.splice(i, 1)
      continue
    }
    const src = a.source
    sourceCount[src] = (sourceCount[src] || 0) + 1
    if (sourceCount[src] > maxPerSource) {
      existing.splice(i, 1)
    }
  }
  _saveArticles(existing)
  return added
}

function getArticles(options = {}) {
  let list = _allArticles()
  const {
    source,
    read,
    starred,
    keyword,
    limit,
    offset = 0,
    since,
    before,
  } = options

  if (source) list = list.filter(a => a.source === source)
  if (read !== undefined) list = list.filter(a => a.read === read)
  if (starred !== undefined) list = list.filter(a => a.starred === starred)
  if (keyword) {
    const kw = keyword.toLowerCase()
    list = list.filter(a =>
      a.title.toLowerCase().includes(kw) ||
      (a.summary && a.summary.toLowerCase().includes(kw))
    )
  }
  if (since) list = list.filter(a => a.publishTime >= since)
  if (before) list = list.filter(a => a.publishTime <= before)

  list.sort((a, b) => (b.publishTime || b.fetchTime) - (a.publishTime || a.fetchTime))
  const total = list.length
  if (limit) list = list.slice(offset, offset + limit)
  return { articles: list, total }
}

function getArticleById(id) {
  return _allArticles().find(a => a.id === id) || null
}

function markRead(id, read = true) {
  const articles = _allArticles()
  const article = articles.find(a => a.id === id)
  if (article) {
    article.read = read
    _saveArticles(articles)
  }
}

function markStarred(id, starred = true) {
  const articles = _allArticles()
  const article = articles.find(a => a.id === id)
  if (article) {
    article.starred = starred
    _saveArticles(articles)
  }
}

function removeArticles(ids) {
  const idSet = new Set(ids)
  const articles = _allArticles().filter(a => !idSet.has(a.id))
  _saveArticles(articles)
}

function clearAll() {
  GM_deleteValue(STORAGE.ARTICLES)
}

function purgeDisabledSources() {
  const config = ns.config.getConfig() || {}
  const sources = (config && config.sources) || {}
  const disabled = new Set(
    Object.entries(sources).filter(([, v]) => v && v.enabled === false).map(([k]) => k)
  )
  if (disabled.size === 0) return { removed: 0, kept: _allArticles().length }
  const before = _allArticles()
  const kept = before.filter(a => !disabled.has(a.source))
  _saveArticles(kept)
  return { removed: before.length - kept.length, kept: kept.length, sources: Array.from(disabled) }
}

function getUnreadCount() {
  return _allArticles().filter(a => !a.read).length
}

function getDigest() {
  return GM_getValue(STORAGE.DIGEST, null)
}

function saveDigest(digest) {
  GM_setValue(STORAGE.DIGEST, digest)
}

ns.storage = { addArticles, getArticles, getArticleById, markRead, markStarred, removeArticles, clearAll, purgeDisabledSources, getUnreadCount, getDigest, saveDigest }
})(NewsAggregator)
