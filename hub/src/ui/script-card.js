;(function(ns) {

function render(meta, stats, state) {
  state = state || {}
  const isInstalled = state.installed !== false
  const isReady = state.ready === true
  const isHiddenByHub = state.hidden === true

  const card = document.createElement('div')
  card.className = 'ch-card' + (isInstalled ? ' installed' : ' missing') + (isHiddenByHub ? ' taken-over' : '')
  card.dataset.scriptId = meta.id
  card.setAttribute('role', 'button')
  card.setAttribute('tabindex', '0')

  const iconWrap = document.createElement('div')
  iconWrap.className = 'ch-card-icon'
  iconWrap.style.color = meta.color || 'var(--ch-primary)'
  iconWrap.innerHTML = ns.icons.get(meta.icon) || ns.icons.get('package')
  card.appendChild(iconWrap)

  const body = document.createElement('div')
  body.className = 'ch-card-body'

  const name = document.createElement('div')
  name.className = 'ch-card-name'
  name.textContent = meta.name || meta.id
  body.appendChild(name)

  const status = document.createElement('div')
  status.className = 'ch-card-status'
  status.textContent = _statusText(meta, stats, state)
  body.appendChild(status)

  card.appendChild(body)

  const action = document.createElement('button')
  action.className = 'ch-card-action'
  action.type = 'button'
  if (isInstalled && isReady) {
    action.textContent = '打开'
    action.addEventListener('click', (e) => {
      e.stopPropagation()
      _open(meta)
    })
  } else if (isInstalled && !isReady) {
    action.textContent = '等待中'
    action.disabled = true
  } else {
    action.textContent = '安装'
    action.addEventListener('click', (e) => {
      e.stopPropagation()
      _install(meta)
    })
  }
  card.appendChild(action)

  if (isInstalled && isReady) {
    card.addEventListener('click', () => _open(meta))
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        _open(meta)
      }
    })
  }

  return card
}

function _statusText(meta, stats, state) {
  if (state.hidden) {
    return '已接管（Hub 控制）'
  }
  if (!state.installed) {
    return '未安装'
  }
  if (!state.ready) {
    return '已安装 · 等待启动'
  }
  if (stats && stats.primary) {
    const parts = []
    parts.push(ns.format.formatCount(stats.primary.count, stats.primary.label))
    if (stats.secondary && stats.secondary.count != null) {
      parts.push(ns.format.formatCount(stats.secondary.count, stats.secondary.label))
    }
    return parts.join(' · ')
  }
  return '已就绪'
}

function _open(meta) {
  try {
    if (ns.detector.openScript(meta.id)) {
      ns.log.info('opened', meta.id)
    } else {
      ns.notify.notify('打开失败', `${meta.name} 尚未就绪`)
    }
  } catch (e) {
    ns.log.error('open failed', meta.id, e)
  }
}

function _install(meta) {
  if (!meta.installUrl) {
    ns.notify.notify('无安装链接', `${meta.name} 未配置 installUrl`)
    return
  }
  try {
    if (typeof GM_openInTab === 'function') {
      GM_openInTab(meta.installUrl, { active: true, insert: true })
    } else if (typeof window !== 'undefined' && window.open) {
      window.open(meta.installUrl, '_blank', 'noopener')
    }
  } catch (e) {
    ns.log.error('install open failed', meta.id, e)
  }
}

ns.ui = ns.ui || {}
ns.ui.card = { render }

})(CatHub)