;(function(ns) {

const _recent = new Map()
const DEDUPE_WINDOW = 5000

function notify(title, text, opts) {
  opts = opts || {}
  const key = (title || '') + '::' + (text || '')
  const now = Date.now()
  const last = _recent.get(key)
  if (last && now - last < DEDUPE_WINDOW) return false
  _recent.set(key, now)
  if (_recent.size > 50) {
    const cutoff = now - DEDUPE_WINDOW
    for (const [k, t] of _recent) {
      if (t < cutoff) _recent.delete(k)
    }
  }
  try {
    if (typeof GM_notification === 'function') {
      GM_notification({
        title: title || '',
        text: text || '',
        silent: opts.silent === true,
        timeout: opts.timeout != null ? opts.timeout : 4000,
      })
      return true
    }
  } catch (e) {
    ns.log && ns.log.warn('notify failed', e.message || e)
  }
  return false
}

function clear() {
  _recent.clear()
}

ns.notify = { notify, clear }

})(CatHub)