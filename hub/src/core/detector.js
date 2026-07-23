;(function(ns) {

function _isValidNamespace(obj) {
  if (!obj || typeof obj !== 'object') return false
  if (!obj.meta || typeof obj.meta !== 'object') return false
  if (typeof obj.meta.id !== 'string' || !obj.meta.id) return false
  return true
}

function scanWindow() {
  const found = []
  const target = (typeof window !== 'undefined') ? window : (typeof globalThis !== 'undefined' ? globalThis : null)
  if (!target) return found

  const allMeta = ns.registry.getAll()
  for (const meta of allMeta) {
    try {
      const nsObj = target[meta.namespace]
      if (_isValidNamespace(nsObj) && nsObj.meta.id === meta.id) {
        found.push({
          id: meta.id,
          namespace: meta.namespace,
          loadedAt: Date.now(),
          source: 'window',
        })
      }
    } catch (e) {
      ns.log.debug('scan error for', meta.id, e)
    }
  }
  return found
}

function isInstalled(id) {
  const meta = ns.registry.getById(id)
  if (!meta) return false
  const target = (typeof window !== 'undefined') ? window : (typeof globalThis !== 'undefined' ? globalThis : null)
  if (!target) return false
  try {
    const nsObj = target[meta.namespace]
    return _isValidNamespace(nsObj) && nsObj.meta.id === meta.id
  } catch (e) {
    return false
  }
}

function isReady(id) {
  if (!isInstalled(id)) return false
  const meta = ns.registry.getById(id)
  const target = (typeof window !== 'undefined') ? window : null
  if (!target) return false
  try {
    const nsObj = target[meta.namespace]
    return !!(nsObj.ui && nsObj.ui.panel && typeof nsObj.ui.panel.openPanel === 'function')
  } catch (e) {
    return false
  }
}

function getStats(id) {
  if (!isInstalled(id)) return null
  const meta = ns.registry.getById(id)
  const target = (typeof window !== 'undefined') ? window : null
  if (!target) return null
  try {
    const nsObj = target[meta.namespace]
    if (nsObj.storage && typeof nsObj.storage.getStats === 'function') {
      const stats = nsObj.storage.getStats()
      return stats
    }
  } catch (e) {
    ns.log.debug('getStats error for', id, e)
  }
  return null
}

function openScript(id) {
  if (!isReady(id)) return false
  const meta = ns.registry.getById(id)
  const target = (typeof window !== 'undefined') ? window : null
  if (!target) return false
  try {
    const nsObj = target[meta.namespace]
    if (nsObj.ui && nsObj.ui.panel && typeof nsObj.ui.panel.openPanel === 'function') {
      nsObj.ui.panel.openPanel()
      return true
    }
  } catch (e) {
    ns.log.error('openScript error for', id, e)
  }
  return false
}

ns.detector = { scanWindow, isInstalled, isReady, getStats, openScript }

})(CatHub)