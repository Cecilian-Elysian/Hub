;(function(ns) {

const SOURCE_LABELS = ns.constants.SOURCE_LABELS

let _panel = null
let _currentFilter = { source: '', keyword: '' }
let _progressListenerId = null
let _escListener = null
let _outsideClickListener = null
let _isRefreshing = false

const PANEL_STYLE = `
[data-na-panel] {
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
[data-na-panel].open { transform: translateX(0); }
@media (prefers-color-scheme: dark) {
  [data-na-panel] { background: rgba(31,31,31,0.88); color: #e0e0e0; border-left-color: rgba(255,255,255,0.08); }
}
[data-na-panel] .header {
  display: flex; align-items: center; justify-content: space-between;
  padding: var(--sp-4); border-bottom: 1px solid var(--panel-divider); flex-shrink: 0;
}
[data-na-panel] .header h2 { margin: 0; font-size: var(--fs-2xl); font-weight: 600; }
[data-na-panel] .header .actions { display: flex; gap: var(--sp-2); }
[data-na-panel] .header .actions button {
  background: var(--btn-toolbar-bg);
  border: 1px solid var(--btn-toolbar-border);
  border-radius: var(--r-sm);
  padding: 4px 10px; cursor: pointer;
  font-size: var(--fs-md); color: var(--btn-toolbar-text);
  font-family: inherit;
}
[data-na-panel] .header .close-btn { border: none; font-size: 22px; line-height: 1; cursor: pointer; background: none; color: var(--panel-text-secondary); padding: 0 4px; border-radius: var(--r-sm); transition: background var(--transition-fast); }
[data-na-panel] .search-bar { padding: 10px var(--sp-4); flex-shrink: 0; }
[data-na-panel] .search-bar input {
  width: 100%; box-sizing: border-box; padding: 8px 12px;
  border: 1px solid var(--input-border); border-radius: var(--r-md);
  font-size: var(--fs-lg); outline: none;
  background: var(--input-bg); color: var(--input-text);
  font-family: inherit;
  transition: border-color var(--transition-fast);
}
[data-na-panel] .search-bar input:focus { border-color: var(--brand); }
[data-na-panel] .tabs {
  display: flex; gap: 0; padding: 0 var(--sp-4); border-bottom: 1px solid var(--panel-divider);
  flex-shrink: 0; overflow-x: auto;
}
[data-na-panel] .tab {
  padding: 10px 14px; cursor: pointer; font-size: var(--fs-md); color: var(--tab-color);
  border-bottom: 2px solid transparent; white-space: nowrap; transition: all var(--transition-fast);
}
[data-na-panel] .tab.active { color: var(--tab-active-color); border-bottom-color: var(--tab-active-color); font-weight: 500; }
[data-na-panel] .tab .count { font-size: var(--fs-xs); opacity: 0.6; margin-left: 4px; }
[data-na-panel] .article-list { flex: 1; overflow-y: auto; padding: 4px var(--sp-3); }
[data-na-panel] .article-item {
  display: flex; align-items: flex-start; gap: 10px;
  padding: 12px 14px; margin: var(--sp-2); cursor: pointer;
  background: var(--card-bg);
  border-radius: var(--r-md);
  box-shadow: var(--card-shadow);
  border: 1px solid var(--card-border);
  transition: all var(--transition-medium);
}
[data-na-panel] .article-item:hover { box-shadow: 0 4px 14px rgba(0,0,0,0.14); transform: translateY(-1px); }
[data-na-panel] .article-item:active { background: var(--panel-hover); }
[data-na-panel] .article-item.read { background: var(--panel-hover); opacity: 0.7; }
[data-na-panel] .article-item .dot {
  width: 8px; height: 8px; border-radius: 50%; background: var(--brand);
  flex-shrink: 0; margin-top: 6px;
}
[data-na-panel] .article-item .dot.read { background: transparent; }
[data-na-panel] .article-item .content { flex: 1; min-width: 0; }
[data-na-panel] .article-item .title { font-size: var(--fs-lg); font-weight: 500; line-height: 1.4; margin-bottom: 4px; }
[data-na-panel] .article-item .title.read { color: var(--panel-text-secondary); font-weight: 400; }
[data-na-panel] .article-item .meta { font-size: var(--fs-sm); color: var(--panel-text-secondary); display: flex; gap: var(--sp-2); align-items: center; }
[data-na-panel] .article-item .meta .source { background: rgba(var(--brand-rgb), 0.12); color: var(--brand); padding: 0 6px; border-radius: 3px; font-size: var(--fs-xs); }
[data-na-panel] .article-item .star-btn {
  background: none; border: none; cursor: pointer; font-size: 16px; padding: 2px; flex-shrink: 0;
  opacity: 0.3; transition: opacity var(--transition-fast);
}
[data-na-panel] .article-item .star-btn.active { opacity: 1; }
[data-na-panel] .empty { text-align: center; padding: 40px 20px; color: var(--panel-text-secondary); font-size: var(--fs-lg); }
[data-na-panel] .progress-area {
  display: none; padding: var(--sp-2) var(--sp-4) 4px; flex-shrink: 0;
}
[data-na-panel] .progress-area.show { display: block; }
[data-na-panel] .refresh-btn[disabled] {
  opacity: 0.55; cursor: not-allowed; background: var(--panel-divider);
}
@media (prefers-color-scheme: dark) {
  [data-na-panel] .refresh-btn[disabled] { background: #2a2a2a; color: #888; }
}
[data-na-panel] .header .close-btn {
  padding: 6px 10px; margin: -6px -6px -6px 0; border-radius: var(--r-sm);
}
[data-na-panel] .header .close-btn:hover { background: var(--panel-hover); }
@media (prefers-color-scheme: dark) {
  [data-na-panel] .header .close-btn:hover { background: rgba(255,255,255,0.08); }
}
[data-na-panel] .diag-area {
  display: none; padding: var(--sp-2) var(--sp-4); flex-shrink: 0;
  border-top: 1px solid var(--panel-divider); max-height: 200px; overflow-y: auto;
  font-size: var(--fs-sm); background: rgba(255,255,255,0.6);
}
[data-na-panel] .diag-area.show { display: block; }
[data-na-panel] .diag-area .diag-row {
  display: flex; gap: var(--sp-2); align-items: flex-start; padding: 4px 0;
  border-bottom: 1px dashed var(--panel-divider);
}
[data-na-panel] .diag-area .diag-row:last-child { border-bottom: none; }
[data-na-panel] .diag-area .diag-name { font-weight: 500; min-width: 70px; }
[data-na-panel] .diag-area .diag-name.failed { color: var(--badge-bg); }
[data-na-panel] .diag-area .diag-msg {
  flex: 1; word-break: break-all; color: var(--panel-text-secondary); font-family: ui-monospace, Menlo, Consolas, monospace; font-size: var(--fs-xs);
}
[data-na-panel] .diag-area .diag-copy {
  border: 1px solid var(--btn-toolbar-border); background: none; cursor: pointer;
  font-size: var(--fs-xs); padding: 1px 6px; border-radius: 3px; color: inherit;
}
[data-na-panel] .diag-area .diag-copy:hover { background: var(--btn-toolbar-hover); }
[data-na-panel] .progress-bar-track {
  width: 100%; height: 6px; background: var(--panel-divider); border-radius: 3px; overflow: hidden;
}
[data-na-panel] .progress-bar-fill {
  height: 100%; background: var(--brand); border-radius: 3px;
  transition: width 0.3s ease; width: 0%;
}
[data-na-panel] .progress-sources {
  display: flex; gap: var(--sp-2); flex-wrap: wrap; margin-top: 6px; font-size: var(--fs-sm);
}
[data-na-panel] .progress-source {
  display: inline-flex; align-items: center; gap: 3px; padding: 2px 6px;
  border-radius: 4px; font-size: var(--fs-xs); color: var(--panel-text-secondary);
}
[data-na-panel] .progress-source.pending { color: var(--panel-text-secondary); }
[data-na-panel] .progress-source.fetching { color: var(--brand); font-weight: 500; }
[data-na-panel] .progress-source.success { color: #10b981; }
[data-na-panel] .progress-source.failed { color: var(--badge-bg); }
[data-na-panel] .progress-source .spinner {
  display: inline-block; width: 12px; height: 12px;
  border: 2px solid var(--brand); border-top-color: transparent;
  border-radius: 50%; animation: na-spin 0.6s linear infinite;
}
@keyframes na-spin { to { transform: rotate(360deg); } }
`
function openPanel() {
  if (_panel) return

  const style = document.createElement('style')
  style.id = 'na-panel-style'
  style.textContent = PANEL_STYLE
  document.head.appendChild(style)

  ns.ui.button.setFloatingButtonVisible(false)

  _panel = document.createElement('div')
  _panel.id = 'na-panel'
  _panel.setAttribute('data-na-panel', '')
  _panel.innerHTML = _renderPanelHTML()
  document.body.appendChild(_panel)

  requestAnimationFrame(() => _panel.classList.add('open'))

  _bindEvents()
  _renderArticles()
}

function closePanel() {
  if (!_panel) return
  _panel.classList.remove('open')
  setTimeout(() => {
    if (_panel) {
      _panel.remove()
      _panel = null
    }
    const style = document.getElementById('na-panel-style')
    if (style) style.remove()
  }, 250)
  _isRefreshing = false
  if (_progressListenerId != null) {
    try { GM_removeValueChangeListener(_progressListenerId) } catch (e) {}
    _progressListenerId = null
  }
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

function _renderPanelHTML() {
  return `
    <div class="header">
      <h2>新闻聚合</h2>
      <div class="actions">
        <button class="refresh-btn" title="刷新">&#x21bb; 刷新</button>
        <button class="digest-btn" title="周报">&#x1F4CB; 周报</button>
        <button class="diag-btn" title="诊断最近一轮抓取">&#x2139;</button>
        <button class="settings-btn" title="设置">&#x2699;</button>
      </div>
      <button class="close-btn" aria-label="关闭">&times;</button>
    </div>
    <div class="progress-area" id="na-progress-area">
      <div class="progress-bar-track"><div class="progress-bar-fill" id="na-progress-fill"></div></div>
      <div class="progress-sources" id="na-progress-sources"></div>
    </div>
    <div class="diag-area" id="na-diag-area"></div>
    <div class="search-bar">
      <input type="text" placeholder="搜索新闻..." id="na-search-input">
    </div>
    <div class="tabs" id="na-tabs">
      <div class="tab active" data-source="">全部</div>
      <div class="tab" data-source="bilibili">B站</div>
      <div class="tab" data-source="baidu">百度</div>
      <div class="tab" data-source="hackernews">HackerNews</div>
      <div class="tab" data-source="github">GitHub</div>
      <div class="tab" data-source="v2ex">V2EX</div>
      <div class="tab" data-source="toutiao">头条</div>
      <div class="tab" data-source="zhihu">知乎</div>
      <div class="tab" data-source="weibo">微博</div>
      <div class="tab" data-source="wechat">公众号</div>
      <div class="tab" data-source="douyin">抖音</div>
      <div class="tab" data-source="xiaohongshu">小红书</div>
      <div class="tab" data-source="kr36">36氪</div>
      <div class="tab" data-source="thepaper">澎湃</div>
      <div class="tab" data-source="tencent">腾讯</div>
      <div class="tab" data-source="netease">网易</div>
      <div class="tab" data-source="rss">订阅</div>
      <div class="tab" data-source="starred">&#x2605; 收藏</div>
    </div>
    <div class="article-list" id="na-article-list">
      <div class="empty">加载中...</div>
    </div>
  `
}

function _bindEvents() {
  _panel.querySelector('.close-btn').addEventListener('click', closePanel)
  _panel.querySelector('.refresh-btn').addEventListener('click', _onRefreshClick)
  _panel.querySelector('.digest-btn').addEventListener('click', openDigestView)
  _panel.querySelector('.settings-btn').addEventListener('click', openSettings)
  _panel.querySelector('.diag-btn').addEventListener('click', _toggleDiag)

  try {
    _progressListenerId = GM_addValueChangeListener('refresh_progress', (_, val) => {
      if (!_panel) return
      _updateProgress(val)
      _renderArticles()
    })
  } catch (e) {}

  _escListener = (e) => {
    if (e.key === 'Escape' && _panel) closePanel()
  }
  document.addEventListener('keydown', _escListener)

  _outsideClickListener = (e) => {
    if (!_panel) return
    if (_panel.contains(e.target)) return
    const btn = document.getElementById('na-floating-btn')
    if (btn && btn.contains(e.target)) return
    closePanel()
  }
  setTimeout(() => {
    if (_outsideClickListener) document.addEventListener('mousedown', _outsideClickListener, true)
  }, 0)

  const searchInput = _panel.querySelector('#na-search-input')
  let searchTimer = null
  searchInput.addEventListener('input', () => {
    clearTimeout(searchTimer)
    searchTimer = setTimeout(() => {
      _currentFilter.keyword = searchInput.value.trim()
      _renderArticles()
    }, 300)
  })

  _panel.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      _panel.querySelectorAll('.tab').forEach(t => t.classList.remove('active'))
      tab.classList.add('active')
      _currentFilter.source = tab.dataset.source === 'starred' ? '' : tab.dataset.source
      _currentFilter.starredOnly = tab.dataset.source === 'starred'
      _renderArticles()
    })
  })

  _renderDiagFromLog()
}

