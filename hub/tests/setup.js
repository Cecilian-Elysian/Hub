;(function() {

const _store = {}

globalThis.GM_getValue = function(key, defaultValue) {
  if (_store.hasOwnProperty(key)) return _store[key]
  return defaultValue
}

globalThis.GM_setValue = function(key, value) {
  _store[key] = value
}

globalThis.GM_deleteValue = function(key) {
  if (_store.hasOwnProperty(key)) {
    delete _store[key]
    return true
  }
  return false
}

globalThis.GM_listValues = function() {
  return Object.keys(_store)
}

globalThis.GM_notification = function() {}

globalThis.GM_openInTab = function() {}

globalThis.GM_registerMenuCommand = function() {}

globalThis.GM_addStyle = function() {}

globalThis.GM_log = function() {}

globalThis._gmStore = _store

function resetMock() {
  for (const k of Object.keys(_store)) delete _store[k]
}

function setMock(key, value) {
  _store[key] = value
}

function getMock(key) {
  return _store[key]
}

globalThis._resetMock = resetMock
globalThis._setMock = setMock
globalThis._getMock = getMock

})()