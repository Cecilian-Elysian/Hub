;(function(ns) {

let _queue = []
let _timer = null

function pushNotification(title, text, options = {}) {
  _queue.push({ title, text, ...options })
  if (!_timer) {
    _timer = setTimeout(_flush, 1000)
  }
}

function _flush() {
  _timer = null
  if (_queue.length === 0) return
  const batch = _queue.splice(0)
  if (batch.length === 1) {
    _send(batch[0])
  } else {
    _send({
      title: `${batch.length} 项更新`,
      text: batch.map(n => n.title).slice(0, 5).join('、'),
      silent: true,
      timeout: 5000,
    })
  }
}

function _send(d) {
  try {
    GM_notification({
      title: d.title || '网址收藏',
      text: d.text || '',
      silent: d.silent !== false,
      timeout: d.timeout || 4000,
      onclick: d.onclick,
    })
  } catch (e) {
    GM_log('[BookmarkNotify] ' + (e.message || e), 'warn')
  }
}

ns.notify = { pushNotification }
})(BookmarkLogger)