function _onRefreshClick() {
  if (_isRefreshing) return
  _isRefreshing = true
  const btn = _panel.querySelector('.refresh-btn')
  btn.disabled = true
  btn.textContent = '刷新中...'
  _panel.querySelector('#na-progress-area').classList.add('show')
  const listEl = _panel.querySelector('#na-article-list')
  if (listEl && (!listEl.children.length || listEl.querySelector('.empty'))) {
    listEl.innerHTML = '<div class="empty">⌛ 正在启动刷新,首个源返回后会立刻出现在下方…</div>'
  }
  try {
    GM_setValue('request_refresh', Date.now())
  } catch (e) {
    _isRefreshing = false
    btn.disabled = false
    btn.innerHTML = '&#x21bb; 刷新'
    GM_notification({ title: '刷新失败', text: e.message || String(e), timeout: 4000 })
  }
}

function _finishRefreshUI() {
  _isRefreshing = false
  if (!_panel) return
  const btn = _panel.querySelector('.refresh-btn')
  if (btn) {
    btn.disabled = false
    btn.innerHTML = '&#x21bb; 刷新'
  }
  try { ns.ui.button.updateBadge() } catch (e) {}
  _renderDiagFromLog()
}

function _toggleDiag() {
  if (!_panel) return
  const area = _panel.querySelector('#na-diag-area')
  if (!area) return
  area.classList.toggle('show')
  if (area.classList.contains('show')) _renderDiagFromLog()
}

