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
  if (!url) return simpleHash('')
  let u = url.trim().toLowerCase()
  u = u.replace(/^https?:\/\//, '')
  u = u.replace(/\/+$/, '')
  u = u.replace(/\?utm_[^&]*(&|$)/g, '')
  u = u.replace(/\?$/, '')
  return simpleHash(u)
}

ns.dedup = { simpleHash, urlDedupKey }
})(BookmarkLogger)