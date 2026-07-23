;(function(ns) {

const _store = {}
let _initialized = false

function _ensureInit() {
  if (_initialized) return
  _initialized = true
  try {
    if (typeof GM_getValue === 'function') {
      const persisted = GM_getValue(ns.constants.STORAGE.CONFIG, null)
      if (persisted && typeof persisted === 'object') {
        Object.assign(_store, persisted)
      }
    }
  } catch (e) {}
}

function _persist() {
  try {
    if (typeof GM_setValue === 'function') {
      const snap = {}
      for (const k of Object.keys(_store)) snap[k] = _store[k]
      GM_setValue(ns.constants.STORAGE.CONFIG, snap)
    }
  } catch (e) {}
}

function get(key, defaultValue) {
  _ensureInit()
  return _store.hasOwnProperty(key) ? _store[key] : defaultValue
}

function set(key, value) {
  _ensureInit()
  _store[key] = value
  _persist()
  return value
}

function remove(key) {
  _ensureInit()
  if (_store.hasOwnProperty(key)) {
    delete _store[key]
    _persist()
    return true
  }
  return false
}

function has(key) {
  _ensureInit()
  return _store.hasOwnProperty(key)
}

function keys() {
  _ensureInit()
  return Object.keys(_store)
}

function clear(prefix) {
  _ensureInit()
  if (!prefix) {
    for (const k of Object.keys(_store)) delete _store[k]
  } else {
    for (const k of Object.keys(_store)) {
      if (k.startsWith(prefix)) delete _store[k]
    }
  }
  _persist()
}

function size(prefix) {
  _ensureInit()
  if (!prefix) return Object.keys(_store).length
  return Object.keys(_store).filter(k => k.startsWith(prefix)).length
}

ns.storage = { get, set, remove, has, keys, clear, size }

})(CatHub)