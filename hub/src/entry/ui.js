;(function(ns) {
'use strict'

if (typeof GM_getValue === 'undefined' || typeof GM_setValue === 'undefined') {
  ns.log.error('GM API not available, aborting')
  return
}

const isBackground = (typeof location !== 'undefined') && (
  location.protocol === 'chrome-extension:' ||
  location.protocol === 'moz-extension:' ||
  location.protocol === 'about:'
)

if (isBackground) {
  ns.log.info('background page detected, skipping')
  return
}

function boot() {
  if (typeof document === 'undefined') return
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init)
  } else {
    init()
  }
}

function init() {
  try {
    ns.takeover.markActive()
    ns.takeover.purgeExpired()
  } catch (e) {
    ns.log.warn('takeover init failed', e)
  }

  try {
    ns.listener.start()
  } catch (e) {
    ns.log.warn('listener start failed', e)
  }

  try {
    ns.badge.refresh(true)
  } catch (e) {
    ns.log.warn('badge refresh failed', e)
  }

  try {
    ns.ui.button.createFloatingButton(() => ns.ui.panel.togglePanel())
    ns.ui.button.updateBadge()
  } catch (e) {
    ns.log.error('createFloatingButton failed', e)
  }

  try {
    _registerHotkeys()
  } catch (e) {
    ns.log.warn('hotkey register failed', e)
  }

  try {
    _registerMenuCommands()
  } catch (e) {
    ns.log.warn('menu register failed', e)
  }

  try {
    _startHeartbeat()
  } catch (e) {
    ns.log.warn('heartbeat failed', e)
  }

  try {
    _startBadgeRefresh()
  } catch (e) {
    ns.log.warn('badge refresh interval failed', e)
  }

  try {
    ns.listener.onDiscover((id, source) => {
      ns.log.info('script discovered', id, source)
      try { ns.badge.invalidate(id) } catch (e) {}
      try { ns.badge.refresh(true) } catch (e) {}
      try { ns.ui.button.updateBadge() } catch (e) {}
      try { ns.ui.panel.refresh() } catch (e) {}
    })
  } catch (e) {
    ns.log.warn('listener subscribe failed', e)
  }

  try {
    ns.detector.scanWindow().forEach((item) => {
      if (!ns.listener.isInstalled(item.id)) {
        try { ns.listener['_installed'] && ns.listener['_installed'].set(item.id, { loadedAt: item.loadedAt }) } catch (e) {}
      }
    })
    ns.badge.refresh(true)
    ns.ui.button.updateBadge()
    ns.ui.panel.refresh()
  } catch (e) {
    ns.log.warn('initial scan failed', e)
  }
}

function _registerHotkeys() {
  const toggleCombo = ns.config.getConfig('hotkey.togglePanel')
  if (toggleCombo) {
    ns.hotkey.register(toggleCombo, () => ns.ui.panel.togglePanel())
  }
  const firstCombo = ns.config.getConfig('hotkey.openFirst')
  if (firstCombo) {
    ns.hotkey.register(firstCombo, () => {
      const ids = ns.registry.getIds()
      const installed = ids.filter(id => ns.detector.isReady(id))
      if (installed[0]) {
        try { ns.detector.openScript(installed[0]) } catch (e) {}
      }
    })
  }
  const secondCombo = ns.config.getConfig('hotkey.openSecond')
  if (secondCombo) {
    ns.hotkey.register(secondCombo, () => {
      const ids = ns.registry.getIds()
      const installed = ids.filter(id => ns.detector.isReady(id))
      if (installed[1]) {
        try { ns.detector.openScript(installed[1]) } catch (e) {}
      }
    })
  }
}

function _registerMenuCommands() {
  if (typeof GM_registerMenuCommand !== 'function') return
  try {
    GM_registerMenuCommand('🐱 打开脚本集面板', () => ns.ui.panel.togglePanel())
    GM_registerMenuCommand('🐱 接管全部脚本', () => {
      const ids = ns.takeover.takeOverAll()
      ns.notify.notify('已接管', `下次刷新后生效，共 ${ids.length} 个`)
    })
    GM_registerMenuCommand('🐱 恢复全部脚本', () => {
      const ids = ns.takeover.restoreAll()
      ns.notify.notify('已恢复', `下次刷新后生效，共 ${ids.length} 个`)
    })
    GM_registerMenuCommand('🐱 重置 Hub 数据', () => {
      if (typeof confirm === 'function' && !confirm('确定重置所有 Hub 配置和数据？')) return
      try { GM_deleteValue(ns.constants.STORAGE.CONFIG) } catch (e) {}
      try { GM_deleteValue(ns.constants.STORAGE.FIRST_RUN) } catch (e) {}
      try { GM_deleteValue(ns.constants.STORAGE.ACTIVE_TS) } catch (e) {}
      try { GM_deleteValue(ns.constants.STORAGE.HIDDEN_SCRIPTS) } catch (e) {}
      ns.notify.notify('已重置', '请刷新页面')
    })
  } catch (e) {
    ns.log.warn('registerMenuCommand failed', e)
  }
}

function _startHeartbeat() {
  const interval = ns.config.getConfig('polling.heartbeatInterval') || 30000
  if (typeof setInterval !== 'function') return
  setInterval(() => {
    try { ns.takeover.markActive() } catch (e) {}
  }, interval)
}

function _startBadgeRefresh() {
  const interval = ns.config.getConfig('polling.badgeInterval') || 30000
  if (typeof setInterval !== 'function') return
  setInterval(() => {
    try { ns.badge.refresh(true) } catch (e) {}
    try { ns.ui.button.updateBadge() } catch (e) {}
    try { ns.ui.panel.refresh() } catch (e) {}
  }, interval)
}

try {
  boot()
} catch (e) {
  ns.log.error('boot failed', e)
}

})(CatHub)