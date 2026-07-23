;(function(ns) {

const SOURCE_LABELS = ns.constants.SOURCE_LABELS

let _panel = null
let _currentFilter = { source: '', keyword: '' }
let _progressListenerId = null
let _escListener = null
let _outsideClickListener = null
let _isRefreshing = false

const PANEL_STYLE = `
#na-panel {
  position: fixed;
  top: 0; right: 0;
  width: 420px;
  max-width: 100vw;
  height: 100vh;
  background: rgba(255,255,255,var(--na-bg-opacity,0.55));
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255,255,255,0.25);
  border-radius: 12px 0 0 12px;
  box-shadow: -4px 0 24px rgba(0,0,0,0.2);
  z-index: 2147483647;
  display: flex;
  flex-direction: column;
  animation: na-slide-in 0.2s ease;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  color: #1f1f1f;
}
@media (prefers-color-scheme: dark) {
  #na-panel { background: rgba(31,31,31,var(--na-bg-opacity,0.55)); color: #e0e0e0; backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border: 1px solid rgba(255,255,255,0.08); }
  #na-panel .search-bar input { background: #333; color: #e0e0e0; border-color: #555; }
  #na-panel .tab { color: #aaa; }
  #na-panel .tab.active { color: #8ab4f8; border-bottom-color: #8ab4f8; }
  #na-panel .article-item { background: rgba(42,42,42,var(--na-card-opacity,0.88)); border-color: rgba(255,255,255,0.08); }
  #na-panel .article-item:hover { box-shadow: 0 4px 14px rgba(0,0,0,0.3); transform: translateY(-1px); }
  #na-panel .article-item:active { background: #333; }
  #na-panel .article-item.read { background: #252525; }
  #na-panel .article-item .title.read { color: #666; font-weight: 400; }
  #na-panel .article-item .dot.read { background: transparent; }
  #na-panel .article-item .time { color: #888; }
}
#na-panel .header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px 20px; border-bottom: 1px solid #e0e0e0; flex-shrink: 0;
}
#na-panel .header h2 { margin: 0; font-size: 18px; font-weight: 600; }
#na-panel .header .actions { display: flex; gap: 8px; }
#na-panel .header .actions button {
  background: none; border: 1px solid #ddd; border-radius: 6px;
  padding: 4px 10px; cursor: pointer; font-size: 13px; color: inherit;
}
#na-panel .header .close-btn { border: none; font-size: 22px; line-height: 1; cursor: pointer; background: none; color: #666; padding: 0 4px; }
#na-panel .search-bar { padding: 10px 20px; flex-shrink: 0; }
#na-panel .search-bar input {
  width: 100%; box-sizing: border-box; padding: 8px 12px;
  border: 1px solid #ddd; border-radius: 8px; font-size: 14px; outline: none;
}
#na-panel .search-bar input:focus { border-color: #1a73e8; }
#na-panel .tabs {
  display: flex; gap: 0; padding: 0 20px; border-bottom: 1px solid #e0e0e0;
  flex-shrink: 0; overflow-x: auto;
}
#na-panel .tab {
  padding: 10px 14px; cursor: pointer; font-size: 13px; color: #666;
  border-bottom: 2px solid transparent; white-space: nowrap; transition: all 0.15s;
}
#na-panel .tab.active { color: #1a73e8; border-bottom-color: #1a73e8; font-weight: 500; }
#na-panel .tab .count { font-size: 11px; opacity: 0.6; margin-left: 4px; }
#na-panel .article-list { flex: 1; overflow-y: auto; padding: 4px 12px; }
#na-panel .article-item {
  display: flex; align-items: flex-start; gap: 10px;
  padding: 12px 14px; margin: 8px 12px; cursor: pointer;
  background: rgba(255,255,255,var(--na-card-opacity,0.88));
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  border: 1px solid rgba(255,255,255,0.4);
  transition: all 0.2s;
}
#na-panel .article-item:hover { box-shadow: 0 4px 14px rgba(0,0,0,0.14); transform: translateY(-1px); }
#na-panel .article-item:active { background: #ebebeb; }
#na-panel .article-item.read { background: #f8f8f8; }
#na-panel .article-item .dot {
  width: 8px; height: 8px; border-radius: 50%; background: #1a73e8;
  flex-shrink: 0; margin-top: 6px;
}
#na-panel .article-item .dot.read { background: transparent; }
#na-panel .article-item .content { flex: 1; min-width: 0; }
#na-panel .article-item .title { font-size: 14px; font-weight: 500; line-height: 1.4; margin-bottom: 4px; }
#na-panel .article-item .title.read { color: #999; font-weight: 400; }
#na-panel .article-item .meta { font-size: 12px; color: #888; display: flex; gap: 8px; align-items: center; }
#na-panel .article-item .meta .source { background: #e8f0fe; color: #1a73e8; padding: 0 6px; border-radius: 3px; font-size: 11px; }
#na-panel .article-item .star-btn {
  background: none; border: none; cursor: pointer; font-size: 16px; padding: 2px; flex-shrink: 0;
  opacity: 0.3; transition: opacity 0.15s;
}
#na-panel .article-item .star-btn.active { opacity: 1; }
#na-panel .empty { text-align: center; padding: 40px 20px; color: #999; font-size: 14px; }
#na-panel .progress-area {
  display: none; padding: 8px 20px 4px; flex-shrink: 0;
}
#na-panel .progress-area.show { display: block; }
#na-panel .refresh-btn[disabled] {
  opacity: 0.55; cursor: not-allowed; background: #f0f0f0;
}
@media (prefers-color-scheme: dark) {
  #na-panel .refresh-btn[disabled] { background: #2a2a2a; color: #888; }
}
#na-panel .header .close-btn {
  padding: 6px 10px; margin: -6px -6px -6px 0; border-radius: 6px;
}
#na-panel .header .close-btn:hover { background: rgba(0,0,0,0.06); }
@media (prefers-color-scheme: dark) {
  #na-panel .header .close-btn:hover { background: rgba(255,255,255,0.08); }
}
#na-panel .diag-area {
  display: none; padding: 8px 20px; flex-shrink: 0;
  border-top: 1px solid #e0e0e0; max-height: 200px; overflow-y: auto;
  font-size: 12px; background: rgba(255,255,255,0.6);
}
#na-panel .diag-area.show { display: block; }
#na-panel .diag-area .diag-row {
  display: flex; gap: 8px; align-items: flex-start; padding: 4px 0;
  border-bottom: 1px dashed rgba(0,0,0,0.06);
}
#na-panel .diag-area .diag-row:last-child { border-bottom: none; }
#na-panel .diag-area .diag-name { font-weight: 500; min-width: 70px; }
#na-panel .diag-area .diag-name.failed { color: #ea4335; }
#na-panel .diag-area .diag-msg {
  flex: 1; word-break: break-all; color: #555; font-family: ui-monospace, Menlo, Consolas, monospace; font-size: 11px;
}
#na-panel .diag-area .diag-copy {
  border: 1px solid #ccc; background: none; cursor: pointer;
  font-size: 11px; padding: 1px 6px; border-radius: 3px; color: inherit;
}
#na-panel .diag-area .diag-copy:hover { background: rgba(0,0,0,0.04); }
#na-panel .progress-bar-track {
  width: 100%; height: 6px; background: #e0e0e0; border-radius: 3px; overflow: hidden;
}
#na-panel .progress-bar-fill {
  height: 100%; background: #1a73e8; border-radius: 3px;
  transition: width 0.3s ease; width: 0%;
}
#na-panel .progress-sources {
  display: flex; gap: 8px; flex-wrap: wrap; margin-top: 6px; font-size: 12px;
}
#na-panel .progress-source {
  display: inline-flex; align-items: center; gap: 3px; padding: 2px 6px;
  border-radius: 4px; font-size: 11px; color: #999;
}
#na-panel .progress-source.pending { color: #999; }
#na-panel .progress-source.fetching { color: #1a73e8; font-weight: 500; }
#na-panel .progress-source.success { color: #34a853; }
#na-panel .progress-source.failed { color: #ea4335; }
#na-panel .progress-source .spinner {
  display: inline-block; width: 12px; height: 12px;
  border: 2px solid #1a73e8; border-top-color: transparent;
  border-radius: 50%; animation: na-spin 0.6s linear infinite;
}
@keyframes na-spin { to { transform: rotate(360deg); } }
@keyframes na-slide-in { from { transform: translateX(100%); } to { transform: translateX(0); } }
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
  _panel.innerHTML = _renderPanelHTML()
  document.body.appendChild(_panel)

  const _bgOpacity = Math.min(0.95, Math.max(0.1, ns.config.getConfig('ui.bgOpacity') ?? 0.55))
  const _cardOpacity = Math.min(0.95, Math.max(0.1, ns.config.getConfig('ui.cardOpacity') ?? 0.88))
  _panel.style.setProperty('--na-bg-opacity', _bgOpacity)
  _panel.style.setProperty('--na-card-opacity', _cardOpacity)

  _bindEvents()
  _renderArticles()
}

function closePanel() {
  if (!_panel) return
  _panel.remove()
  _panel = null
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
  const style = document.getElementById('na-panel-style')
  if (style) style.remove()
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
