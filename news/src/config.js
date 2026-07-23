;(function(ns) {

const DEFAULTS = {
  fetchInterval: 30,
  maxArticlesPerSource: 100,
  maxTotalArticles: 2000,
  retentionDays: 30,
  keywords: [],
  blacklist: [],
  notifyOnKeyword: true,
  digestDay: 1,
  digestHour: 8,
  sources: {
    bilibili:   { enabled: true,  order: 0 },
    baidu:      { enabled: true,  order: 1 },
    v2ex:       { enabled: true,  order: 2 },
    hackernews: { enabled: true,  order: 3 },
    github:     { enabled: true,  order: 4 },
    toutiao:    { enabled: true,  order: 5 },
    zhihu:      { enabled: false, order: 10 },
    weibo:      { enabled: false, order: 11 },
    tencent:    { enabled: false, order: 12 },
    netease:    { enabled: false, order: 13 },
    thepaper:   { enabled: false, order: 14 },
    wechat:     { enabled: false, order: 15 },
    douyin:     { enabled: false, order: 16 },
    xiaohongshu: { enabled: false, order: 17 },
    kr36:       { enabled: false, order: 18 },
    rss:        { enabled: false, order: 30, urls: [] },
  },
  ui: {
    position: 'bottom-right',
    maxDisplay: 50,
    theme: 'auto',
    bgOpacity: 0.55,
    cardOpacity: 0.88,
  },
}

const DISABLED_BY_DEFAULT = ['zhihu', 'weibo', 'tencent', 'netease', 'thepaper', 'wechat', 'douyin', 'xiaohongshu', 'kr36']

function getConfig(key) {
  const full = _loadConfig()
  if (!key) return full
  const keys = key.split('.')
  let val = full
  for (const k of keys) {
    if (val == null) return undefined
    val = val[k]
  }
  return val
}

function setConfig(key, value) {
  const full = getConfig()
  const keys = key.split('.')
  let cur = full
  for (let i = 0; i < keys.length - 1; i++) {
    if (!cur[keys[i]]) cur[keys[i]] = {}
    cur = cur[keys[i]]
  }
  cur[keys[keys.length - 1]] = value
  GM_setValue('config', full)
}

function resetConfig() {
  GM_setValue('config', DEFAULTS)
}

function _loadConfig() {
  const stored = GM_getValue('config', null)
  const full = stored || JSON.parse(JSON.stringify(DEFAULTS))
  if (!stored) {
    GM_setValue('config', full)
    return full
  }
  let changed = false
  if (!full.sources) {
    full.sources = JSON.parse(JSON.stringify(DEFAULTS.sources))
    changed = true
  } else {
    for (const name of DISABLED_BY_DEFAULT) {
      if (full.sources[name] && full.sources[name].enabled === true) {
        full.sources[name].enabled = false
        changed = true
      }
    }
    for (const [name, def] of Object.entries(DEFAULTS.sources)) {
      if (!full.sources[name]) {
        full.sources[name] = { ...def }
        changed = true
      }
    }
  }
  if (changed) GM_setValue('config', full)
  return full
}

ns.config = { getConfig, setConfig, resetConfig, DEFAULTS }
})(NewsAggregator)
