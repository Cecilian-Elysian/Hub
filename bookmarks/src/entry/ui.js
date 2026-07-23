;(function(ns) {
  'use strict'

  if (typeof GM_getValue === 'undefined' || typeof GM_setValue === 'undefined') {
    GM_log && GM_log('[BookmarkUI] GM API not available, aborting', 'error')
    return
  }

  const isBackground = location.protocol === 'chrome-extension:' ||
                       location.protocol === 'moz-extension:' ||
                       location.protocol === 'about:'
  if (isBackground) {
    GM_log('[BookmarkUI] background page detected, skipping', 'info')
    return
  }

  function boot() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init)
    } else {
      init()
    }
  }

  function init() {
    try {
      ns.hubCompat && ns.hubCompat.install()
    } catch (e) {
      GM_log && GM_log('[BookmarkUI] hubCompat.install failed: ' + (e.message || e), 'warn')
    }

    const _hubHidden = ns.hubCompat ? ns.hubCompat.isHiddenByHub() : false

    if (!_hubHidden) {
      try {
        ns.ui.button.createFloatingButton(() => ns.ui.panel.openPanel())
      } catch (e) {
        GM_log('[BookmarkUI] createFloatingButton error: ' + (e.message || e), 'error')
      }

      try {
        GM_registerMenuCommand('打开网址收藏面板', () => ns.ui.panel.openPanel())
        GM_registerMenuCommand('导出 Markdown', () => {
          const { bookmarks } = ns.storage.getBookmarks({})
          if (!bookmarks.length) { GM_notification({ title: '暂无书签', text: '请先导入', silent: true }); return }
          const cfg = ns.config.getConfig() || {}
          const md = ns.format.generateMarkdown(bookmarks, {
            groupBy: (cfg.export && cfg.export.groupBy) || 'folder',
            includeTimestamp: cfg.export ? cfg.export.includeTimestamp !== false : true,
          })
          GM_setClipboard(md)
          GM_notification({ title: '已复制 Markdown', text: `共 ${bookmarks.length} 条`, timeout: 4000 })
        })
        GM_registerMenuCommand('导出书签 HTML', () => {
          const { bookmarks } = ns.storage.getBookmarks({})
          if (!bookmarks.length) { GM_notification({ title: '暂无书签', text: '请先导入', silent: true }); return }
          const html = ns.format.generateNetscapeHtml(bookmarks)
          try {
            GM_download({
              url: 'data:text/html;charset=utf-8,' + encodeURIComponent(html),
              name: 'bookmarks.html',
              saveAs: true,
            })
          } catch (e) {
            GM_notification({ title: '导出失败', text: e.message || String(e), timeout: 4000 })
          }
        })
        GM_registerMenuCommand('清空所有书签', () => {
          if (confirm('确定清空所有书签？')) {
            ns.storage.clearAll()
            GM_notification({ title: '已清空', text: '所有书签已删除' })
          }
        })
        GM_registerMenuCommand('切换 Hub 接管', () => {
          try {
            const list = GM_getValue('hidden', [])
            const arr = Array.isArray(list) ? list : []
            const next = arr.includes('bookmarks') ? arr.filter(x => x !== 'bookmarks') : arr.concat(['bookmarks'])
            GM_setValue('hidden', next)
            GM_notification({ title: next.includes('bookmarks') ? '已隐藏浮动按钮' : '已恢复浮动按钮', text: '刷新页面生效', timeout: 4000 })
          } catch (e) {
            GM_notification({ title: '操作失败', text: e.message || String(e), timeout: 4000 })
          }
        })
      } catch (e) {
        GM_log('[BookmarkUI] menu command error: ' + (e.message || e), 'error')
      }

      try {
        const id = GM_addValueChangeListener('bookmarks', () => {
          try {
            if (typeof ns.ui.panel._renderBookmarks === 'function') ns.ui.panel._renderBookmarks()
            if (typeof ns.ui.panel._renderFolderSelect === 'function') ns.ui.panel._renderFolderSelect()
          } catch (e) {
            GM_log('[BookmarkUI] render error: ' + (e.message || e), 'warn')
          }
        })
        window.addEventListener('beforeunload', () => {
          try { GM_removeValueChangeListener(id) } catch (e) {}
        })
      } catch (e) {
        GM_log('[BookmarkUI] listener error: ' + (e.message || e), 'warn')
      }
    } else {
      try {
        GM_registerMenuCommand('网址收藏: 打开面板', () => ns.ui.panel.openPanel())
      } catch (e) {}
    }

    try {
      ns.hubCompat && ns.hubCompat.notifyLoaded()
    } catch (e) {
      GM_log && GM_log('[BookmarkUI] hubCompat.notifyLoaded failed: ' + (e.message || e), 'warn')
    }
  }

  try {
    boot()
  } catch (e) {
    GM_log('[BookmarkUI] boot failed: ' + (e.message || e), 'error')
  }
})(BookmarkLogger)