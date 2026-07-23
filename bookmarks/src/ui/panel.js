;(function(ns) {

let _panel = null
let _currentFilter = { folder: '', keyword: '' }
let _escListener = null
let _outsideClickListener = null

const PANEL_STYLE = `
#bm-panel {
  position: fixed;
  top: 0; right: 0;
  width: 460px;
  max-width: 100vw;
  height: 100vh;
  background: rgba(255,255,255,0.7);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-left: 1px solid rgba(0,0,0,0.08);
  box-shadow: -4px 0 24px rgba(0,0,0,0.2);
  z-index: 2147483647;
  display: flex;
  flex-direction: column;
  animation: bm-slide-in 0.2s ease;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Microsoft YaHei", sans-serif;
  color: #1f1f1f;
}
@media (prefers-color-scheme: dark) {
  #bm-panel { background: rgba(31,31,31,0.7); color: #e0e0e0; border-left-color: rgba(255,255,255,0.08); }
  #bm-panel .search-bar input { background: #2a2a2a; color: #e0e0e0; border-color: #444; }
  #bm-panel .toolbar button { border-color: #444; color: #e0e0e0; }
  #bm-panel .bookmark-item { background: rgba(42,42,42,0.85); border-color: rgba(255,255,255,0.08); }
  #bm-panel .bookmark-item:hover { background: rgba(60,60,60,0.95); }
  #bm-panel .folder-select { background: #2a2a2a; color: #e0e0e0; border-color: #444; }
}
#bm-panel .header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 18px; border-bottom: 1px solid rgba(0,0,0,0.08); flex-shrink: 0;
}
#bm-panel .header h2 { margin: 0; font-size: 17px; font-weight: 600; }
#bm-panel .header .stats { font-size: 12px; color: #888; margin-top: 2px; }
#bm-panel .header .actions { display: flex; gap: 6px; }
#bm-panel .header .actions button, #bm-panel .toolbar button {
  background: none; border: 1px solid #ddd; border-radius: 6px;
  padding: 4px 10px; cursor: pointer; font-size: 12px; color: inherit;
}
#bm-panel .header .actions button:hover, #bm-panel .toolbar button:hover {
  background: rgba(0,0,0,0.05);
}
#bm-panel .header .close-btn {
  border: none; font-size: 22px; line-height: 1; cursor: pointer; background: none; color: #666;
  padding: 0 6px; border-radius: 6px;
}
#bm-panel .header .close-btn:hover { background: rgba(0,0,0,0.06); }
#bm-panel .toolbar {
  display: flex; gap: 8px; padding: 10px 18px; flex-shrink: 0;
  border-bottom: 1px solid rgba(0,0,0,0.06); flex-wrap: wrap;
}
#bm-panel .search-bar {
  padding: 10px 18px; flex-shrink: 0;
}
#bm-panel .search-bar input {
  width: 100%; box-sizing: border-box; padding: 8px 12px;
  border: 1px solid #ddd; border-radius: 8px; font-size: 14px; outline: none;
  background: #fff; color: inherit;
}
#bm-panel .search-bar input:focus { border-color: #1a73e8; }
#bm-panel .filter-row {
  display: flex; gap: 8px; padding: 0 18px 10px; flex-shrink: 0;
}
#bm-panel .folder-select {
  flex: 1; padding: 6px 10px; border: 1px solid #ddd; border-radius: 6px;
  font-size: 13px; outline: none; background: #fff; color: inherit;
}
#bm-panel .bookmark-list { flex: 1; overflow-y: auto; padding: 6px 12px; }
#bm-panel .bookmark-item {
  display: flex; align-items: flex-start; gap: 10px;
  padding: 10px 12px; margin: 6px 8px; cursor: pointer;
  background: rgba(255,255,255,0.85); border-radius: 8px;
  border: 1px solid rgba(0,0,0,0.05); transition: background 0.15s;
}
#bm-panel .bookmark-item:hover { background: #fff; }
#bm-panel .bookmark-item .content { flex: 1; min-width: 0; }
#bm-panel .bookmark-item .title {
  font-size: 14px; font-weight: 500; line-height: 1.4;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
#bm-panel .bookmark-item .url {
  font-size: 11px; color: #888; margin-top: 2px;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
#bm-panel .bookmark-item .meta {
  font-size: 11px; color: #888; margin-top: 4px;
  display: flex; gap: 6px; align-items: center; flex-wrap: wrap;
}
#bm-panel .bookmark-item .meta .folder-tag {
  background: #e8f0fe; color: #1a73e8; padding: 1px 6px; border-radius: 3px; font-size: 10px;
}
@media (prefers-color-scheme: dark) {
  #bm-panel .bookmark-item .meta .folder-tag { background: #1a3a6a; color: #8ab4f8; }
}
#bm-panel .bookmark-item .delete-btn {
  background: none; border: none; cursor: pointer; font-size: 14px; padding: 2px 6px;
  color: #999; border-radius: 4px; flex-shrink: 0;
}
#bm-panel .bookmark-item .delete-btn:hover { background: rgba(234,67,53,0.1); color: #ea4335; }
#bm-panel .empty {
  text-align: center; padding: 40px 20px; color: #999; font-size: 14px;
}
#bm-panel .empty .hint { font-size: 12px; margin-top: 8px; opacity: 0.7; }
#bm-panel .toast {
  position: fixed; top: 20px; right: 50%; transform: translateX(50%);
  background: rgba(0,0,0,0.8); color: #fff; padding: 8px 16px; border-radius: 6px;
  font-size: 13px; z-index: 2147483647; animation: bm-toast 0.2s ease;
}
@keyframes bm-toast { from { opacity: 0; } to { opacity: 1; } }
@keyframes bm-slide-in { from { transform: translateX(100%); } to { transform: translateX(0); } }
`

function openPanel() {
  if (_panel) return

  const style = document.createElement('style')
  style.id = 'bm-panel-style'
  style.textContent = PANEL_STYLE
  document.head.appendChild(style)

  ns.ui.button.setFloatingButtonVisible(false)

  _panel = document.createElement('div')
  _panel.id = 'bm-panel'
  _panel.innerHTML = _renderHTML()
  document.body.appendChild(_panel)

  _bindEvents()
  _renderFolderSelect()
  _renderBookmarks()
}

function closePanel() {
  if (!_panel) return
  _panel.remove()
  _panel = null
  if (_escListener) {
    document.removeEventListener('keydown', _escListener)
    _escListener = null
  }
  if (_outsideClickListener) {
    document.removeEventListener('mousedown', _outsideClickListener, true)
    _outsideClickListener = null
  }
  ns.ui.button.setFloatingButtonVisible(true)
  const style = document.getElementById('bm-panel-style')
  if (style) style.remove()
}

function _renderHTML() {
  return `
    <div class="header">
      <div>
        <h2>网址收藏</h2>
        <div class="stats" id="bm-stats"></div>
      </div>
      <div class="actions">
        <button class="import-btn" title="导入浏览器书签 HTML">导入</button>
        <button class="export-btn" title="导出">导出</button>
        <button class="clear-btn" title="清空">清空</button>
      </div>
      <button class="close-btn" aria-label="关闭">&times;</button>
    </div>
    <input type="file" id="bm-file-input" accept=".html,.htm" style="display:none">
    <div class="toolbar">
      <button class="export-md">导出 Markdown</button>
      <button class="export-json">导出 JSON</button>
      <button class="export-html">导出书签 HTML</button>
      <button class="copy-md">复制 Markdown</button>
    </div>
    <div class="search-bar">
      <input type="text" placeholder="搜索标题、URL、文件夹..." id="bm-search-input">
    </div>
    <div class="filter-row">
      <select class="folder-select" id="bm-folder-select">
        <option value="">全部文件夹</option>
      </select>
    </div>
    <div class="bookmark-list" id="bm-bookmark-list">
      <div class="empty">加载中...</div>
    </div>
  `
}

function _bindEvents() {
  _panel.querySelector('.close-btn').addEventListener('click', closePanel)
  _panel.querySelector('.import-btn').addEventListener('click', _onImportClick)
  _panel.querySelector('.export-md').addEventListener('click', () => _onExportClick('markdown'))
  _panel.querySelector('.export-json').addEventListener('click', () => _onExportClick('json'))
  _panel.querySelector('.export-html').addEventListener('click', () => _onExportClick('html'))
  _panel.querySelector('.copy-md').addEventListener('click', _onCopyMarkdown)
  _panel.querySelector('.clear-btn').addEventListener('click', _onClearClick)

  const fileInput = _panel.querySelector('#bm-file-input')
  fileInput.addEventListener('change', _onFileSelected)

  _escListener = (e) => {
    if (e.key === 'Escape' && _panel) closePanel()
  }
  document.addEventListener('keydown', _escListener)

  _outsideClickListener = (e) => {
    if (!_panel) return
    if (_panel.contains(e.target)) return
    const btn = document.getElementById('bm-floating-btn')
    if (btn && btn.contains(e.target)) return
    closePanel()
  }
  setTimeout(() => {
    if (_outsideClickListener) document.addEventListener('mousedown', _outsideClickListener, true)
  }, 0)

  const searchInput = _panel.querySelector('#bm-search-input')
  let timer = null
  searchInput.addEventListener('input', () => {
    clearTimeout(timer)
    timer = setTimeout(() => {
      _currentFilter.keyword = searchInput.value.trim()
      _renderBookmarks()
    }, 250)
  })

  const folderSelect = _panel.querySelector('#bm-folder-select')
  folderSelect.addEventListener('change', () => {
    _currentFilter.folder = folderSelect.value
    _renderBookmarks()
  })
}

function _renderFolderSelect() {
  if (!_panel) return
  const select = _panel.querySelector('#bm-folder-select')
  if (!select) return
  const folders = ns.storage.getFolders()
  select.innerHTML = '<option value="">全部文件夹</option>' +
    folders.map(f => `<option value="${ns.format.escapeHtml(f)}">${ns.format.escapeHtml(f || '未分类')}</option>`).join('')
  select.value = _currentFilter.folder || ''
}

function _renderStats() {
  if (!_panel) return
  const el = _panel.querySelector('#bm-stats')
  if (!el) return
  const stats = ns.storage.getStats()
  el.textContent = `共 ${stats.total} 条 · ${stats.folders} 个文件夹`
}

function _renderBookmarks() {
  if (!_panel) return
  const listEl = _panel.querySelector('#bm-bookmark-list')
  if (!listEl) return
  _renderStats()

  const result = ns.storage.getBookmarks({
    folder: _currentFilter.folder || undefined,
    keyword: _currentFilter.keyword || undefined,
    limit: (ns.config.getConfig('ui.maxDisplay') || 100),
  })

  if (result.bookmarks.length === 0) {
    listEl.innerHTML = `
      <div class="empty">
        暂无书签
        <div class="hint">点击右上角"导入"，选择浏览器导出的 bookmarks.html</div>
      </div>
    `
    return
  }

  listEl.innerHTML = result.bookmarks.map(b => `
    <div class="bookmark-item" data-id="${ns.format.escapeHtml(b.id)}" data-url="${ns.format.escapeHtml(b.url)}">
      <div class="content">
        <div class="title" title="${ns.format.escapeHtml(b.url)}">${ns.format.escapeHtml(b.title || b.url)}</div>
        <div class="url">${ns.format.escapeHtml(b.url)}</div>
        <div class="meta">
          ${b.folderPath || b.folder ? `<span class="folder-tag">${ns.format.escapeHtml(b.folderPath || b.folder)}</span>` : ''}
          ${b.addDate ? `<span>${ns.format.formatTime(b.addDate)}</span>` : ''}
          ${b.tags && b.tags.length ? b.tags.map(t => `<span class="folder-tag">#${ns.format.escapeHtml(t)}</span>`).join('') : ''}
        </div>
      </div>
      <button class="delete-btn" title="删除" data-id="${ns.format.escapeHtml(b.id)}">&times;</button>
    </div>
  `).join('')

  listEl.querySelectorAll('.bookmark-item').forEach(el => {
    el.addEventListener('click', (e) => {
      if (e.target.closest('.delete-btn')) return
      const url = el.dataset.url
      if (url) {
        try { GM_openInTab(url) } catch (err) {
          try { window.open(url, '_blank') } catch (e2) {}
        }
      }
    })
    const delBtn = el.querySelector('.delete-btn')
    delBtn.addEventListener('click', (e) => {
      e.stopPropagation()
      const id = delBtn.dataset.id
      ns.storage.removeBookmarks([id])
      _renderBookmarks()
      _renderFolderSelect()
      _toast('已删除')
    })
  })
}

function _toast(msg) {
  if (!_panel) return
  const t = document.createElement('div')
  t.className = 'toast'
  t.textContent = msg
  _panel.appendChild(t)
  setTimeout(() => t.remove(), 1500)
}

function _onImportClick() {
  const input = _panel.querySelector('#bm-file-input')
  if (input) input.click()
}

function _onFileSelected(e) {
  const file = e.target.files && e.target.files[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => {
    try {
      const html = String(reader.result || '')
      const items = ns.parser.parseBookmarksHtml(html)
      if (!items.length) {
        _toast('未解析到书签')
        return
      }
      const r = ns.storage.addBookmarks(items)
      _renderBookmarks()
      _renderFolderSelect()
      _toast(`新增 ${r.added}，更新 ${r.updated}`)
      try {
        GM_notification({
          title: '导入完成',
          text: `新增 ${r.added}，更新 ${r.updated}，跳过 ${r.skipped}`,
          timeout: 4000,
        })
      } catch (e) {}
    } catch (err) {
      _toast('解析失败: ' + (err.message || err))
    } finally {
      e.target.value = ''
    }
  }
  reader.onerror = () => _toast('读取文件失败')
  reader.readAsText(file, 'utf-8')
}

function _onExportClick(format) {
  const { bookmarks } = ns.storage.getBookmarks({})
  if (!bookmarks.length) {
    _toast('暂无书签')
    return
  }
  const cfg = ns.config.getConfig() || {}
  const groupBy = (cfg.export && cfg.export.groupBy) || 'folder'
  const includeTs = cfg.export ? cfg.export.includeTimestamp !== false : true
  let content, filename, mime
  if (format === 'markdown') {
    content = ns.format.generateMarkdown(bookmarks, { groupBy, includeTimestamp: includeTs })
    filename = `bookmarks-${_dateStr()}.md`
    mime = 'text/markdown'
  } else if (format === 'json') {
    content = ns.format.generateJSON(bookmarks)
    filename = `bookmarks-${_dateStr()}.json`
    mime = 'application/json'
  } else {
    content = ns.format.generateNetscapeHtml(bookmarks)
    filename = `bookmarks-${_dateStr()}.html`
    mime = 'text/html'
  }
  try {
    GM_download({ url: 'data:' + mime + ';charset=utf-8,' + encodeURIComponent(content), name: filename, saveAs: true })
    ns.storage.logExport({ format, count: bookmarks.length, filename })
    _toast('已导出 ' + filename)
  } catch (e) {
    _toast('导出失败: ' + (e.message || e))
  }
}

function _onCopyMarkdown() {
  const { bookmarks } = ns.storage.getBookmarks({})
  if (!bookmarks.length) {
    _toast('暂无书签')
    return
  }
  const cfg = ns.config.getConfig() || {}
  const md = ns.format.generateMarkdown(bookmarks, {
    groupBy: (cfg.export && cfg.export.groupBy) || 'folder',
    includeTimestamp: cfg.export ? cfg.export.includeTimestamp !== false : true,
  })
  try {
    GM_setClipboard(md)
    _toast('Markdown 已复制')
  } catch (e) {
    _toast('复制失败: ' + (e.message || e))
  }
}

function _onClearClick() {
  if (!confirm('确定清空所有书签？此操作不可恢复')) return
  ns.storage.clearAll()
  _currentFilter = { folder: '', keyword: '' }
  const sel = _panel.querySelector('#bm-folder-select')
  if (sel) sel.value = ''
  const input = _panel.querySelector('#bm-search-input')
  if (input) input.value = ''
  _renderBookmarks()
  _renderFolderSelect()
  _toast('已清空')
}

function _dateStr() {
  const d = new Date()
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}-${String(d.getHours()).padStart(2, '0')}${String(d.getMinutes()).padStart(2, '0')}`
}

function _renderArticles() { _renderBookmarks() }

ns.ui = ns.ui || {}
ns.ui.panel = { openPanel, closePanel, _renderBookmarks, _renderArticles }
})(BookmarkLogger)