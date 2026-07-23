;(function(ns) {

let _panel = null
let _open = false

const PANEL_STYLE = `
[data-cat-hub-panel] {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: var(--panel-width);
  max-width: 100vw;
  background: var(--panel-bg);
  -webkit-backdrop-filter: blur(var(--panel-blur));
  backdrop-filter: blur(var(--panel-blur));
  border-left: var(--panel-border);
  box-shadow: var(--shadow-panel);
  z-index: var(--z-panel);
  color: var(--panel-text);
  font-family: var(--font-stack);
  font-size: var(--fs-md);
  line-height: 1.5;
  display: none;
  flex-direction: column;
  transform: translateX(100%);
  transition: transform var(--transition-panel);
}
[data-cat-hub-panel].open {
  display: flex;
  transform: translateX(0);
}
@media (prefers-color-scheme: dark) {
  [data-cat-hub-panel] {
    background: rgba(28, 28, 30, 0.94);
    border-left-color: rgba(255, 255, 255, 0.12);
    color: #f5f5f7;
  }
}
[data-cat-hub-panel] .ch-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--sp-4);
  border-bottom: 1px solid var(--panel-divider);
  flex-shrink: 0;
}
[data-cat-hub-panel] .ch-header-title {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  font-weight: 600;
  font-size: var(--fs-xl);
}
[data-cat-hub-panel] .ch-header-title .ch-icon {
  width: 18px;
  height: 18px;
  stroke: currentColor;
}
[data-cat-hub-panel] .ch-close {
  background: transparent;
  border: none;
  color: inherit;
  cursor: pointer;
  padding: 4px;
  border-radius: var(--r-sm);
  opacity: 0.7;
  transition: opacity var(--transition-fast), background var(--transition-fast);
}
[data-cat-hub-panel] .ch-close:hover { opacity: 1; background: var(--panel-hover); }
[data-cat-hub-panel] .ch-close .ch-icon { width: 18px; height: 18px; }
[data-cat-hub-panel] .ch-body {
  flex: 1;
  overflow-y: auto;
  padding: var(--sp-2) 0;
}
[data-cat-hub-panel] .ch-card {
  display: flex;
  align-items: center;
  gap: var(--sp-3);
  padding: 10px var(--sp-4);
  cursor: pointer;
  transition: background var(--transition-fast);
  min-height: 64px;
  outline: none;
}
[data-cat-hub-panel] .ch-card:hover { background: var(--panel-hover); }
[data-cat-hub-panel] .ch-card:focus { background: var(--panel-hover); }
[data-cat-hub-panel] .ch-card.missing { opacity: 0.55; }
[data-cat-hub-panel] .ch-card.missing:hover { opacity: 0.9; }
[data-cat-hub-panel] .ch-card-icon {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
}
[data-cat-hub-panel] .ch-card-icon .ch-icon {
  width: 24px;
  height: 24px;
  stroke: currentColor;
  fill: none;
}
[data-cat-hub-panel] .ch-card-body { flex: 1; min-width: 0; }
[data-cat-hub-panel] .ch-card-name { font-weight: 600; font-size: var(--fs-lg); }
[data-cat-hub-panel] .ch-card-status { font-size: var(--fs-sm); opacity: 0.7; margin-top: 2px; }
[data-cat-hub-panel] .ch-card-action {
  background: var(--btn-toolbar-bg);
  color: var(--btn-toolbar-text);
  border: none;
  border-radius: var(--r-sm);
  padding: 6px var(--sp-3);
  font-size: var(--fs-sm);
  cursor: pointer;
  font-family: inherit;
  flex-shrink: 0;
  transition: background var(--transition-fast);
}
[data-cat-hub-panel] .ch-card-action:hover { background: var(--btn-toolbar-hover); }
[data-cat-hub-panel] .ch-card-action:disabled { opacity: 0.5; cursor: default; }
[data-cat-hub-panel] .ch-card.missing .ch-card-action {
  background: rgba(255, 255, 255, 0.08);
  color: inherit;
  opacity: 0.7;
}
[data-cat-hub-panel] .ch-card.taken-over .ch-card-action {
  background: rgba(236, 72, 153, 0.15);
  color: #f472b6;
}
[data-cat-hub-panel] .ch-divider {
  height: 1px;
  background: var(--panel-divider);
  margin: 4px var(--sp-4);
}
[data-cat-hub-panel] .ch-empty {
  padding: 32px var(--sp-4);
  text-align: center;
  opacity: 0.6;
  font-size: var(--fs-md);
}
[data-cat-hub-panel] .ch-footer {
  padding: var(--sp-3) var(--sp-4);
  border-top: 1px solid var(--panel-divider);
  font-size: var(--fs-xs);
  opacity: 0.5;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
[data-cat-hub-panel] .ch-onboarding {
  margin: var(--sp-3) var(--sp-4);
  padding: var(--sp-3);
  background: rgba(124, 58, 237, 0.12);
  border-radius: var(--r-md);
  font-size: var(--fs-sm);
  line-height: 1.6;
}
[data-cat-hub-panel] .ch-onboarding h3 { margin: 0 0 6px; font-size: var(--fs-md); }
[data-cat-hub-panel] .ch-onboarding ol { margin: 6px 0; padding-left: 18px; }
[data-cat-hub-panel] .ch-onboarding-close {
  margin-top: var(--sp-2);
  background: rgba(124, 58, 237, 0.3);
  color: #fff;
  border: none;
  border-radius: var(--r-sm);
  padding: 6px var(--sp-3);
  font-size: var(--fs-sm);
  cursor: pointer;
  font-family: inherit;
}
`

function openPanel() {
  if (_panel) {
    _render()
    _panel.classList.add('open')
    _open = true
    return _panel
  }
  if (typeof document === 'undefined') return null
  try {
    const style = document.createElement('style')
    style.id = ns.constants.UI.PANEL_ID + '-style'
    style.textContent = PANEL_STYLE
    ;(document.head || document.documentElement).appendChild(style)

    _panel = document.createElement('aside')
    _panel.id = ns.constants.UI.PANEL_ID
    _panel.setAttribute('data-cat-hub-panel', '')
    ;(document.body || document.documentElement).appendChild(_panel)
    _render()
    requestAnimationFrame(() => {
      _panel.classList.add('open')
      _open = true
    })
  } catch (e) {
    ns.log.error('openPanel failed', e)
    return null
  }
  try {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(ns.constants.EVENTS.HUB_OPEN))
    }
  } catch (e) {}
  return _panel
}

