;(function(ns) {

const HUB_NAMESPACE = 'CatHub'
const HUB_EVENT_LOADED = 'cat-script:loaded'
const HUB_KEY_ACTIVE_TS = 'active-ts'
const HUB_KEY_HIDDEN = 'hidden'
const HUB_TTL = 7 * 86400000

const SCRIPT_META = {
  id: 'news',
  name: '新闻聚合',
  icon: 'newspaper',
  description: '多源新闻抓取与聚合',
  version: '0.2.0',
  author: 'Cecilian-Elysian',
}

function _isHubActive() {
  try {
    const ts = GM_getValue(HUB_KEY_ACTIVE_TS, 0)
    if (!ts) return false
    return (Date.now() - Number(ts)) < HUB_TTL
  } catch (e) { return false }
}

function _isHiddenByHub() {
  if (!_isHubActive()) return false
  try {
    const list = GM_getValue(HUB_KEY_HIDDEN, [])
    return Array.isArray(list) && list.includes(SCRIPT_META.id)
  } catch (e) { return false }
}

function install() {
  ns.meta = SCRIPT_META
  if (ns.storage && typeof ns.storage.getStats !== 'function') {
    ns.storage.getStats = function() {
      try {
        const all = GM_getValue('articles', [])
        const unread = all.filter(a => !a.read).length
        const sources = new Set(all.map(a => a.source).filter(Boolean))
        return {
          primary: { count: unread, label: '未读' },
          secondary: { count: all.length, label: '总' },
          extra: { sources: sources.size },
        }
      } catch (e) { return null }
    }
  }
}

function isHiddenByHub() {
  return _isHiddenByHub()
}

function notifyLoaded() {
  try {
    window.dispatchEvent(new CustomEvent(HUB_EVENT_LOADED, {
      detail: { id: SCRIPT_META.id, version: SCRIPT_META.version },
    }))
  } catch (e) {
    try {
      console.error('[NewsUI] notifyLoaded failed:', e)
    } catch (e2) {}
  }
}

ns.hubCompat = { install, isHiddenByHub, notifyLoaded, meta: SCRIPT_META, HUB_NAMESPACE }

})(NewsAggregator)