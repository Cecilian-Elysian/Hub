;(function(ns) {

const _cache = new Map()
let _lastRefresh = 0

function _now() { return Date.now() }

function refresh(force) {
  const interval = (ns.config.getConfig('polling.badgeInterval') || ns.constants.UI.BADGE_REFRESH_INTERVAL)
  const now = _now()
  if (!force && now - _lastRefresh < interval) return _cache
  _lastRefresh = now
  _cache.clear()
  for (const id of ns.registry.getIds()) {
    if (!ns.detector.isInstalled(id)) {
      _cache.set(id, null)
      continue
    }
    try {
      const stats = ns.detector.getStats(id)
      _cache.set(id, stats)
    } catch (e) {
      _cache.set(id, null)
    }
  }
  return _cache
}

function get(id) {
  if (!_cache.has(id)) refresh(true)
  return _cache.get(id) || null
}

function getAll() {
  if (_cache.size === 0) refresh(true)
  const out = {}
  for (const [k, v] of _cache) out[k] = v
  return out
}

function invalidate(id) {
  if (id) _cache.delete(id)
  else _cache.clear()
  _lastRefresh = 0
}

function totalUnread() {
  let sum = 0
  for (const stats of _cache.values()) {
    if (!stats || !stats.primary) continue
    sum += Number(stats.primary.count) || 0
  }
  return sum
}

ns.badge = { refresh, get, getAll, invalidate, totalUnread }

})(CatHub)