function _renderDiagFromLog() {
  if (!_panel) return
  const area = _panel.querySelector('#na-diag-area')
  if (!area) return
  let log = null
  try { log = GM_getValue('fetch_log', null) } catch (e) {}
  if (!log || !log.lastResult) {
    area.innerHTML = '<div class="diag-row"><span class="diag-msg">暂无最近抓取记录</span></div>'
    return
  }
  const r = log.lastResult
  const failed = r.failures || []
  const rows = []
  rows.push(`<div class="diag-row"><span class="diag-msg">上次刷新: ${ns.format.formatTime(log.lastFetch)} · 新增 ${r.new || 0} 条 · 失败 ${failed.length} 个</span></div>`)
  for (const f of failed) {
    const label = SOURCE_LABELS[f.name] || f.name
    const msg = f.status ? `HTTP ${f.status}` : (f.error || 'unknown')
    const snippet = (f.snippet || '').replace(/[<>]/g, '').slice(0, 200)
    const copyData = `${label}: ${msg}\n${snippet}`
    rows.push(`
      <div class="diag-row">
        <span class="diag-name failed">${ns.format.escapeHtml(label)}</span>
        <span class="diag-msg">${ns.format.escapeHtml(msg)}${snippet ? ' · ' + ns.format.escapeHtml(snippet) : ''}</span>
        <button class="diag-copy" data-copy="${ns.format.escapeHtml(copyData)}">复制</button>
      </div>
    `)
  }
  area.innerHTML = rows.join('')
  area.querySelectorAll('.diag-copy').forEach(btn => {
    btn.addEventListener('click', () => {
      try { GM_setClipboard(btn.dataset.copy || '') } catch (e) {}
    })
  })
}

