;(function(ns) {

let _btn = null
let _badge = null
let _isDragging = false
let _dragOffset = { x: 0, y: 0 }
let _mouseDownTime = 0
let _mouseDownPos = { x: 0, y: 0 }

const BTN_STYLE = `
#cat-hub-floating-btn {
  position: fixed;
  z-index: 2147483647;
  height: 44px;
  min-width: 44px;
  border-radius: 22px;
  background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #ec4899 100%);
  color: #fff;
  border: none;
  cursor: pointer;
  box-shadow: 0 2px 12px rgba(124, 58, 237, 0.35);
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
  transition: transform 0.15s, box-shadow 0.15s;
  user-select: none;
  touch-action: none;
  -webkit-user-select: none;
}
#cat-hub-floating-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 20px rgba(124, 58, 237, 0.5);
}
#cat-hub-floating-btn .ch-icon {
  width: 20px;
  height: 20px;
  stroke: currentColor;
  fill: none;
  flex-shrink: 0;
}
#cat-hub-floating-btn .label {
  display: inline-block;
  white-space: nowrap;
}
#cat-hub-floating-btn .badge {
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
}
#cat-hub-floating-btn .badge.show { display: block; }
`

function createFloatingButton(onClick) {
  if (_btn) return _btn
  if (typeof document === 'undefined') return null

  try {
    if (!document.getElementById(ns.constants.UI.STYLE_ID)) {
      const style = document.createElement('style')
      style.id = ns.constants.UI.STYLE_ID
      style.textContent = BTN_STYLE
      ;(document.head || document.documentElement).appendChild(style)
    }

    _btn = document.createElement('button')
    _btn.id = ns.constants.UI.BUTTON_ID
    _btn.type = 'button'
    _btn.setAttribute('aria-label', 'Cecilian 脚本集')
    _btn.title = 'Cecilian 脚本集'
    _btn.innerHTML = ns.icons.get('cat') + '<span class="label">Hub</span>'

    _badge = document.createElement('span')
    _badge.className = 'badge'
    _btn.appendChild(_badge)

    const pos = ns.config.getConfig('ui.position') || 'bottom-right'
    const positions = {
      'bottom-right': { bottom: '20px', right: '20px' },
      'bottom-left':  { bottom: '20px', left: '20px' },
      'top-right':    { top: '20px', right: '20px' },
      'top-left':     { top: '20px', left: '20px' },
    }
    Object.assign(_btn.style, positions[pos] || positions['bottom-right'])

    _btn.addEventListener('mousedown', _onDragStart)
    _btn.addEventListener('touchstart', _onTouchStart, { passive: true })
    _btn.addEventListener('click', (e) => {
      if (_isDragging) return
      if (Date.now() - _mouseDownTime > 300) return
      onClick && onClick()
    })

    const mount = document.body || document.documentElement
    mount.appendChild(_btn)
  } catch (e) {
    ns.log.error('createFloatingButton failed', e)
    return null
  }
  return _btn
}

function updateBadge() {
  if (!_badge) return
  if (!ns.config.getConfig('ui.showBadge')) {
    _badge.classList.remove('show')
    return
  }
  try {
    const total = ns.badge.totalUnread()
    if (total > 0) {
      _badge.textContent = total > 99 ? '99+' : String(total)
      _badge.classList.add('show')
    } else {
      _badge.classList.remove('show')
    }
  } catch (e) {
    _badge.classList.remove('show')
  }
}

function setFloatingButtonVisible(visible) {
  if (_btn) _btn.style.display = visible ? '' : 'none'
}

function destroyFloatingButton() {
  if (_btn) {
    try { _btn.remove() } catch (e) {}
    _btn = null
    _badge = null
  }
  const style = typeof document !== 'undefined' ? document.getElementById(ns.constants.UI.STYLE_ID) : null
  if (style) {
    try { style.remove() } catch (e) {}
  }
}

function _onTouchStart(e) {
  _isDragging = false
  _mouseDownTime = Date.now()
  const touch = e.touches && e.touches[0]
  if (!touch) return
  _mouseDownPos = { x: touch.clientX, y: touch.clientY }
  const rect = _btn.getBoundingClientRect()
  _dragOffset.x = touch.clientX - rect.left
  _dragOffset.y = touch.clientY - rect.top

  function onTouchMove(ev) {
    const t = ev.touches && ev.touches[0]
    if (!t) return
    if (Math.abs(t.clientX - _mouseDownPos.x) > 3 || Math.abs(t.clientY - _mouseDownPos.y) > 3) {
      _isDragging = true
    }
    if (_isDragging) {
      _btn.style.left = (t.clientX - _dragOffset.x) + 'px'
      _btn.style.top = (t.clientY - _dragOffset.y) + 'px'
      _btn.style.right = 'auto'
      _btn.style.bottom = 'auto'
    }
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
  _mouseDownTime = Date.now()
  _mouseDownPos = { x: e.clientX, y: e.clientY }
  const rect = _btn.getBoundingClientRect()
  _dragOffset.x = e.clientX - rect.left
  _dragOffset.y = e.clientY - rect.top

  function onMove(ev) {
    if (Math.abs(ev.clientX - _mouseDownPos.x) > 3 || Math.abs(ev.clientY - _mouseDownPos.y) > 3) {
      _isDragging = true
    }
    if (_isDragging) {
      _btn.style.left = (ev.clientX - _dragOffset.x) + 'px'
      _btn.style.top = (ev.clientY - _dragOffset.y) + 'px'
      _btn.style.right = 'auto'
      _btn.style.bottom = 'auto'
    }
  }

  function onUp() {
    document.removeEventListener('mousemove', onMove)
    document.removeEventListener('mouseup', onUp)
    setTimeout(() => { _isDragging = false }, 0)
  }

  document.addEventListener('mousemove', onMove)
  document.addEventListener('mouseup', onUp)
}

ns.ui = ns.ui || {}
ns.ui.button = { createFloatingButton, updateBadge, setFloatingButtonVisible, destroyFloatingButton }

})(CatHub)