function closePanel() {
  if (!_panel) return
  _panel.classList.remove('open')
  _open = false
  try {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(ns.constants.EVENTS.HUB_CLOSE))
    }
  } catch (e) {}
}

function isOpen() {
  return _open
}

function togglePanel() {
  if (_open) closePanel()
  else openPanel()
}

function _render() {
  if (!_panel) return
  _panel.innerHTML = ''

  const header = document.createElement('div')
  header.className = 'ch-header'
  const title = document.createElement('div')
  title.className = 'ch-header-title'
  title.innerHTML = ns.icons.get('cat') + '<span>脚本集</span>'
  header.appendChild(title)
  const closeBtn = document.createElement('button')
  closeBtn.className = 'ch-close'
  closeBtn.type = 'button'
  closeBtn.setAttribute('aria-label', '关闭')
  closeBtn.innerHTML = ns.icons.get('x')
  closeBtn.addEventListener('click', closePanel)
  header.appendChild(closeBtn)
  _panel.appendChild(header)

  const body = document.createElement('div')
  body.className = 'ch-body'

  if (!_isFirstRunDone()) {
    body.appendChild(_renderOnboarding())
  }

  ns.badge.refresh(true)
  const allMeta = ns.registry.getAll()
  let hasInstalled = false

  for (const meta of allMeta) {
    const installed = ns.detector.isInstalled(meta.id)
    if (installed) hasInstalled = true
    const ready = installed && ns.detector.isReady(meta.id)
    const hidden = ns.takeover.isHidden(meta.id)
    const cardStats = installed ? ns.badge.get(meta.id) : null
    const card = ns.ui.card.render(meta, cardStats, { installed, ready, hidden })
    body.appendChild(card)
  }

  if (!hasInstalled && _isFirstRunDone()) {
    const empty = document.createElement('div')
    empty.className = 'ch-empty'
    empty.textContent = '尚未发现已安装的脚本'
    body.appendChild(empty)
  }

  _panel.appendChild(body)

  const footer = document.createElement('div')
  footer.className = 'ch-footer'
  const hotkey = ns.config.getConfig('hotkey.togglePanel') || 'Alt+Shift+H'
  const takeoverCount = ns.takeover.getHidden().length
  const totalCount = allMeta.length
  footer.innerHTML = `<span>接管 ${takeoverCount}/${totalCount}</span><span>${ns.format.escapeHtml(hotkey)}</span>`
  _panel.appendChild(footer)
}

function _renderOnboarding() {
  const wrap = document.createElement('div')
  wrap.className = 'ch-onboarding'
  const h = document.createElement('h3')
  h.textContent = '欢迎使用 Cecilian 脚本集 🐱'
  wrap.appendChild(h)
  const p = document.createElement('p')
  p.textContent = 'Hub 会自动发现已安装的脚本。在脚本猫中安装下方脚本后刷新本页即可：'
  wrap.appendChild(p)
  const ol = document.createElement('ol')
  for (const meta of ns.registry.getAll()) {
    const li = document.createElement('li')
    li.textContent = meta.name + (meta.installUrl ? '' : '（暂无安装链接）')
    ol.appendChild(li)
  }
  wrap.appendChild(ol)
  const btn = document.createElement('button')
  btn.className = 'ch-onboarding-close'
  btn.type = 'button'
  btn.textContent = '我知道了'
  btn.addEventListener('click', () => {
    try { GM_setValue(ns.constants.STORAGE.FIRST_RUN, true) } catch (e) {}
    _render()
  })
  wrap.appendChild(btn)
  return wrap
}

function _isFirstRunDone() {
  try {
    return GM_getValue(ns.constants.STORAGE.FIRST_RUN, false) === true
  } catch (e) {
    return true
  }
}

function refresh() {
  if (_open) _render()
}

function destroyPanel() {
  if (_panel) {
    try { _panel.remove() } catch (e) {}
    _panel = null
    _open = false
  }
  const style = typeof document !== 'undefined' ? document.getElementById(ns.constants.UI.PANEL_ID + '-style') : null
  if (style) {
    try { style.remove() } catch (e) {}
  }
}

ns.ui = ns.ui || {}
ns.ui.panel = { openPanel, closePanel, togglePanel, isOpen, refresh, destroyPanel }

})(CatHub)