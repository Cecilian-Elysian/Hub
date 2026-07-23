;(function(ns) {

let _btn = null
let _badge = null
let _spinIcon = null
let _isDragging = false
let _dragOffset = { x: 0, y: 0 }
let _btnRefreshing = false
let _btnLastFetch = 0

const BTN_STYLE = `
#na-floating-btn {
  position: fixed;
  z-index: 2147483647;
  height: 44px;
  min-width: 44px;
  border-radius: 22px;
  background: #ec4899;
  color: #fff;
  border: none;
  cursor: pointer;
  box-shadow: 0 2px 12px rgba(236, 72, 153, 0.35);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 0 14px;
  font-size: 14px;
  font-weight: 500;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Microsoft YaHei", sans-serif;
  line-height: 1;
  letter-spacing: 0.5px;
  transition: transform 0.15s, box-shadow 0.15s, background 0.15s;
  user-select: none;
  touch-action: none;
  -webkit-user-select: none;
}
#na-floating-btn:hover {
  transform: scale(1.05);
  background: #db2777;
  box-shadow: 0 4px 20px rgba(236, 72, 153, 0.5);
}
#na-floating-btn svg.na-icon {
  width: 20px;
  height: 20px;
  fill: currentColor;
  flex-shrink: 0;
}
#na-floating-btn .label {
  display: inline-block;
  white-space: nowrap;
}
#na-floating-btn .badge {
  position: absolute;
  top: -4px;
  right: -4px;
  min-width: 18px;
  height: 18px;
  border-radius: 9px;
  background: #ea4335;
  color: #fff;
  font-size: 11px;
  line-height: 18px;
  text-align: center;
  padding: 0 4px;
  font-weight: 600;
  display: none;
  font-family: inherit;
}
#na-floating-btn .badge.show {
  display: block;
}
#na-floating-btn .spin-icon {
  position: absolute;
  top: -4px;
  left: -4px;
  width: 16px;
  height: 16px;
  border: 2px solid #1a73e8;
  border-top-color: transparent;
  border-radius: 50%;
  display: none;
  animation: na-btn-spin 0.8s linear infinite;
  background: #fff;
}
#na-floating-btn.refreshing .spin-icon { display: block; }
#na-floating-btn.refreshing .badge { display: none !important; }
@keyframes na-btn-spin { to { transform: rotate(360deg); } }
`

const NEWSPAPER_SVG = '<svg class="na-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M20 3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 4v10h-2V7h2zm-4 0v10h-2V7h2zm-4 0v10h-2V7h2zm-4 0v10H6V7h2z"/></svg>'

function createFloatingButton(onClick) {
  if (_btn) return _btn

  console.log('[NewsUI] createFloatingButton called', {
    readyState: document.readyState,
    hasBody: !!document.body,
    hasHead: !!document.head,
  })

  try {
    if (!document.getElementById('na-floating-btn-style')) {
      const style = document.createElement('style')
      style.id = 'na-floating-btn-style'
      style.textContent = BTN_STYLE
      ;(document.head || document.documentElement).appendChild(style)
    }

    _btn = document.createElement('button')
    _btn.id = 'na-floating-btn'
    _btn.type = 'button'
    _btn.setAttribute('aria-label', '新闻聚合')
    _btn.title = '新闻聚合'
    _btn.innerHTML = NEWSPAPER_SVG + '<span class="label">新闻</span>'

    _badge = document.createElement('span')
    _badge.className = 'badge'
    _btn.appendChild(_badge)

    _spinIcon = document.createElement('span')
    _spinIcon.className = 'spin-icon'
    _btn.appendChild(_spinIcon)

    const pos = ns.config.getConfig('ui.position') || 'bottom-right'
    const positions = {
      'bottom-right': { bottom: '20px', right: '20px' },
      'bottom-left': { bottom: '20px', left: '20px' },
      'top-right': { top: '20px', right: '20px' },
      'top-left': { top: '20px', left: '20px' },
    }
    Object.assign(_btn.style, positions[pos] || positions['bottom-right'])

    _btn.addEventListener('mousedown', _onDragStart)
    _btn.addEventListener('touchstart', _onTouchStart, { passive: true })
    _btn.addEventListener('click', (e) => {
      if (_isDragging) return
      onClick && onClick()
    })

    const mount = document.body || document.documentElement
    mount.appendChild(_btn)
    console.log('[NewsUI] button appended', mount === document.body ? 'body' : 'documentElement')
  } catch (e) {
    console.error('[NewsUI] createFloatingButton failed:', e)
    return null
  }

  try {
    updateBadge()
  } catch (e) {
    console.error('[NewsUI] updateBadge failed:', e)
  }

  return _btn
}

function updateBadge() {
  if (!_badge) return
  try {
    const count = ns.storage.getUnreadCount()
    if (count > 0) {
      _badge.textContent = count > 99 ? '99+' : count
      _badge.classList.add('show')
    } else {
      _badge.classList.remove('show')
    }
    _refreshTitle()
  } catch (e) {
    console.error('[NewsUI] updateBadge error:', e)
  }
}

function setRefreshState(isRefreshing) {
  _btnRefreshing = !!isRefreshing
  if (!_btn) return
  _btn.classList.toggle('refreshing', _btnRefreshing)
  _refreshTitle()
}

function setLastFetchTime(ts) {
  _btnLastFetch = ts || 0
  _refreshTitle()
}

function _refreshTitle() {
  if (!_btn) return
  const parts = ['新闻聚合']
  if (_btnRefreshing) parts.push('正在后台刷新…')
  if (_btnLastFetch > 0) parts.push('上次刷新: ' + ns.format.formatTime(_btnLastFetch))
  _btn.title = parts.join(' · ')
}

function _onTouchStart(e) {
  _isDragging = false
  const touch = e.touches[0]
  if (!touch) return
  const rect = _btn.getBoundingClientRect()
  _dragOffset.x = touch.clientX - rect.left
  _dragOffset.y = touch.clientY - rect.top

  function onTouchMove(ev) {
    const t = ev.touches[0]
    if (!t) return
    _isDragging = true
    _btn.style.left = (t.clientX - _dragOffset.x) + 'px'
    _btn.style.top = (t.clientY - _dragOffset.y) + 'px'
    _btn.style.right = 'auto'
    _btn.style.bottom = 'auto'
  }

  function onTouchEnd() {
    document.removeEventListener('touchmove', onTouchMove)
    document.removeEventListener('touchend', onTouchEnd)
    setTimeout(() => { _isDragging = false }, 0)
  }

  document.addEventListener('touchmove', onTouchMove, { passive: true })
  document.addEventListener('touchend', onTouchEnd, { passive: true })
}

function _onDragStart(e) {
  _isDragging = false
  const rect = _btn.getBoundingClientRect()
  _dragOffset.x = e.clientX - rect.left
  _dragOffset.y = e.clientY - rect.top

  function onMove(ev) {
    _isDragging = true
    _btn.style.left = (ev.clientX - _dragOffset.x) + 'px'
    _btn.style.top = (ev.clientY - _dragOffset.y) + 'px'
    _btn.style.right = 'auto'
    _btn.style.bottom = 'auto'
  }

  function onUp() {
    document.removeEventListener('mousemove', onMove)
    document.removeEventListener('mouseup', onUp)
    setTimeout(() => { _isDragging = false }, 0)
  }

  document.addEventListener('mousemove', onMove)
  document.addEventListener('mouseup', onUp)
}

function setFloatingButtonVisible(visible) {
  if (_btn) _btn.style.display = visible ? '' : 'none'
}

function destroyFloatingButton() {
  if (_btn) {
    _btn.remove()
    _btn = null
    _badge = null
  }
  const style = document.getElementById('na-floating-btn-style')
  if (style) style.remove()
}

ns.ui = ns.ui || {}
ns.ui.button = { createFloatingButton, updateBadge, setRefreshState, setLastFetchTime, destroyFloatingButton, setFloatingButtonVisible }
})(NewsAggregator)