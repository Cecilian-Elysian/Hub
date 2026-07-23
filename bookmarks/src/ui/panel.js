;(function(ns) {

let _panel = null
let _currentFilter = { folder: '', keyword: '' }
let _escListener = null
let _outsideClickListener = null

const PANEL_STYLE = `
[data-bm-panel] {
  position: fixed;
  top: 0; right: 0;
  width: var(--panel-width);
  max-width: 100vw;
  height: 100vh;
  background: var(--panel-bg);
  -webkit-backdrop-filter: blur(var(--panel-blur));
  backdrop-filter: blur(var(--panel-blur));
  border-left: var(--panel-border);
  box-shadow: var(--shadow-panel);
  z-index: var(--z-panel);
  display: flex;
  flex-direction: column;
  transform: translateX(100%);
  transition: transform var(--transition-panel);
  font-family: var(--font-stack);
  color: var(--panel-text);
  font-size: var(--fs-md);
  line-height: 1.5;
}
[data-bm-panel].open { transform: translateX(0); }
@media (prefers-color-scheme: dark) {
  [data-bm-panel] { background: rgba(31,31,31,0.88); color: #e0e0e0; border-left-color: rgba(255,255,255,0.08); }
}
[data-bm-panel] .header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px; border-bottom: 1px solid var(--panel-divider); flex-shrink: 0;
}
[data-bm-panel] .header h2 { margin: 0; font-size: var(--fs-2xl); font-weight: 600; }
[data-bm-panel] .header .stats { font-size: var(--fs-sm); color: var(--panel-text-secondary); margin-top: 2px; }
[data-bm-panel] .header .actions { display: flex; gap: var(--sp-2); }
[data-bm-panel] .header .actions button, [data-bm-panel] .toolbar button {
  background: var(--btn-toolbar-bg);
  border: 1px solid var(--btn-toolbar-border);
  border-radius: var(--r-sm);
  padding: 4px 10px; cursor: pointer;
  font-size: var(--fs-sm); color: var(--btn-toolbar-text);
  font-family: inherit;
  transition: background var(--transition-fast);
}
[data-bm-panel] .header .actions button:hover,
[data-bm-panel] .toolbar button:hover {
  background: var(--btn-toolbar-hover);
}
[data-bm-panel] .header .close-btn {
  border: none; font-size: 22px; line-height: 1; cursor: pointer;
  background: none; color: var(--panel-text-secondary);
  padding: 0 var(--sp-2); border-radius: var(--r-sm);
  transition: background var(--transition-fast);
}
[data-bm-panel] .header .close-btn:hover { background: var(--panel-hover); }
[data-bm-panel] .toolbar {
  display: flex; gap: var(--sp-2); padding: 10px 16px; flex-shrink: 0;
  border-bottom: 1px solid var(--panel-divider); flex-wrap: wrap;
}
[data-bm-panel] .search-bar {
  padding: 10px 16px; flex-shrink: 0;
}
[data-bm-panel] .search-bar input {
  width: 100%; box-sizing: border-box; padding: 8px 12px;
  border: 1px solid var(--input-border); border-radius: var(--r-md);
  font-size: var(--fs-lg); outline: none;
  background: var(--input-bg); color: var(--input-text);
  font-family: inherit;
  transition: border-color var(--transition-fast);
}
[data-bm-panel] .search-bar input:focus { border-color: var(--brand); }
[data-bm-panel] .filter-row {
  display: flex; gap: var(--sp-2); padding: 0 16px 10px; flex-shrink: 0;
}
[data-bm-panel] .folder-select {
  flex: 1; padding: 6px 10px; border: 1px solid var(--input-border);
  border-radius: var(--r-sm);
  font-size: var(--fs-md); outline: none;
  background: var(--input-bg); color: var(--input-text);
  font-family: inherit;
}
[data-bm-panel] .bookmark-list { flex: 1; overflow-y: auto; padding: var(--sp-2) var(--sp-3); }
[data-bm-panel] .bookmark-item {
  display: flex; align-items: flex-start; gap: 10px;
  padding: 10px 12px; margin: 6px var(--sp-2); cursor: pointer;
  background: var(--card-bg); border-radius: var(--r-md);
  border: 1px solid var(--card-border);
  box-shadow: var(--card-shadow);
  transition: background var(--transition-fast), transform var(--transition-fast);
}
[data-bm-panel] .bookmark-item:hover {
  background: var(--card-bg);
  transform: translateY(-1px);
  box-shadow: 0 4px 14px rgba(0,0,0,0.12);
}
[data-bm-panel] .bookmark-item .content { flex: 1; min-width: 0; }
[data-bm-panel] .bookmark-item .title {
  font-size: var(--fs-lg); font-weight: 500; line-height: 1.4;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
[data-bm-panel] .bookmark-item .url {
  font-size: var(--fs-xs); color: var(--panel-text-secondary); margin-top: 2px;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
[data-bm-panel] .bookmark-item .meta {
  font-size: var(--fs-xs); color: var(--panel-text-secondary); margin-top: 4px;
  display: flex; gap: 6px; align-items: center; flex-wrap: wrap;
}
[data-bm-panel] .bookmark-item .meta .folder-tag {
  background: rgba(var(--brand-rgb), 0.12); color: var(--brand);
  padding: 1px 6px; border-radius: 3px; font-size: 10px;
}
[data-bm-panel] .bookmark-item .delete-btn {
  background: none; border: none; cursor: pointer; font-size: 14px;
  padding: 2px var(--sp-2); color: var(--panel-text-secondary);
  border-radius: 4px; flex-shrink: 0;
  transition: background var(--transition-fast), color var(--transition-fast);
}
[data-bm-panel] .bookmark-item .delete-btn:hover { background: rgba(234,67,53,0.1); color: var(--badge-bg); }
[data-bm-panel] .empty {
  text-align: center; padding: 40px 20px;
  color: var(--panel-text-secondary); font-size: var(--fs-lg);
}
[data-bm-panel] .empty .hint { font-size: var(--fs-sm); margin-top: var(--sp-2); opacity: 0.7; }
[data-bm-panel] .toast {
  position: fixed; top: 20px; right: 50%; transform: translateX(50%);
  background: rgba(0,0,0,0.8); color: #fff; padding: 8px 16px;
  border-radius: var(--r-sm);
  font-size: var(--fs-md); z-index: var(--z-panel);
  animation: bm-toast 0.2s ease;
}
@keyframes bm-toast { from { opacity: 0; } to { opacity: 1; } }
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
  _panel.setAttribute('data-bm-panel', '')
  _panel.innerHTML = _renderHTML()
  document.body.appendChild(_panel)

  requestAnimationFrame(() => _panel.classList.add('open'))

  _bindEvents()
  _renderFolderSelect()
  _renderBookmarks()
}

function closePanel() {
  if (!_panel) return
  _panel.classList.remove('open')
  setTimeout(() => {
    if (_panel) {
      _panel.remove()
      _panel = null
    }
    const style = document.getElementById('bm-panel-style')
    if (style) style.remove()
  }, 250)
  if (_escListener) {
    document.removeEventListener('keydown', _escListener)
    _escListener = null
  }
  if (_outsideClickListener) {
    document.removeEventListener('mousedown', _outsideClickListener, true)
    _outsideClickListener = null
  }
  ns.ui.button.setFloatingButtonVisible(true)
}

function isOpen() { return !!_panel }

function _renderHTML() {
  const stats = ns.storage.getStats()
  const total = stats.total || 0
  const folders = stats.folders || 0
  return `
    <div class="header">
      <div>
        <h2>📑 网址收藏</h2>
        <div class="stats">${total} 条 · ${folders} 个文件夹</div>
      </div>
      <div class="actions">
        <button data-act="close" class="close-btn" aria-label="关闭">×</button>
      </div>
    </div>
    <div class="toolbar">
      <button data-act="import">导入</button>
      <button data-act="export-md">导出 MD</button>
      <button data-act="export-json">导出 JSON</button>
      <button data-act="export-html">导出 HTML</button>
      <button data-act="clear">清空</button>
    </div>
    <div class="search-bar">
      <input type="text" placeholder="搜索标题、URL、文件夹..." data-input="search">
    </div>
    <div class="filter-row">
      <select class="folder-select" data-input="folder">
        <option value="">全部文件夹</option>
      </select>
    </div>
    <div class="bookmark-list" data-list></div>
  `
}

function _bindEvents() {
  if (!_panel) return

  _panel.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-act]')
    if (!btn) return
    const act = btn.dataset.act
    if (act === 'close') { closePanel(); return }
    if (act === 'import') return _handleImport()
    if (act === 'export-md') return _handleExport('markdown')
    if (act === 'export-json') return _handleExport('json')
    if (act === 'export-html') return _handleExport('html')
    if (act === 'clear') return _handleClear()
    const delBtn = e.target.closest('[data-del]')
    if (delBtn) {
      e.stopPropagation()
      _handleDelete(delBtn.dataset.del)
      return
    }
    const item = e.target.closest('[data-id]')
    if (item) {
      const id = item.dataset.id
      const bm = ns.storage.getBookmarks({}).bookmarks.find(b => b.id === id)
      if (bm && bm.url) window.open(bm.url, '_blank', 'noopener')
    }
  })

  const searchInput = _panel.querySelector('[data-input="search"]')
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      _currentFilter.keyword = e.target.value.trim()
      _renderBookmarks()
    })
  }
  const folderSelect = _panel.querySelector('[data-input="folder"]')
  if (folderSelect) {
    folderSelect.addEventListener('change', (e) => {
      _currentFilter.folder = e.target.value
      _renderBookmarks()
    })
  }

  _escListener = (e) => {
    if (e.key === 'Escape') closePanel()
  }
  document.addEventListener('keydown', _escListener)
}

function _renderFolderSelect() {
  if (!_panel) return
  const sel = _panel.querySelector('[data-input="folder"]')
  if (!sel) return
  const folders = ns.storage.getFolders()
  sel.innerHTML = '<option value="">全部文件夹</option>' +
    folders.map(f => `<option value="${escapeAttr(f)}">${escapeHtml(f)}</option>`).join('')
  if (_currentFilter.folder) sel.value = _currentFilter.folder
}

function _renderBookmarks() {
  if (!_panel) return
  const list = _panel.querySelector('[data-list]')
  if (!list) return
  const { bookmarks, total } = ns.storage.getBookmarks({
    folder: _currentFilter.folder,
    keyword: _currentFilter.keyword,
  })
  if (total === 0) {
    list.innerHTML = `<div class="empty">${_currentFilter.keyword || _currentFilter.folder ? '没有匹配的项' : '暂无书签'}
      <div class="hint">点击"导入"按钮添加书签</div></div>`
    return
  }
  list.innerHTML = bookmarks.map(b => `
    <div class="bookmark-item" data-id="${escapeAttr(b.id)}" title="${escapeAttr(b.url || '')}">
      <div class="content">
        <div class="title">${escapeHtml(b.title || b.url || '(无标题)')}</div>
        <div class="url">${escapeHtml(b.url || '')}</div>
        ${b.folder ? `<div class="meta"><span class="folder-tag">${escapeHtml(b.folder)}</span></div>` : ''}
      </div>
      <button class="delete-btn" data-del="${escapeAttr(b.id)}" title="删除">×</button>
    </div>
  `).join('')
}

function _handleImport() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.html,text/html'
  input.onchange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const result = ns.parser.parseNetscapeBookmarks(ev.target.result)
        const added = ns.storage.addBookmarks(result)
        _showToast(`导入完成：${added.length} 条`)
        _renderFolderSelect()
        _renderBookmarks()
      } catch (err) {
        _showToast('导入失败：' + err.message)
      }
    }
    reader.readAsText(file)
  }
  input.click()
}

function _handleExport(format) {
  const cfg = ns.config.getConfig() || {}
  const { bookmarks } = ns.storage.getBookmarks({})
  if (!bookmarks.length) {
    _showToast('暂无书签')
    return
  }
  if (format === 'markdown') {
    const md = ns.format.generateMarkdown(bookmarks, {
      groupBy: (cfg.export && cfg.export.groupBy) || 'folder',
      includeTimestamp: cfg.export ? cfg.export.includeTimestamp !== false : true,
    })
    GM_setClipboard(md)
    _showToast(`已复制 Markdown (${bookmarks.length} 条)`)
  } else if (format === 'json') {
    const json = ns.format.generateJSON(bookmarks)
    GM_setClipboard(json)
    _showToast(`已复制 JSON (${bookmarks.length} 条)`)
  } else if (format === 'html') {
    const html = ns.format.generateNetscapeHtml(bookmarks)
    try {
      GM_download({
        url: 'data:text/html;charset=utf-8,' + encodeURIComponent(html),
        name: 'bookmarks.html',
        saveAs: true,
      })
    } catch (e) {
      _showToast('导出失败：' + e.message)
    }
  }
}

function _handleClear() {
  if (typeof confirm === 'function' && !confirm('确定清空所有书签？')) return
  ns.storage.clearAll()
  _showToast('已清空所有书签')
  _renderFolderSelect()
  _renderBookmarks()
}

function _handleDelete(id) {
  if (typeof confirm === 'function' && !confirm('确定删除该书签？')) return
  ns.storage.removeBookmarks([id])
  _renderBookmarks()
  _renderFolderSelect()
}

function _showToast(msg) {
  const toast = document.createElement('div')
  toast.className = 'toast'
  toast.textContent = msg
  toast.style.cssText = 'position:fixed;top:20px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,0.8);color:#fff;padding:8px 16px;border-radius:6px;font-size:13px;z-index:2147483647;'
  document.body.appendChild(toast)
  setTimeout(() => toast.remove(), 3000)
}

function escapeHtml(s) {
  if (s == null) return ''
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

function escapeAttr(s) { return escapeHtml(s) }

ns.ui = ns.ui || {}
ns.ui.panel = { openPanel, closePanel, isOpen, _renderBookmarks, _renderFolderSelect }
})(BookmarkLogger)