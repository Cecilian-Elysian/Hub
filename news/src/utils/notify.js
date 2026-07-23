;(function(ns) {

let _notifyQueue = []
let _notifyTimer = null

function pushNotification(title, text, options = {}) {
  _notifyQueue.push({ title, text, ...options })
  if (!_notifyTimer) {
    _notifyTimer = setTimeout(_flushQueue, 1000)
  }
}

function _flushQueue() {
  _notifyTimer = null
  if (_notifyQueue.length === 0) return
  const batch = _notifyQueue.splice(0)
  if (batch.length === 1) {
    _sendNotification(batch[0])
  } else {
    _sendNotification({
      title: `${batch.length} 条新闻更新`,
      text: batch.map(n => n.title).join('、').slice(0, 200),
      silent: true,
      timeout: 6000,
    })
  }
}

function _sendNotification(details) {
  try {
    GM_notification({
      title: details.title || '新闻聚合',
      text: details.text || '',
      silent: details.silent !== false,
      timeout: details.timeout || 4000,
      onclick: details.onclick,
    })
  } catch (e) {
    GM_log(`[Notify] ${e.message}`, 'warn')
  }
}

function notifyKeywordMatch(article, keyword) {
  pushNotification(
    `🔑 ${keyword}`,
    article.title,
    {
      timeout: 8000,
      onclick() {
        if (article.url) GM_openInTab(article.url)
      },
    }
  )
}

ns.notify = { pushNotification, notifyKeywordMatch }
})(NewsAggregator)
