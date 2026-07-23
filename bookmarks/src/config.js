;(function(ns) {

const DEFAULTS = {
  maxTotalBookmarks: 5000,
  retentionDays: 365,
  import: {
    recursiveFolders: true,
    dedupByUrl: true,
    defaultImportIdPrefix: 'bm',
  },
  ui: {
    position: 'bottom-right',
    theme: 'auto',
    maxDisplay: 100,
  },
  export: {
    format: 'markdown',
    groupBy: 'folder',
    includeTimestamp: true,
  },
}

function getConfig(key) {
  const full = _loadConfig()
  if (!key) return full
  const keys = key.split('.')
  let val = full
  for (const k of keys) {
    if (val == null) return undefined
    val = val[k]
  }
  return val
}

function setConfig(key, value) {
  const full = getConfig()
  const keys = key.split('.')
  let cur = full
  for (let i = 0; i < keys.length - 1; i++) {
    if (!cur[keys[i]] || typeof cur[keys[i]] !== 'object') cur[keys[i]] = {}
    cur = cur[keys[i]]
  }
  cur[keys[keys.length - 1]] = value
  GM_setValue('config', full)
}

function resetConfig() {
  GM_setValue('config', JSON.parse(JSON.stringify(DEFAULTS)))
}

function _loadConfig() {
  const stored = GM_getValue('config', null)
  if (!stored) {
    const full = JSON.parse(JSON.stringify(DEFAULTS))
    GM_setValue('config', full)
    return full
  }
  let changed = false
  const merged = JSON.parse(JSON.stringify(DEFAULTS))
  for (const key of Object.keys(DEFAULTS)) {
    if (stored[key] && typeof stored[key] === 'object' && !Array.isArray(stored[key])) {
      merged[key] = { ...merged[key], ...stored[key] }
      changed = true
    } else if (stored[key] !== undefined) {
      merged[key] = stored[key]
    }
  }
  if (changed) GM_setValue('config', merged)
  return merged
}

ns.config = { getConfig, setConfig, resetConfig, DEFAULTS }
})(BookmarkLogger)