function _updateProgress(progress) {
  if (!_panel) return
  const area = _panel.querySelector('#na-progress-area')
  const fill = _panel.querySelector('#na-progress-fill')
  const sourcesEl = _panel.querySelector('#na-progress-sources')
  if (!area || !fill || !sourcesEl) return

  if (!progress || !progress.running) {
    area.classList.remove('show')
    if (_isRefreshing) _finishRefreshUI()
    return
  }

  const { total, sourceStates } = progress
  const completed = Object.values(sourceStates).filter(s => s === 'success' || s === 'failed').length
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0
  fill.style.width = pct + '%'

  const labels = SOURCE_LABELS
  sourcesEl.innerHTML = Object.entries(sourceStates).map(([name, state]) => {
    const label = labels[name] || name
    if (state === 'fetching') {
      return `<span class="progress-source fetching"><span class="spinner"></span>${label}</span>`
    }
    if (state === 'success') {
      return `<span class="progress-source success">&#x2713; ${label}</span>`
    }
    if (state === 'failed') {
      return `<span class="progress-source failed">&#x2717; ${label}</span>`
    }
    return `<span class="progress-source pending">${label}</span>`
  }).join('')
}
function _renderArticles() {
  if (!_panel) return
  const listEl = _panel.querySelector('#na-article-list')
  if (!listEl) return
  const result = ns.storage.getArticles({
    source: _currentFilter.source,
    keyword: _currentFilter.keyword,
    starred: _currentFilter.starredOnly || undefined,
    limit: 200,
  })

  if (result.articles.length === 0) {
    if (_isRefreshing) {
      listEl.innerHTML = '<div class="empty">⌛ 正在抓取…首个源返回后即出现在此处</div>'
    } else {
      listEl.innerHTML = '<div class="empty">暂无新闻，点击刷新获取</div>'
    }
    return
  }

  listEl.innerHTML = result.articles.map(article => `
    <div class="article-item${article.read ? ' read' : ''}" data-id="${ns.format.escapeHtml(article.id)}">
      <div class="dot ${article.read ? 'read' : ''}"></div>
      <div class="content">
        <div class="title ${article.read ? 'read' : ''}">${ns.format.escapeHtml(article.title)}</div>
        <div class="meta">
          <span class="source">${ns.format.escapeHtml(article.source)}</span>
          <span>${ns.format.formatTime(article.publishTime || article.fetchTime)}</span>
          ${article.hot ? `<span>🔥 ${article.hot}</span>` : ''}
        </div>
      </div>
      <button class="star-btn ${article.starred ? 'active' : ''}">${article.starred ? '&#x2605;' : '&#x2606;'}</button>
    </div>
  `).join('')

  listEl.querySelectorAll('.article-item').forEach(el => {
    const id = el.dataset.id
    el.addEventListener('click', (e) => {
      if (e.target.closest('.star-btn')) return
      const article = ns.storage.getArticleById(id)
      if (article) {
        ns.storage.markRead(id)
        ns.ui.button.updateBadge()
        el.classList.add('read')
        el.querySelector('.dot').classList.add('read')
        el.querySelector('.title').classList.add('read')
        if (article.url) GM_openInTab(article.url)
      }
    })
    el.querySelector('.star-btn').addEventListener('click', (e) => {
      e.stopPropagation()
      const article = ns.storage.getArticleById(id)
      if (article) {
        ns.storage.markStarred(id, !article.starred)
        _renderArticles()
      }
    })
  })
}

function openDigestView() {
  const digest = ns.storage.getDigest()
  if (!digest) {
    GM_notification({ title: '暂无周报', text: '运行满一周后自动生成' })
    return
  }
  GM_notification({ title: '最新周报', text: `${digest.dateRange}\n共 ${digest.count} 条新闻`, timeout: 5000 })
  GM_setClipboard(digest.markdown)
}

function openSettings() {
  GM_notification({ title: '设置', text: '请通过脚本猫管理面板设置' })
}

ns.ui = ns.ui || {}
ns.ui.panel = { openPanel, closePanel, _renderArticles }
})(NewsAggregator)
