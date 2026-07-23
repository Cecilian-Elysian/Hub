;(function(ns) {

function simpleHash(str) {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash |= 0
  }
  return hash
}

function urlDedupKey(url) {
  const u = url.replace(/^https?:\/\//, '').replace(/\/$/, '').toLowerCase()
  return simpleHash(u)
}

function titleSimilarity(a, b) {
  const la = a.length, lb = b.length
  if (la === 0 || lb === 0) return 0
  const maxLen = Math.max(la, lb)
  const matrix = []
  for (let i = 0; i <= la; i++) matrix[i] = [i]
  for (let j = 0; j <= lb; j++) matrix[0][j] = j
  for (let i = 1; i <= la; i++) {
    for (let j = 1; j <= lb; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      )
    }
  }
  return 1 - matrix[la][lb] / maxLen
}

function isDuplicate(newArticle, existingArticles) {
  const newUrlHash = urlDedupKey(newArticle.url || '')
  for (const existing of existingArticles) {
    if (existing.id === newArticle.id) return true
    if (urlDedupKey(existing.url || '') === newUrlHash) return true
    if (titleSimilarity(existing.title, newArticle.title) > 0.85) return true
  }
  return false
}

ns.dedup = { simpleHash, urlDedupKey, titleSimilarity, isDuplicate }
if (typeof globalThis !== 'undefined') globalThis.simpleHash = simpleHash
})(NewsAggregator)
