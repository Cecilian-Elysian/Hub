;(function(ns) {

function _ttl() {
  return ns.config.getConfig('polling.hubTtl') || ns.constants.UI.HUB_TTL
}

function isHubActive() {
  try {
    const ts = GM_getValue(ns.constants.STORAGE.ACTIVE_TS, 0)
    if (!ts) return false
    return (Date.now() - Number(ts)) < _ttl()
  } catch (e) {
    return false
  }
}

function markActive() {
  try {
    GM_setValue(ns.constants.STORAGE.ACTIVE_TS, Date.now())
    return true
  } catch (e) {
    return false
  }
}

function getHidden() {
  try {
    const list = GM_getValue(ns.constants.STORAGE.HIDDEN_SCRIPTS, [])
    return Array.isArray(list) ? list.slice() : []
  } catch (e) {
    return []
  }
}

function isHidden(id) {
  if (!isHubActive()) return false
  return getHidden().includes(id)
}

function setHidden(id, hidden) {
  const list = getHidden()
  const idx = list.indexOf(id)
  if (hidden && idx === -1) list.push(id)
  if (!hidden && idx !== -1) list.splice(idx, 1)
  try {
    GM_setValue(ns.constants.STORAGE.HIDDEN_SCRIPTS, list)
  } catch (e) {}
  return list
}

function takeOverAll() {
  const all = ns.registry.getIds()
  try {
    GM_setValue(ns.constants.STORAGE.HIDDEN_SCRIPTS, all)
  } catch (e) {}
  return all
}

function restoreAll() {
  try {
    GM_deleteValue(ns.constants.STORAGE.HIDDEN_SCRIPTS)
  } catch (e) {}
  return ns.registry.getIds()
}

function purgeExpired() {
  if (isHubActive()) return false
  try {
    GM_deleteValue(ns.constants.STORAGE.HIDDEN_SCRIPTS)
    GM_deleteValue(ns.constants.STORAGE.ACTIVE_TS)
    return true
  } catch (e) {
    return false
  }
}

ns.takeover = { isHubActive, markActive, getHidden, isHidden, setHidden, takeOverAll, restoreAll, purgeExpired }

})(CatHub)