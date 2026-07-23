;(function(ns) {

const STORAGE = {
  BOOKMARKS: 'bookmarks',
  CONFIG: 'config',
  EXPORT_LOG: 'export_log',
}

function _all() {
  return GM_getValue(STORAGE.BOOKMARKS, [])
}

function _save(list) {
  GM_setValue(STORAGE.BOOKMARKS, list)
}

function addBookmarks(items) {
  if (!items || !items.length) return { added: 0, updated: 0, skipped: 0 }
  const existing = _all()
  const dedup = ns.dedup
  const config = ns.config.getConfig() || {}
  const byKey = new Map(existing.map(b => [dedup.urlDedupKey(b.url), b]))
  let added = 0, updated = 0, skipped = 0
  const now = Date.now()
  for (const item of items) {
    if (!item.url) { skipped++; continue }
    const key = dedup.urlDedupKey(item.url)
    if (byKey.has(key)) {
      const prev = byKey.get(key)
      prev.title = item.title || prev.title
      prev.folder = item.folder || prev.folder
      prev.folderPath = item.folderPath || prev.folderPath
      prev.addDate = item.addDate || prev.addDate
      prev.icon = item.icon || prev.icon
      prev.tags = item.tags && item.tags.length ? item.tags : prev.tags
      prev.description = item.description || prev.description
      prev.updateTime = now
      updated++
    } else {
      const bm = {
        id: `${(config.import && config.import.defaultImportIdPrefix) || 'bm'}_${key}_${existing.length + added}`,
        title: item.title || item.url,
        url: item.url,
        folder: item.folder || '',
        folderPath: item.folderPath || '',
        addDate: item.addDate || 0,
        icon: item.icon || '',
        tags: item.tags || [],
        description: item.description || '',
        source: 'import',
        importTime: now,
        updateTime: now,
      }
      existing.push(bm)
      byKey.set(key, bm)
      added++
    }
  }

  const maxTotal = (config && config.maxTotalBookmarks) || 5000
  const retentionDays = (config && config.retentionDays) || 365
  const cutoff = now - retentionDays * 86400000
  let pruned = existing
  if (pruned.length > maxTotal) {
    pruned = pruned.slice(pruned.length - maxTotal)
  }
  pruned = pruned.filter(b => !b.addDate || b.addDate >= cutoff)
  _save(pruned)
  return { added, updated, skipped, total: pruned.length }
}

function getBookmarks(options = {}) {
  let list = _all()
  const {
    folder, folderPath, keyword, tag, limit, offset = 0,
  } = options

  if (folder) list = list.filter(b => b.folder === folder)
  if (folderPath) list = list.filter(b => (b.folderPath || '').startsWith(folderPath))
  if (tag) list = list.filter(b => Array.isArray(b.tags) && b.tags.includes(tag))
  if (keyword) {
    const kw = keyword.toLowerCase()
    list = list.filter(b =>
      (b.title || '').toLowerCase().includes(kw) ||
      (b.url || '').toLowerCase().includes(kw) ||
      (b.folder || '').toLowerCase().includes(kw) ||
      (b.folderPath || '').toLowerCase().includes(kw)
    )
  }

  list.sort((a, b) => {
    const ta = a.addDate || a.importTime || 0
    const tb = b.addDate || b.importTime || 0
    return tb - ta
  })
  const total = list.length
  if (limit) list = list.slice(offset, offset + limit)
  return { bookmarks: list, total }
}

function getBookmarkById(id) {
  return _all().find(b => b.id === id) || null
}

function getBookmarkByUrl(url) {
  const key = ns.dedup.urlDedupKey(url)
  return _all().find(b => ns.dedup.urlDedupKey(b.url) === key) || null
}

function removeBookmarks(ids) {
  const idSet = new Set(ids)
  const list = _all().filter(b => !idSet.has(b.id))
  _save(list)
  return _all().length
}

function updateBookmark(id, patch) {
  const list = _all()
  const bm = list.find(b => b.id === id)
  if (!bm) return null
  Object.assign(bm, patch, { updateTime: Date.now() })
  _save(list)
  return bm
}

function clearAll() {
  GM_deleteValue(STORAGE.BOOKMARKS)
}

function getFolders() {
  const set = new Set()
  for (const b of _all()) {
    if (b.folderPath) set.add(b.folderPath)
    else if (b.folder) set.add(b.folder)
  }
  return Array.from(set).sort()
}

function getStats() {
  const list = _all()
  return {
    total: list.length,
    folders: getFolders().length,
    withDate: list.filter(b => b.addDate).length,
    oldest: list.reduce((acc, b) => Math.min(acc, b.addDate || acc), Date.now()),
    newest: list.reduce((acc, b) => Math.max(acc, b.addDate || 0), 0),
  }
}

function logExport(entry) {
  const log = GM_getValue(STORAGE.EXPORT_LOG, [])
  log.unshift(Object.assign({ time: Date.now() }, entry))
  if (log.length > 50) log.length = 50
  GM_setValue(STORAGE.EXPORT_LOG, log)
}

ns.storage = {
  addBookmarks, getBookmarks, getBookmarkById, getBookmarkByUrl,
  removeBookmarks, updateBookmark, clearAll,
  getFolders, getStats, logExport,
}
})(BookmarkLogger)