;(function (ns) {
  'use strict'
  if (typeof GM_info === 'undefined') return

  const isBackground = location.protocol === 'chrome-extension:' ||
                       location.protocol === 'moz-extension:' ||
                       location.protocol === 'about:'
  if (!isBackground) return

  // Global aliases for experimental adapters that reference globals directly
  if (typeof window !== 'undefined') {
    window.extractKeywords = ns.format.extractKeywords
    window.simpleHash = ns.dedup.simpleHash
    window.BaseAdapter = ns.adapters.BaseAdapter
  }

  GM_log('[NewsCore] Background script started', 'info')

  ns.registry.registerAdapter('zhihu', ns.adapters.ZhihuAdapter)
  ns.registry.registerAdapter('weibo', ns.adapters.WeiboAdapter)
  ns.registry.registerAdapter('bilibili', ns.adapters.BilibiliAdapter)
  ns.registry.registerAdapter('baidu', ns.adapters.BaiduAdapter)
  ns.registry.registerAdapter('rss', ns.adapters.RssAdapter)

  const experimentalAdapters = [
    ['toutiao', 'ToutiaoAdapter'],
    ['tencent', 'TencentAdapter'],
    ['netease', 'NeteaseAdapter'],
    ['hackernews', 'HackernewsAdapter'],
    ['github', 'GithubAdapter'],
    ['wechat', 'WechatAdapter'],
    ['douyin', 'DouyinAdapter'],
    ['xiaohongshu', 'XiaohongshuAdapter'],
    ['v2ex', 'V2exAdapter'],
    ['kr36', 'Kr36Adapter'],
    ['thepaper', 'ThepaperAdapter'],
  ]
  for (const [name, className] of experimentalAdapters) {
    try {
      const AdapterClass = ns.adapters[className]
      if (AdapterClass) ns.registry.registerAdapter(name, AdapterClass)
    } catch (e) {
      GM_log(`[NewsCore] Failed to register adapter "${name}": ${e.message}`, 'warn')
    }
  }

  GM_addValueChangeListener('request_refresh', () => {
    ns.scheduler.runAllAdapters().then(r => {
      GM_log(`[NewsCore] Manual refresh: +${r.new}`, 'info')
    })
  })

  GM_addValueChangeListener('request_digest', () => {
    generateDigest().then(markdown => {
      if (markdown) {
        GM_setClipboard(markdown)
        GM_notification({
          title: '周报已生成',
          text: 'Markdown 已复制到剪贴板',
          timeout: 6000,
        })
      }
    })
  })

  ns.scheduler.runAllAdapters().then(r => {
    GM_log(`[NewsCore] Initial fetch: +${r.new}, failed: ${r.failed.join(',') || 'none'}`, 'info')
  })

  const fetchInterval = (ns.config.getConfig('fetchInterval') || 30) * 60 * 1000
  setInterval(() => {
    ns.scheduler.runAllAdapters().then(r => {
      if (r.new > 0) GM_log(`[NewsCore] Periodic fetch: +${r.new}`, 'info')
    })
  }, fetchInterval)

  setInterval(() => {
    try {
      const last = GM_getValue('digest', null)
      if (!last || Date.now() - last.generatedAt > 604800000) {
        generateDigest()
      }
    } catch (e) {
      GM_log(`[NewsCore] Digest check error: ${e.message}`, 'warn')
    }
  }, 6 * 60 * 60 * 1000)

  async function generateDigest() {
    try {
      const articles = GM_getValue('articles', [])
      const now = Date.now()
      const weekAgo = now - 604800000
      const weekArticles = articles.filter(a => (a.publishTime || a.fetchTime) >= weekAgo)
      if (weekArticles.length === 0) return null

      const markdown = ns.format.generateDigestMarkdown(weekArticles, weekAgo, now)
      ns.storage.saveDigest({
        generatedAt: now,
        dateRange: `${ns.format.formatDate(weekAgo)} - ${ns.format.formatDate(now)}`,
        count: weekArticles.length,
        markdown,
      })
      return markdown
    } catch (e) {
      GM_log(`[NewsCore] Digest error: ${e.message}`, 'error')
      return null
    }
  }
})(NewsAggregator)
