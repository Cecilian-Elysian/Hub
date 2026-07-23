;(function(ns) {

const _handlers = new Map()
const _listening = new Set()

function _parseCombo(combo) {
  if (!combo || typeof combo !== 'string') return null
  const parts = combo.toLowerCase().split('+').map(s => s.trim())
  const key = parts.pop()
  if (!key) return null
  return {
    key,
    alt: parts.includes('alt'),
    shift: parts.includes('shift'),
    ctrl: parts.includes('ctrl') || parts.includes('control'),
    meta: parts.includes('meta') || parts.includes('cmd'),
  }
}

function _shouldIgnoreTarget(target) {
  if (!target) return false
  const tag = (target.tagName || '').toLowerCase()
  if (tag === 'input' || tag === 'textarea' || tag === 'select') return true
  if (target.isContentEditable) return true
  return false
}

function _onKeyDown(e) {
  const combo = _parseCombo(e.key && {
    alt: e.altKey,
    shift: e.shiftKey,
    ctrl: e.ctrlKey,
    meta: e.metaKey,
    key: e.key,
  } ? _keyToCombo(e) : null)
  if (!combo) return
  for (const [registered, handler] of _handlers) {
    const parsed = _parseCombo(registered)
    if (!parsed) continue
    if (parsed.key === combo.key &&
        parsed.alt === combo.alt &&
        parsed.shift === combo.shift &&
        parsed.ctrl === combo.ctrl &&
        parsed.meta === combo.meta) {
      if (_shouldIgnoreTarget(e.target)) return
      try {
        e.preventDefault()
        e.stopPropagation()
        handler(e)
      } catch (err) {
        ns.log && ns.log.error('hotkey handler failed', err)
      }
      return
    }
  }
}

function _keyToCombo(e) {
  const parts = []
  if (e.ctrlKey) parts.push('Ctrl')
  if (e.metaKey) parts.push('Meta')
  if (e.altKey) parts.push('Alt')
  if (e.shiftKey) parts.push('Shift')
  let key = e.key
  if (key && key.length === 1) key = key.toUpperCase()
  if (key === ' ') key = 'Space'
  parts.push(key)
  return parts.join('+')
}

function register(combo, handler) {
  if (!combo || typeof handler !== 'function') return false
  _handlers.set(combo, handler)
  if (_listening.size === 0) {
    try {
      document.addEventListener('keydown', _onKeyDown, true)
      _listening.add('keydown')
    } catch (e) {}
  }
  return true
}

function unregister(combo) {
  if (_handlers.delete(combo) && _handlers.size === 0) {
    try {
      document.removeEventListener('keydown', _onKeyDown, true)
      _listening.delete('keydown')
    } catch (e) {}
  }
}

function clear() {
  _handlers.clear()
  if (_listening.has('keydown')) {
    try { document.removeEventListener('keydown', _onKeyDown, true) } catch (e) {}
    _listening.delete('keydown')
  }
}

ns.hotkey = { register, unregister, clear }

})(CatHub)