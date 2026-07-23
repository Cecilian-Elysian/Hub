;(function(ns) {

let _btn = null
let _isDragging = false
let _dragOffset = { x: 0, y: 0 }

const BTN_STYLE = `
[data-bm-btn] {
  position: fixed;
  z-index: var(--z-floating);
  height: 44px;
  min-width: 44px;
  border-radius: var(--r-full);
  background: var(--brand);
  color: #fff;
  border: none;
  cursor: pointer;
  box-shadow: var(--shadow-btn);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 0 14px;
  font-size: var(--fs-lg);
  font-weight: 500;
  font-family: var(--font-stack);
  line-height: 1;
  letter-spacing: 0.5px;
  transition: transform var(--transition-fast), box-shadow var(--transition-fast), background var(--transition-fast);
  user-select: none;
  touch-action: none;
  -webkit-user-select: none;
}
[data-bm-btn]:hover {
  transform: scale(1.05);
  background: var(--brand-hover);
  box-shadow: var(--shadow-btn-hover);
}
[data-bm-btn] svg.bm-icon {
  width: 20px;
  height: 20px;
  fill: currentColor;
  flex-shrink: 0;
}
[data-bm-btn] .label {
  display: inline-block;
  white-space: nowrap;
}
`

const ICON_SVG = '<svg class="bm-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2zm0 15-5-2.18L7 18V5h10v13z"/></svg>'

function createFloatingButton(onClick) {
  if (_btn) return _btn

  try {
    if (!document.getElementById('bm-floating-btn-style')) {
      const style = document.createElement('style')
      style.id = 'bm-floating-btn-style'
      style.textContent = BTN_STYLE
      ;(document.head || document.documentElement).appendChild(style)
    }

    _btn = document.createElement('button')
    _btn.id = 'bm-floating-btn'
    _btn.type = 'button'
    _btn.setAttribute('data-bm-btn', '')
    _btn.setAttribute('aria-label', '网址收藏')
    _btn.title = '网址收藏'
    _btn.innerHTML = ICON_SVG + '<span class="label">收藏</span>'

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
      onClick && onClick()
    })

    const mount = document.body || document.documentElement
    mount.appendChild(_btn)
  } catch (e) {
    GM_log('[BookmarkUI] createFloatingButton failed: ' + (e.message || e), 'error')
    return null
  }
  return _btn
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
  }
  const style = document.getElementById('bm-floating-btn-style')
  if (style) style.remove()
}

ns.ui = ns.ui || {}
ns.ui.button = { createFloatingButton, setFloatingButtonVisible, destroyFloatingButton }
})(BookmarkLogger)