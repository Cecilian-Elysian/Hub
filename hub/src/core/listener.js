;(function(ns) {

const _listeners = new Set()
const _installed = new Map()
let _bound = false

function _handleLoaded(e) {
  let detail = null
  try {
    detail = e && e.detail
  } catch (err) {
    detail = null
  }
  if (!detail || !detail.id) return
  const id = detail.id
  if (!ns.registry.getById(id)) {
    ns.log.debug('unknown script reported loaded:', id)
    return
  }
  if (_installed.has(id)) return
  _installed.set(id, { loadedAt: Date.now(), version: detail.version || null })
  for (const cb of _listeners) {
    try {
      cb(id, 'event')
    } catch (err) {
      ns.log.error('listener callback failed', err)
    }
  }
}

function _onVisibilityChange() {
  if (typeof document === 'undefined') return
  if (document.hidden) return
  const before = _installed.size
  const now = ns.detector.scanWindow()
  for (const item of now) {
    if (!_installed.has(item.id)) {
      _installed.set(item.id, { loadedAt: item.loadedAt, version: null })
      for (const cb of _listeners) {
        try { cb(item.id, 'visibility') } catch (err) { ns.log.error(err) }
      }
    }
  }
  if (_installed.size !== before) {
    ns.log.debug('visibility scan added scripts:', _installed.size - before)
  }
}

function start() {
  if (_bound) return
  _bound = true
  if (typeof window !== 'undefined') {
    try {
      window.addEventListener(ns.constants.EVENTS.SCRIPT_LOADED, _handleLoaded)
    } catch (e) {
      ns.log.warn('cannot bind script-loaded listener', e)
    }
  }
  if (typeof document !== 'undefined') {
    try {
      document.addEventListener('visibilitychange', _onVisibilityChange)
    } catch (e) {}
  }
  if (typeof window !== 'undefined') {
    try {
      window.addEventListener('pagehide', () => {
        try { window.removeEventListener(ns.constants.EVENTS.SCRIPT_LOADED, _handleLoaded) } catch (e) {}
      }, { once: true })
    } catch (e) {}
  }
}

function onDiscover(cb) {
  if (typeof cb !== 'function') return false
  _listeners.add(cb)
  return true
}

function offDiscover(cb) {
  return _listeners.delete(cb)
}

function getInstalled() {
  return Array.from(_installed.keys())
}

function isInstalled(id) {
  return _installed.has(id)
}

function reset() {
  _installed.clear()
}

ns.listener = { start, onDiscover, offDiscover, getInstalled, isInstalled, reset }

})(CatHub)