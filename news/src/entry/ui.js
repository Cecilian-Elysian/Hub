;(function (ns) {
  'use strict'

  console.log('[NewsUI] entry script running', {
    href: location.href,
    protocol: location.protocol,
    readyState: typeof document !== 'undefined' ? document.readyState : 'no-doc',
    hasGM_info: typeof GM_info !== 'undefined',
    hasGM_getValue: typeof GM_getValue !== 'undefined',
  })

  if (typeof GM_getValue === 'undefined' || typeof GM_setValue === 'undefined') {
    console.error('[NewsUI] GM API not available, aborting')
    return
  }

  const isBackground = location.protocol === 'chrome-extension:' ||
                       location.protocol === 'moz-extension:' ||
                       location.protocol === 'about:'
  if (isBackground) {
    console.log('[NewsUI] background page detected, skipping')
    return
  }

  try {
    bootUI()
  } catch (e) {
    console.error('[NewsUI] bootUI failed:', e)
  }

  function bootUI() {
    console.log('[NewsUI] bootUI starting')
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initUI)
    } else {
      initUI()
    }
  }

  function initUI() {
    console.log('[NewsUI] init starting')

    try {
      ns.hubCompat && ns.hubCompat.install()
    } catch (e) {
      console.warn('[NewsUI] hubCompat.install failed:', e)
    }

    const _hubHidden = ns.hubCompat ? ns.hubCompat.isHiddenByHub() : false

    if (!_hubHidden) {
      try {
        ns.ui.button.createFloatingButton(() => ns.ui.panel.openPanel())
        console.log('[NewsUI] floating button created')
      } catch (e) {
        console.error('[NewsUI] createFloatingButton error:', e)
      }

      try {
        GM_registerMenuCommand('打开新闻面板', () => ns.ui.panel.openPanel())
        GM_registerMenuCommand('手动刷新', () => {
          GM_setValue('request_refresh', Date.now())
          GM_notification({ title: '刷新请求已发送', text: '后台正在抓取...', silent: true, timeout: 2000 })
        })
        GM_registerMenuCommand('生成周报', () => {
          GM_setValue('request_digest', Date.now())
          GM_notification({ title: '周报请求已发送', text: '生成后会自动通知', silent: true, timeout: 2000 })
        })
        GM_registerMenuCommand('清空所有新闻', () => {
          if (confirm('确定清空所有新闻数据？')) {
            ns.storage.clearAll()
            ns.ui.button.updateBadge()
            GM_notification({ title: '已清空', text: '所有新闻数据已删除' })
          }
        })
        GM_registerMenuCommand('清理已禁用源的旧文章', () => {
          try {
            const r = ns.storage.purgeDisabledSources()
            GM_notification({
              title: '清理完成',
              text: `已删除 ${r.removed} 条,剩余 ${r.kept} 条${r.sources && r.sources.length ? '\n涉及源: ' + r.sources.join(', ') : ''}`,
              timeout: 6000,
            })
            ns.ui.button.updateBadge()
            if (typeof _panel !== 'undefined' && _panel) ns.ui.panel._renderArticles()
          } catch (e) {
            GM_notification({ title: '清理失败', text: e.message || String(e), timeout: 5000 })
          }
        })
        GM_registerMenuCommand('切换 Hub 接管', () => {
          try {
            const list = GM_getValue('hidden', [])
            const arr = Array.isArray(list) ? list : []
            const next = arr.includes('news') ? arr.filter(x => x !== 'news') : arr.concat(['news'])
            GM_setValue('hidden', next)
            GM_notification({ title: next.includes('news') ? '已隐藏浮动按钮' : '已恢复浮动按钮', text: '刷新页面生效', timeout: 4000 })
          } catch (e) {
            GM_notification({ title: '操作失败', text: e.message || String(e), timeout: 4000 })
          }
        })
      } catch (e) {
        console.error('[NewsUI] registerMenuCommand error:', e)
      }

      try {
        ns.ui.button.updateBadge()
      } catch (e) {
        console.error('[NewsUI] updateBadge error:', e)
      }

      try {
        _seedLastFetchFromLog()
      } catch (e) {}

      try {
        listenUpdates()
      } catch (e) {
        console.error('[NewsUI] listenUpdates error:', e)
      }
    } else {
      try {
        GM_registerMenuCommand('新闻聚合: 打开面板', () => ns.ui.panel.openPanel())
      } catch (e) {}
    }

    try {
      ns.hubCompat && ns.hubCompat.notifyLoaded()
    } catch (e) {
      console.warn('[NewsUI] hubCompat.notifyLoaded failed:', e)
    }

    console.log('[NewsUI] init done')
  }

  function _seedLastFetchFromLog() {
    try {
      const log = GM_getValue('fetch_log', null)
      if (log && log.lastFetch) ns.ui.button.setLastFetchTime(log.lastFetch)
    } catch (e) {}
  }

  function listenUpdates() {
    try {
      const id = GM_addValueChangeListener('articles', () => {
        try { ns.ui.button.updateBadge() } catch (e) { console.error('[NewsUI] badge update error:', e) }
        try {
          if (typeof _panel !== 'undefined' && _panel) ns.ui.panel._renderArticles()
        } catch (e) {
          console.error('[NewsUI] _renderArticles error:', e)
        }
      })
      window.addEventListener('beforeunload', () => {
        try { GM_removeValueChangeListener(id) } catch (e) {}
      })
    } catch (e) {
      console.error('[NewsUI] Listener error: ' + e.message, 'warn')
    }

    try {
      const pid = GM_addValueChangeListener('refresh_progress', (_, val) => {
        try {
          if (val && val.running) {
            ns.ui.button.setRefreshState(true)
          } else {
            ns.ui.button.setRefreshState(false)
            try {
              const log = GM_getValue('fetch_log', null)
              if (log && log.lastFetch) ns.ui.button.setLastFetchTime(log.lastFetch)
            } catch (e) {}
          }
        } catch (e) {
          console.error('[NewsUI] refresh_progress error:', e)
        }
      })
      window.addEventListener('beforeunload', () => {
        try { GM_removeValueChangeListener(pid) } catch (e) {}
      })
    } catch (e) {}

    try {
      const lid = GM_addValueChangeListener('fetch_log', (_, val) => {
        try {
          if (val && val.lastFetch) ns.ui.button.setLastFetchTime(val.lastFetch)
        } catch (e) {}
      })
      window.addEventListener('beforeunload', () => {
        try { GM_removeValueChangeListener(lid) } catch (e) {}
      })
    } catch (e) {}
  }
})(NewsAggregator)