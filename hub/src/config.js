;(function(ns) {

const DEFAULTS = {
  ui: {
    position: 'bottom-right',
    panelWidth: 380,
    theme: 'auto',
    showBadge: true,
    autoOpenFirstScript: false,
  },
  takeover: {
    autoTakeoverAll: true,
    hiddenScripts: [],
  },
  hotkey: {
    togglePanel: 'Alt+Shift+H',
    openFirst: 'Alt+Shift+1',
    openSecond: 'Alt+Shift+2',
  },
  polling: {
    scanInterval: 5000,
    heartbeatInterval: 30000,
    badgeInterval: 30000,
    hubTtl: 7 * 86400000,
  },
  meta: {
    installedAt: 0,
    version: '0.1.0',
  },
}

function _loadConfig() {
  let stored = null
  try {
    stored = GM_getValue(ns.constants.STORAGE.CONFIG, null)
  } catch (e) {
    stored = null
  }
  if (stored && typeof stored === 'object' && stored.ui) {
    return _mergeWithDefaults(stored)
  }
  const fresh = JSON.parse(JSON.stringify(DEFAULTS))
  fresh.meta.installedAt = Date.now()
  try { GM_setValue(ns.constants.STORAGE.CONFIG, fresh) } catch (e) {}
  return fresh
}

function _mergeWithDefaults(stored) {
  const merged = JSON.parse(JSON.stringify(DEFAULTS))
  for (const key of Object.keys(stored)) {
    if (key in merged && typeof stored[key] === 'object' && stored[key] !== null && !Array.isArray(stored[key])) {
      Object.assign(merged[key], stored[key])
    } else {
      merged[key] = stored[key]
    }
  }
  return merged
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
  const full = _loadConfig()
  const keys = key.split('.')
  let cur = full
  for (let i = 0; i < keys.length - 1; i++) {
    if (!cur[keys[i]] || typeof cur[keys[i]] !== 'object') cur[keys[i]] = {}
    cur = cur[keys[i]]
  }
  cur[keys[keys.length - 1]] = value
  try { GM_setValue(ns.constants.STORAGE.CONFIG, full) } catch (e) {}
  return full
}

function resetConfig() {
  const fresh = JSON.parse(JSON.stringify(DEFAULTS))
  fresh.meta.installedAt = Date.now()
  try { GM_setValue(ns.constants.STORAGE.CONFIG, fresh) } catch (e) {}
  return fresh
}

function updateConfig(patch) {
  const full = _loadConfig()
  for (const key of Object.keys(patch)) {
    const keys = key.split('.')
    let cur = full
    for (let i = 0; i < keys.length - 1; i++) {
      if (!cur[keys[i]] || typeof cur[keys[i]] !== 'object') cur[keys[i]] = {}
      cur = cur[keys[i]]
    }
    cur[keys[keys.length - 1]] = patch[key]
  }
  try { GM_setValue(ns.constants.STORAGE.CONFIG, full) } catch (e) {}
  return full
}

ns.config = { getConfig, setConfig, resetConfig, updateConfig, DEFAULTS }

})(CatHub)